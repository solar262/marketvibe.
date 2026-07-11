import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { sendDailyRadarEmail } from "@/lib/radar-email";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const result = await sendDailyRadarEmail();
  return NextResponse.json(result);
}
