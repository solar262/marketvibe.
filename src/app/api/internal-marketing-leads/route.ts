import { NextResponse } from "next/server";
import { getInternalMarketingLeads, importInternalMarketingLeads, type InternalMarketingLeadPayload } from "@/lib/internal-marketing-leads";
import { hasInternalApiAccess, INTERNAL_CORS_HEADERS } from "@/lib/internal-access";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: INTERNAL_CORS_HEADERS });
}

export async function GET(request: Request) {
  if (!(await hasInternalApiAccess(request))) {
    return NextResponse.json({ error: "Internal access required" }, { status: 401, headers: INTERNAL_CORS_HEADERS });
  }
  return NextResponse.json(await getInternalMarketingLeads(), { headers: INTERNAL_CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    if (!(await hasInternalApiAccess(request))) {
      return NextResponse.json({ error: "Internal access required" }, { status: 401, headers: INTERNAL_CORS_HEADERS });
    }
    const payload = (await request.json()) as InternalMarketingLeadPayload;
    return NextResponse.json(await importInternalMarketingLeads(payload), { headers: INTERNAL_CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        source: "internal_marketing_leads",
        error: error instanceof Error ? error.message : "Internal marketing lead import failed",
        counts: { imported: 0, scored: 0, good: 0, manualOnly: 0, skipped: 0 },
        results: [],
        skipped: [],
        importedAt: new Date().toISOString(),
        storage: "unavailable",
      },
      { status: 400, headers: INTERNAL_CORS_HEADERS },
    );
  }
}
