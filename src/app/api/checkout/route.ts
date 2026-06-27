import Stripe from "stripe";
import { NextResponse } from "next/server";
import { hydrateCart, orderNumber } from "@/lib/checkout";
import type { MarketVibeProduct } from "@/lib/buyer-delivery";

const liveOrigin = "https://www.marketvibe1.com";

const productConfig: Record<MarketVibeProduct, {
  name: string;
  amount: number;
  mode: "payment" | "subscription";
  description: string;
  priceEnv: string;
}> = {
  audit: {
    name: "MarketVibe Full Audit Report",
    amount: 1900,
    mode: "payment",
    description: "Full lead details, scanner findings, outreach message, fix checklist, and report access.",
    priceEnv: "STRIPE_AUDIT_PRICE_ID",
  },
  starter: {
    name: "MarketVibe Starter",
    amount: 1900,
    mode: "subscription",
    description: "50 lead opportunities per month for freelancers and service sellers.",
    priceEnv: "STRIPE_STARTER_PRICE_ID",
  },
  pro: {
    name: "MarketVibe Pro",
    amount: 4900,
    mode: "subscription",
    description: "250 lead opportunities per month for agencies and regular prospecting.",
    priceEnv: "STRIPE_PRO_PRICE_ID",
  },
};

function isProduct(value: unknown): value is MarketVibeProduct {
  return value === "audit" || value === "starter" || value === "pro";
}

function checkoutOrigin(request: Request) {
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || liveOrigin;
  return origin.includes("localhost") ? origin : liveOrigin;
}

export async function POST(request: Request) {
  const { cart, customer, product = "audit", leadSlug = "" } = await request.json();
  const returnOrigin = checkoutOrigin(request);
  const items = hydrateCart(cart || []);
  const selectedProduct = isProduct(product) ? productConfig[product] : productConfig.audit;
  const selectedProductKey: MarketVibeProduct = isProduct(product) ? product : "audit";
  const number = orderNumber();

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ url: `${returnOrigin}/payment-success?order=${number}` });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const mode = items.length > 0 ? "payment" : selectedProduct.mode;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.length > 0
    ? items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        product_data: { name: item.product.title, description: item.product.description },
        unit_amount: Math.round(item.product.price * 100),
      },
    }))
    : [
      {
        quantity: 1,
        ...(process.env[selectedProduct.priceEnv]
          ? { price: process.env[selectedProduct.priceEnv] }
          : {
            price_data: {
              currency: "eur",
              product_data: { name: selectedProduct.name, description: selectedProduct.description },
              unit_amount: selectedProduct.amount,
              ...(selectedProduct.mode === "subscription" ? { recurring: { interval: "month" as const } } : {}),
            },
          }),
      },
    ];

  const session = await stripe.checkout.sessions.create({
    mode,
    customer_email: customer?.email,
    client_reference_id: leadSlug || selectedProductKey,
    line_items: lineItems,
    metadata: {
      order_number: number,
      customer_name: customer?.name || "",
      product: items.length > 0 ? "cart" : selectedProductKey,
      plan: items.length > 0 ? "cart" : selectedProductKey,
      leadSlug,
      lead_slug: leadSlug,
    },
    success_url: `${returnOrigin}/payment-success?order=${number}&product=${selectedProductKey}&lead=${encodeURIComponent(leadSlug)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: leadSlug ? `${returnOrigin}/audit/${leadSlug}` : `${returnOrigin}/${items.length > 0 ? "cart" : "pricing"}`,
  });

  return NextResponse.json({ url: session.url });
}
