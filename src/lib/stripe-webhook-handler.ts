import Stripe from "stripe";
import { track } from "@vercel/analytics/server";
import { deliverStripeSession } from "@/lib/buyer-delivery";
import {
  markStripeEventProcessing,
  updateEntitlementForSubscription,
  updateEntitlementStatusBySubscriptionId,
} from "@/lib/premium-persistence";

export async function handleVerifiedStripeEvent(event: Stripe.Event) {
  const idempotency = await markStripeEventProcessing(event);
  if (!idempotency.shouldProcess) {
    return { received: true, duplicate: true };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid" || session.mode === "subscription") {
      const delivery = await deliverStripeSession(session);
      if (delivery.ok) {
        await track("premium_delivery_sent", {
          product: delivery.product,
          requestedProduct: delivery.requestedProduct,
          leadSlug: delivery.leadSlug,
        }).catch(() => undefined);
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await updateEntitlementForSubscription(
      subscription,
      event.type === "customer.subscription.deleted" ? "cancelled" : undefined,
    );
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
    const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
    if (subscriptionId) {
      await updateEntitlementStatusBySubscriptionId(subscriptionId, "past_due");
    }
  }

  return { received: true, duplicate: false };
}

export async function stripeWebhookResponse(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ received: true, mode: "demo" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  try {
    const event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
    const result = await handleVerifiedStripeEvent(event);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Webhook failed" }, { status: 400 });
  }
}
