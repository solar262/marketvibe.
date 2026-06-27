import Stripe from "stripe";
import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { deliverStripeSession } from "@/lib/buyer-delivery";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: true, mode: "demo" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  try {
    const event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const delivery = await deliverStripeSession(session);
      console.log("mark_order_paid", session.metadata?.order_number);

      if (delivery.ok) {
        await track("buyer_delivery_sent", {
          product: delivery.product,
          leadSlug: delivery.leadSlug,
        }).catch(() => undefined);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook failed" }, { status: 400 });
  }
}
