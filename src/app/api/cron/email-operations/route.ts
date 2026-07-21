import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { runEmailOperations } from "@/lib/operations-email";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase server access is not configured." }, { status: 503 });
  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limit") || 50), 1), 100);
  return NextResponse.json(await runEmailOperations({ supabase, limit }));
}
