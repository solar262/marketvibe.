import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { insertPaidSampleRequest, upsertUserPlan, type Plan } from '../backend/db.ts';
import { getStripe, isMockStripe } from '../backend/stripe.ts';

export async function stripeWebhookHandler(req: Request, res: Response) {
  const event = parseStripeEvent(req);

  switch (event.type) {
    case 'checkout.session.completed':
      handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'invoice.payment_failed':
      handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      handleSubscriptionChanged(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return res.json({ received: true });
}

function parseStripeEvent(req: Request) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const signature = req.header('stripe-signature');

  if (process.env.STRIPE_WEBHOOK_SECRET && signature && !isMockStripe()) {
    return getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  }

  return JSON.parse(rawBody.toString()) as Stripe.Event;
}

function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const niche = session.metadata?.niche;
  const plan = normalizePlan(session.metadata?.plan);
  const email = session.customer_email || session.customer_details?.email || undefined;
  const customerId = typeof session.customer === 'string' ? session.customer : undefined;

  if (niche) {
    insertPaidSampleRequest({
      email: email || 'unknown@marketvibe.local',
      niche,
      stripeSessionId: session.id,
      payload: session,
    });
  }

  if (plan) {
    upsertUserPlan({
      email,
      stripeCustomerId: customerId,
      plan,
    });
  }
}

function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : undefined;
  const email = invoice.customer_email || undefined;
  upsertUserPlan({ email, stripeCustomerId: customerId, plan: 'free' });
}

function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : undefined;
  const plan = normalizePlan(subscription.metadata?.plan) || 'radar';
  const active = ['active', 'trialing'].includes(subscription.status);

  upsertUserPlan({
    stripeCustomerId: customerId,
    plan: active ? plan : 'free',
  });
}

function normalizePlan(value: unknown): Plan | null {
  if (value === 'radar' || value === 'growth' || value === 'partner') return value;
  return null;
}
