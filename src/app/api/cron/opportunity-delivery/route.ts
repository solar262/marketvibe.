import { NextResponse } from "next/server";
import { publishVerifiedBuyerIntentDeliveries } from "@/lib/buyer-intent-delivery";
import { requireCron } from "@/lib/cron-auth";
import { sendPendingPremiumDeliveryEmails } from "@/lib/premium-delivery-email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const published = await publishVerifiedBuyerIntentDeliveries({ trigger: "cron", sendEmail: false });
  const emailDelivery = await sendPendingPremiumDeliveryEmails();
  return NextResponse.json({ published, emailDelivery });
}
