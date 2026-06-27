import { NextResponse } from "next/server";
import { runLeadHunt } from "@/lib/autopilot";

export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const markets = Number(url.searchParams.get("markets") || "1");
  const leads = Number(url.searchParams.get("leads") || "2");
  const results = await runLeadHunt({ markets, leads });
  const savedLeadCount = results.reduce((total, result) => total + (result.saved ? result.leads.length : 0), 0);

  return NextResponse.json({
    ok: results.every((result) => result.saved),
    savedLeadCount,
    results: results.map((result) => ({
      market: result.market,
      sourceStatus: result.sourceStatus,
      sourceNote: result.sourceNote,
      saved: result.saved,
      savedSearchRunId: result.savedSearchRunId,
      error: result.error,
      leadCount: result.leads.length,
      auditSlugs: result.leads.map((lead) => lead.slug),
    })),
  });
}

