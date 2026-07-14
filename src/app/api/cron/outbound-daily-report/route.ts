import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { sendOutboundDailyReport } from "@/lib/outbound-daily-report";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const result = await sendOutboundDailyReport();
  return NextResponse.json({
    mode: "outbound_daily_report",
    ...result,
  });
}
