import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { runOperationsLearning } from "@/lib/operations-learning";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Data service is unavailable." }, { status: 503 });
  return NextResponse.json(await runOperationsLearning({ supabase }));
}
