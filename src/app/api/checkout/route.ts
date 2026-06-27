import Stripe from "stripe";
import { NextResponse } from "next/server";
import { hydrateCart, orderNumber } from "@/lib/checkout";
import { stripePaymentLinks } from "@/lib/checkout-links";
import type { MarketVibeProduct } from "@/lib/buyer-delivery";

const productConfig: Record<MarketVibeProduct, { name: string; amount: number; mode: "payment" | "subscription"; description: string }> = {
  audit: {
    name: "MarketVibe Full Audit Report",
    amount: 1900,
    mode: "payment",
    description: "Full lead details, scanner findings, outreach message, fix checklist, and report access.",
  },
  starter: {
    name: "MarketVibe Starter",
    amount: 1900,
    mode: "subscription",
    description: "50 lead opportunities per month for freelancers and service sellers.",
  },
  pro: {
    name: "MarketVibe Pro",
    amount: 4900,
    mode: "subscription",
    description: "250 lead opportunities per month for agencies and regular prospecting.",
  },
};

function isProduct(value: unknown): value is MarketVibeProduct {
  return value === "audit" || value === "starter" || value === "pro";
}

export async function POST(request: Request) {
  const { cart, customer, product = "audit", leadSlug = "" } = await request.json();
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://marketvibe.vercel.app";

  if (isProduct(product)) {
    const config = productConfig[product];

    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        mode: config.mode,
        customer_email: customer?.email,
        client_reference_id: leadSlug || product,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: config.amount,
              recurring: config.mode === "subscription" ? { interval: "month" } : undefined,
              product_data: {
                name: config.name,
                description: config.description,
              },
            },
          },
        ],
        metadata: {
          product,
          leadSlug,
        },
        success_url: `${origin}/payment-success?product=${product}&lead=${encodeURIComponent(leadSlug)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: leadSlug ? `${origin}/audit/${leadSlug}` : `${origin}/pricing`,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ url: stripePaymentLinks[product] });
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
