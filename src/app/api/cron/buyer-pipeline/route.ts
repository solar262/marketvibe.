import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runBuyerPipelineWorker } from "@/lib/operations-pipeline";

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

  const result = await runBuyerPipelineWorker({ supabase, workerId: "cron-buyer-pipeline" });
  return NextResponse.json({ ok: true, job: "buyer-pipeline", result });
}
