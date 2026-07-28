import { NextResponse } from "next/server";
import { runLeadHunt } from "@/lib/autopilot";
import { requireCron } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const markets = Number(url.searchParams.get("markets") || "4");
  const leads = Number(url.searchParams.get("leads") || "8");
  const rotationOffset = Number(url.searchParams.get("rotationOffset") || url.searchParams.get("rotation_offset") || "0");
  const customSearchTerm = url.searchParams.get("customSearchTerm") || url.searchParams.get("custom_search_term") || "";
  const results = await runLeadHunt({ markets, leads, customSearchTerm, rotationOffset });
  const savedLeadCount = results.reduce((total, result) => total + (result.saved ? result.leads.length : 0), 0);

  return NextResponse.json({
    ok: results.every((result) => result.saved),
    savedLeadCount,
    rotationOffset,
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
