import Stripe from "stripe";
import { NextResponse } from "next/server";
import { buildCheckoutSessionParams, checkoutOrigin } from "@/lib/premium-checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: {
    cart?: unknown;
    customer?: { email?: string; name?: string };
    product?: unknown;
    niche?: string;
    leadSlug?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  const returnOrigin = checkoutOrigin(request);
  const params = buildCheckoutSessionParams({
    cart: Array.isArray(payload.cart) ? payload.cart : [],
    customer: payload.customer,
    product: payload.product,
    niche: String(payload.niche || ""),
    leadSlug: payload.leadSlug || "",
    returnOrigin,
  });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      url: `${returnOrigin}/payment-success?order=${params.__marketvibe.orderNumber}&product=${params.__marketvibe.premiumProduct}&session_id=demo`,
      mode: "demo",
    });
  }

  const stripeParams = { ...params } as Omit<typeof params, "__marketvibe"> & { __marketvibe?: unknown };
  delete stripeParams.__marketvibe;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create(stripeParams);

  return NextResponse.json({ url: session.url });
}
