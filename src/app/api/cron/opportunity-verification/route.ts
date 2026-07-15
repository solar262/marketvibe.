import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { runBuyerIntentVerification } from "@/lib/buyer-intent-discovery";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json(await runBuyerIntentVerification({ trigger: "cron" }));
}
