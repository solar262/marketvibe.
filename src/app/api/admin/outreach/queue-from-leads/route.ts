import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { queueOutreach } from "@/lib/outreach";

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase server writes are not configured." }, { status: 500 });

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || "10"), 50));
  const { data, error } = await supabase
    .from("leads")
    .select("id,business_name,website,contact_page_url,public_email,audits(id,subject_line,outreach_message)")
    .not("public_email", "is", null)
    .limit(limit);

  if (error || !data) return NextResponse.json({ ok: false, error: error?.message || "Saved leads could not be read." }, { status: 500 });

  const results = [];
  for (const lead of data) {
    const audit = Array.isArray(lead.audits) ? lead.audits[0] : lead.audits;
    if (!lead.public_email || !audit?.outreach_message) continue;
    const result = await queueOutreach({
      leadId: String(lead.id),
      auditId: audit.id ? String(audit.id) : undefined,
      recipientEmail: String(lead.public_email),
      recipientName: String(lead.business_name || ""),
      businessName: String(lead.business_name || ""),
      website: String(lead.website || ""),
      contactPageUrl: String(lead.contact_page_url || ""),
      subject: String(audit.subject_line || `Quick website audit for ${lead.business_name}`),
      bodyText: String(audit.outreach_message),
      source: "saved_lead",
      metadata: { queuedFrom: "admin_saved_leads" },
    });
    results.push({ email: lead.public_email, businessName: lead.business_name, ...result });
  }

  return NextResponse.json({
    ok: true,
    queued: results.filter((result) => result.queued).length,
    skipped: results.filter((result) => result.skipped).length,
    results,
  });
}

