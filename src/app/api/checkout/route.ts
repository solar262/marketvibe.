import Stripe from "stripe";
import { NextResponse } from "next/server";
import { buildCheckoutSessionParams, checkoutOrigin } from "@/lib/premium-checkout";
import { isAutonomousCheckoutProduct } from "@/lib/premium-products";
import { recordCheckoutStarted, sendCheckoutStartedEmail } from "@/lib/revenue-automation";

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

  const cart = Array.isArray(payload.cart) ? payload.cart : [];
  if (payload.product === "growth_desk") {
    return NextResponse.json({ error: "Growth Desk is not available for purchase until delivery is fully autonomous." }, { status: 409 });
  }
  if (cart.length === 0 && !isAutonomousCheckoutProduct(payload.product)) {
    return NextResponse.json({ error: "Choose a current MarketVibe product." }, { status: 400 });
  }

  const returnOrigin = checkoutOrigin(request);
  const params = buildCheckoutSessionParams({
    cart,
    customer: payload.customer,
    product: payload.product,
    niche: String(payload.niche || ""),
    leadSlug: payload.leadSlug || "",
    returnOrigin,
  });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
    }

    return NextResponse.json({
      url: `${returnOrigin}/payment-success?order=${params.__marketvibe.orderNumber}&product=${params.__marketvibe.premiumProduct}&session_id=demo`,
      mode: "demo",
    });
  }

  const stripeParams = { ...params } as Omit<typeof params, "__marketvibe"> & { __marketvibe?: unknown };
  delete stripeParams.__marketvibe;
  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.create(stripeParams);

  await Promise.allSettled([
    recordCheckoutStarted({
      email: payload.customer?.email,
      name: payload.customer?.name,
      productCode: params.__marketvibe.premiumProduct,
      requestedProduct: params.__marketvibe.requestedProduct,
      stripeSessionId: session.id,
      checkoutUrl: session.url,
      orderNumber: params.__marketvibe.orderNumber,
      niche: String(payload.niche || ""),
    }),
    sendCheckoutStartedEmail({
      email: payload.customer?.email,
      name: payload.customer?.name,
      productCode: params.__marketvibe.premiumProduct,
      requestedProduct: params.__marketvibe.requestedProduct,
      stripeSessionId: session.id,
      checkoutUrl: session.url,
      orderNumber: params.__marketvibe.orderNumber,
      niche: String(payload.niche || ""),
    }),
  ]).then((results) => {
    for (const result of results) {
      if (result.status === "rejected") console.warn("checkout_revenue_automation_failed", result.reason);
    }
  });

  return NextResponse.json({ url: session.url });
}
