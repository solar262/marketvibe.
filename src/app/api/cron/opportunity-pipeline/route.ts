import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { runOpportunityAutomationPipeline } from "@/lib/opportunity-automation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const publishDeliveries = url.searchParams.get("publish") === "1";
  const sendEmail = url.searchParams.get("sendEmail") === "1";

  return NextResponse.json(await runOpportunityAutomationPipeline({
    trigger: "cron",
    publishDeliveries,
    sendEmail,
  }));
}
