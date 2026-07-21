import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { ensureBuyerPipelineJobs } from "@/lib/buyer-pipeline-recovery";
import { backfillImportedBuyerCompanies, runBuyerPipelineWorker } from "@/lib/operations-pipeline";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      ok: false,
      status: "Blocked",
      message: "Supabase server writes are not configured, so buyer pipeline state cannot persist.",
    }, { status: 500 });
  }

  const backfill = await backfillImportedBuyerCompanies({ supabase });
  const recovery = await ensureBuyerPipelineJobs({ supabase });
  const requestedLimit = Number(new URL(request.url).searchParams.get("limit") || 5);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 20) : 5;
  const result = await runBuyerPipelineWorker({ supabase, workerId: "cron-buyer-pipeline", limit });
  return NextResponse.json({ ok: true, job: "buyer-pipeline", backfill, recovery, result });
}
