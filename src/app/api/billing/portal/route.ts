import Stripe from "stripe";
import { NextResponse } from "next/server";
import { resolveCustomerAccess } from "@/lib/customer-access";
import { getPremiumEntitlements } from "@/lib/premium-persistence";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid billing request." }, { status: 400 });
  }

  const access = await resolveCustomerAccess({
    email: String(payload.email || ""),
    accessToken: String(payload.accessToken || ""),
    sessionId: String(payload.sessionId || ""),
  });
  if (!access.ok || !access.email) {
    return NextResponse.json({ error: "Secure customer access is required." }, { status: 403 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe billing portal is not configured." }, { status: 503 });
  }

  const entitlements = await getPremiumEntitlements(access.email);
  const stripeCustomerId = entitlements.find((item: { stripe_customer_id?: string | null }) => item.stripe_customer_id)?.stripe_customer_id;
  if (!stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer record was found for this access link." }, { status: 404 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://www.marketvibe1.com";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
