import { NextResponse } from "next/server";
import { emailWebhookAuthorized, processEmailProviderWebhook } from "@/lib/operations-email";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!emailWebhookAuthorized(request, rawBody)) return NextResponse.json({ ok: false, error: "Invalid email webhook authentication." }, { status: 401 });
  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase server access is not configured." }, { status: 503 });
  const result = await processEmailProviderWebhook({ supabase, request, payload });
  return NextResponse.json(result);
}
