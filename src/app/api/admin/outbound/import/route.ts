import Papa from "papaparse";
import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { createOutboundSalesProspect } from "@/lib/sales-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normaliseRow(row: Record<string, unknown>) {
  return {
    email: row.email || row.Email || row["Email Address"] || row.email_address,
    name: row.name || row.Name || row.contact || row.Contact,
    companyName: row.companyName || row.company_name || row.company || row.Company || row["Company Name"],
    website: row.website || row.Website || row.domain || row.Domain,
    country: row.country || row.Country,
    region: row.region || row.Region,
    sourceUrl: row.sourceUrl || row.source_url || row.SourceUrl || row.url || row.URL || row.linkedin || row.LinkedIn,
    sourceEvidence: row.sourceEvidence || row.source_evidence || row.evidence || row.Evidence || row.signal || row.Signal || row.notes || row.Notes,
    targetIndustry: row.targetIndustry || row.target_industry || row.niche || row.Niche || row.industry || row.Industry,
    companySize: row.companySize || row.company_size || row.size || row.Size,
    serviceOffered: row.serviceOffered || row.service_offered || row.service || row.Service,
    averageClientValue: row.averageClientValue || row.average_client_value || row.value || row.Value,
    weeklyOutreachCapacity: row.weeklyOutreachCapacity || row.weekly_outreach_capacity,
    currentLeadGenerationMethod: row.currentLeadGenerationMethod || row.current_lead_generation_method,
    metadata: row,
  };
}

function parseRows(csv: string) {
  const clean = csv.trim();
  if (!clean) return [];

  if (!clean.includes(",")) {
    return clean.split(/\r?\n/).map((line) => ({ email: line.trim() })).filter((row) => row.email);
  }

  const parsed = Papa.parse<Record<string, unknown>>(clean, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  return (parsed.data || []).map(normaliseRow);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({})) as { csv?: string; rows?: Record<string, unknown>[] };
    const rows = Array.isArray(body.rows) ? body.rows.map(normaliseRow) : parseRows(String(body.csv || ""));
    if (rows.length === 0) return NextResponse.json({ error: "Paste CSV rows before importing." }, { status: 400 });

    const imported = [];
    const failures = [];
    for (const row of rows.slice(0, 500)) {
      try {
        imported.push(await createOutboundSalesProspect(row));
      } catch (error) {
        failures.push({
          email: String(row.email || ""),
          error: error instanceof Error ? error.message : "Import failed.",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      imported: imported.length,
      rejected: failures.length,
      leads: imported.map((item) => item.lead),
      failures,
    });
  } catch (error) {
    return safeApiError(error, "Could not import outbound prospects.");
  }
}
