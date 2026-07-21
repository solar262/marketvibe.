import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runContinuousSupply } from "@/lib/operations-supply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase server access is not configured." }, { status: 503 });
  return NextResponse.json(await runContinuousSupply({ supabase }));
}
