import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { processDueSalesEmails, queueInactiveSubscriberEmails, salesOutboundConfig } from "@/lib/sales-pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const configuredLimit = salesOutboundConfig().dailyLimit || 25;
  const limit = Number(url.searchParams.get("limit") || String(configuredLimit));
  const inactive = await queueInactiveSubscriberEmails(Math.min(limit, 25)).catch((error) => ({
    queued: 0,
    error: error instanceof Error ? error.message : "Inactive subscriber queue failed.",
  }));
  const emails = await processDueSalesEmails({ limit });
  return NextResponse.json({ ok: true, inactive, emails });
}
