import { NextResponse } from "next/server";
import { runBuyerHunt } from "@/lib/buyer-hunt";
import { requireCron } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const markets = safeNumber(url.searchParams.get("markets"), 1, 1, 5);
  const leads = safeNumber(url.searchParams.get("leads"), 5, 1, 10);
  const results = await runBuyerHunt({ markets, leads });
  const savedBuyerCount = results.reduce((total, result) => total + (result.saved ? result.leadCount : 0), 0);

  return NextResponse.json({
    ok: results.every((result) => result.saved),
    mode: "buyer-hunt",
    note: "Finds potential MarketVibe buyers: web designers, SEO providers, marketing agencies, social media agencies, branding agencies, and related service sellers. It does not send emails.",
    savedBuyerCount,
    results,
  });
}
