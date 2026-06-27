import Stripe from "stripe";
import { addContactToMarketVibeList, addOrUpdateContact, sendTransactionalEmail } from "./brevo";

export type MarketVibeProduct = "audit" | "starter" | "pro";

type DeliveryInput = {
  email: string;
  product: MarketVibeProduct;
  leadSlug?: string;
  sessionId?: string;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://marketvibe1.com";

function productLabel(product: MarketVibeProduct) {
  if (product === "starter") return "MarketVibe Starter";
  if (product === "pro") return "MarketVibe Pro";
  return "MarketVibe Full Audit Report";
}

function accessUrl(product: MarketVibeProduct, leadSlug?: string) {
  if (product === "audit" && leadSlug) return `${baseUrl}/audit/${leadSlug}?unlocked=1`;
  if (product === "starter" || product === "pro") return `${baseUrl}/dashboard?plan=${product}`;
  return `${baseUrl}/lead-search`;
}

export function classifyStripeSession(session: Stripe.Checkout.Session): MarketVibeProduct {
  const product = session.metadata?.product;
  if (product === "starter" || product === "pro" || product === "audit") return product;

  if (session.mode === "subscription") {
    const amount = session.amount_total || 0;
    return amount >= 4900 ? "pro" : "starter";
  }

  return "audit";
}

export async function sendBuyerDeliveryEmail({ email, product, leadSlug, sessionId }: DeliveryInput) {
  const normalizedEmail = email.trim().toLowerCase();
  const label = productLabel(product);
  const access = accessUrl(product, leadSlug);
  const leadSearchUrl = `${baseUrl}/lead-search`;
  const pricingUrl = `${baseUrl}/pricing`;
  const supportUrl = `${baseUrl}/contact`;

  await addOrUpdateContact(normalizedEmail, {
    SOURCE: "stripe_buyer",
    PRODUCT: product,
    PLAN: product,
    LEAD_SLUG: leadSlug || "",
    STRIPE_SESSION_ID: sessionId || "",
  });
  await addContactToMarketVibeList(normalizedEmail, {
    SOURCE: "stripe_buyer",
    PRODUCT: product,
    PLAN: product,
  });

  const htmlContent = `
    <p>Hi,</p>
    <p>Your ${label} access is ready.</p>
    <p><a href="${access}">Open your MarketVibe access</a></p>
    <p>You can also run new searches here: <a href="${leadSearchUrl}">${leadSearchUrl}</a></p>
    <p>To upgrade or compare plans: <a href="${pricingUrl}">${pricingUrl}</a></p>
    <p>If anything looks wrong, use support here: <a href="${supportUrl}">${supportUrl}</a></p>
    <p>MarketVibe</p>
  `;

  const textContent = `Hi,

Your ${label} access is ready.

Open your MarketVibe access:
${access}

Run new searches:
${leadSearchUrl}

Upgrade or compare plans:
${pricingUrl}

Support:
${supportUrl}

MarketVibe`;

  await sendTransactionalEmail({
    to: normalizedEmail,
    subject: `Your ${label} access is ready`,
    htmlContent,
    textContent,
  });
}

export async function deliverStripeSession(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email || session.customer_email;
  if (!email) return { ok: false, error: "Stripe session has no customer email." };

  const product = classifyStripeSession(session);
  const leadSlug = session.metadata?.leadSlug || session.client_reference_id || undefined;

  await sendBuyerDeliveryEmail({
    email,
    product,
    leadSlug,
    sessionId: session.id,
  });

  return { ok: true, email, product, leadSlug: leadSlug || "" };
}
