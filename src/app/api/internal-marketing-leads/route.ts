import { NextResponse } from "next/server";
import { getInternalMarketingLeads, importInternalMarketingLeads, type InternalMarketingLeadPayload } from "@/lib/internal-marketing-leads";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(await getInternalMarketingLeads(), { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as InternalMarketingLeadPayload;
    return NextResponse.json(await importInternalMarketingLeads(payload), { headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        source: "internal_marketing_leads",
        error: error instanceof Error ? error.message : "Internal marketing lead import failed",
        counts: { imported: 0, scored: 0, good: 0, manualOnly: 0, skipped: 0 },
        results: [],
        skipped: [],
        importedAt: new Date().toISOString(),
        storage: "memory",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
