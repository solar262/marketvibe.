import { NextResponse } from "next/server";
import { runAutopilotLeadHunt } from "@/lib/autopilot";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;

  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

function safeNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const url = new URL(request.url);
  const maxMarkets = safeNumber(url.searchParams.get("markets"), 2, 1, 6);
  const maxLeadsPerMarket = safeNumber(url.searchParams.get("leads"), 4, 1, 8);

  const result = await runAutopilotLeadHunt({ maxMarkets, maxLeadsPerMarket });

  return NextResponse.json({
    ok: true,
    mode: "autopilot-lead-hunt",
    note: "This route searches configured markets, scans public business websites, scores opportunities, and saves results when Supabase is connected.",
    ...result,
  });
}
