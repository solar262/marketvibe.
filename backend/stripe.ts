import Stripe from 'stripe';

const stripeApiVersion = '2023-10-16';

export function isMockStripe() {
  return !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_mock');
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required for live Stripe operations.');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: stripeApiVersion as Stripe.LatestApiVersion });
}

export async function createProofCheckout(niche: string, email: string) {
  const price = niche === 'Enterprise' ? 9900 : 4900;

  if (isMockStripe()) {
    const sessionId = `mock_proof_${Date.now()}`;
    return `${publicUrl()}/thank-you?session_id=${sessionId}`;
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `Proof Pack (${niche})` },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    success_url: `${publicUrl()}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicUrl()}/sample?cancelled=true`,
    metadata: { niche },
  });

  return session.url;
}

export async function createRadarSubscriptionCheckout(plan: string, email: string) {
  const priceByPlan: Record<string, number> = {
    radar: 29900,
    growth: 75000,
    partner: 250000,
  };

  const unitAmount = priceByPlan[plan] || priceByPlan.radar;

  if (isMockStripe()) {
    const sessionId = `mock_subscription_${plan}_${Date.now()}`;
    return `${publicUrl()}/thank-you?session_id=${sessionId}&plan=${encodeURIComponent(plan)}`;
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          recurring: { interval: 'month' },
          product_data: { name: `MarketVibe ${plan}` },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    success_url: `${publicUrl()}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicUrl()}/pricing?cancelled=true`,
    metadata: { plan },
    subscription_data: {
      metadata: { plan },
    },
  });

  return session.url;
}

export async function createCustomerPortal(customerId: string, returnUrl?: string) {
  if (isMockStripe()) {
    return `${returnUrl || publicUrl()}/account?portal=mock`;
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${publicUrl()}/workspace`,
  });

  return session.url;
}

function publicUrl() {
  return process.env.PUBLIC_URL || 'http://127.0.0.1:5175';
}
