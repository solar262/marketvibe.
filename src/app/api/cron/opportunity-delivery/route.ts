import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { publishDueOpportunityDeliveries } from "@/lib/opportunity-engine";
import { sendPendingPremiumDeliveryEmails } from "@/lib/premium-delivery-email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const published = await publishDueOpportunityDeliveries({ trigger: "cron", sendEmail: false });
  const emailDelivery = await sendPendingPremiumDeliveryEmails();
  return NextResponse.json({ published, emailDelivery });
}
