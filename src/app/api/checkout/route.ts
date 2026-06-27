import Stripe from "stripe";
import { NextResponse } from "next/server";
import { hydrateCart, orderNumber } from "@/lib/checkout";
import { leadSettings } from "@/lib/lead-engine";

export async function POST(request: Request) {
  const { cart, customer, product = "audit", leadSlug } = await request.json();
  const origin = request.headers.get("origin") || "http://localhost:3000";

  const leadProducts = {
    audit: {
      name: "MarketVibe Full Audit Report",
      amount: leadSettings.reportPrice,
      mode: "payment" as const,
      successPath: leadSlug ? `/audit/${leadSlug}?unlocked=1` : "/dashboard?unlocked=1",
    },
    starter: {
      name: "MarketVibe Starter",
      amount: leadSettings.starterPrice,
      mode: "subscription" as const,
      successPath: "/dashboard?plan=starter",
    },
    pro: {
      name: "MarketVibe Pro",
      amount: leadSettings.proPrice,
      mode: "subscription" as const,
      successPath: "/dashboard?plan=pro",
    },
  };

  if (product in leadProducts && !cart) {
    const selected = leadProducts[product as keyof typeof leadProducts];
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ url: `${origin}${selected.successPath}` });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: selected.mode,
      customer_email: customer?.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          recurring: selected.mode === "subscription" ? { interval: "month" } : undefined,
          product_data: { name: selected.name },
          unit_amount: Math.round(selected.amount * 100),
        },
      }],
      metadata: { product, lead_slug: leadSlug || "" },
      success_url: `${origin}${selected.successPath}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  }

  const items = hydrateCart(cart || []);
  if (items.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

  const number = orderNumber();
  const paymentLink = process.env.STRIPE_PAYMENT_LINK_URL;

  if (paymentLink) {
    const url = new URL(paymentLink);
    url.searchParams.set("client_reference_id", number);
    if (customer?.email) {
      url.searchParams.set("prefilled_email", customer.email);
    }
    return NextResponse.json({ url: url.toString(), order: number });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ url: `${origin}/success?order=${number}` });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customer?.email,
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        product_data: { name: item.product.title, description: item.product.description },
        unit_amount: Math.round(item.product.price * 100),
      },
    })),
    metadata: { order_number: number, customer_name: customer?.name || "" },
    success_url: `${origin}/success?order=${number}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
  });

  return NextResponse.json({ url: session.url });
}
