import Stripe from "stripe";
import { addContactToMarketVibeList, addOrUpdateContact, scheduleBuyerSequence, sendTransactionalEmail } from "./brevo";
import {
  isLegacyProductCode,
  isPremiumProductCode,
  legacyProductMap,
  onboardingPathForProduct,
  premiumProductLabel,
  premiumProducts,
  type CheckoutProductCode,
  type PremiumProductCode,
} from "./premium-products";
import {
  recordCompletedPremiumOrder,
  upsertPremiumEntitlement,
} from "./premium-persistence";
import { appendCustomerAccessParams, createCustomerAccessToken } from "./customer-access";

export type MarketVibeProduct = CheckoutProductCode;

type DeliveryInput = {
  email: string;
  product: PremiumProductCode;
  requestedProduct?: CheckoutProductCode;
  leadSlug?: string;
  sessionId?: string;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.marketvibe1.com";

function accessUrl(product: PremiumProductCode, requestedProduct?: CheckoutProductCode, leadSlug?: string, sessionId?: string, email?: string) {
  if (requestedProduct === "audit" && leadSlug) return `${baseUrl}/audit/${leadSlug}?unlocked=1`;
  if (product === "proof_pack") return `${baseUrl}${onboardingPathForProduct("proof_pack", sessionId, email)}`;
  if (product === "radar") return `${baseUrl}${onboardingPathForProduct("radar", sessionId, email)}`;
  if (product === "growth_desk") return `${baseUrl}${onboardingPathForProduct("growth_desk", sessionId, email)}`;
  const accessToken = createCustomerAccessToken(email || "");
  return `${baseUrl}${appendCustomerAccessParams("/dashboard", email || "", accessToken)}`;
}

export function classifyStripeSession(session: Stripe.Checkout.Session): PremiumProductCode {
  const product = session.metadata?.product_code || session.metadata?.product || session.metadata?.plan;
  if (isPremiumProductCode(product)) return product;
  if (isLegacyProductCode(product)) return legacyProductMap[product];

  if (session.mode === "subscription") {
    const amount = session.amount_total || 0;
    return amount >= premiumProducts.growth_desk.amount ? "growth_desk" : "radar";
  }

  return "proof_pack";
}

export function requestedProductFromSession(session: Stripe.Checkout.Session): CheckoutProductCode {
  const requested = session.metadata?.requested_product || session.metadata?.product || session.metadata?.plan;
  if (isPremiumProductCode(requested) || isLegacyProductCode(requested)) return requested;
  return classifyStripeSession(session);
}

export async function sendBuyerDeliveryEmail({ email, product, requestedProduct, leadSlug, sessionId }: DeliveryInput) {
  const normalizedEmail = email.trim().toLowerCase();
  const label = premiumProductLabel(product);
  const access = accessUrl(product, requestedProduct, leadSlug, sessionId, normalizedEmail);
  const pricingUrl = `${baseUrl}/pricing`;
  const supportUrl = `${baseUrl}/contact`;
  const accessToken = createCustomerAccessToken(normalizedEmail);
  const dashboardUrl = `${baseUrl}${appendCustomerAccessParams("/dashboard", normalizedEmail, accessToken)}`;

  await addOrUpdateContact(normalizedEmail, {
    SOURCE: "stripe_buyer",
    PRODUCT: product,
    PLAN: product,
    REQUESTED_PRODUCT: requestedProduct || product,
    LEAD_SLUG: leadSlug || "",
    STRIPE_SESSION_ID: sessionId || "",
    FUNNEL_STAGE: "premium_buyer",
  });
  await addContactToMarketVibeList(normalizedEmail, {
    SOURCE: "stripe_buyer",
    PRODUCT: product,
    PLAN: product,
    STRIPE_SESSION_ID: sessionId || "",
    FUNNEL_STAGE: "premium_buyer",
  });

  const nextStep =
    product === "proof_pack"
      ? "Complete the onboarding form so we can prepare your buyer-intent pack without padding it with unverified results."
      : product === "growth_desk"
        ? "Complete the onboarding form so we can set up your niche, territory, and managed opportunity workflow."
        : "Open your dashboard to start reviewing scored buyer-intent opportunities.";

  const htmlContent = `
    <p>Hi,</p>
    <p>Your ${label} purchase is confirmed.</p>
    <p>${nextStep}</p>
    <p><a href="${access}">Continue with ${label}</a></p>
    <p>Dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
    <p>Pricing and upgrades: <a href="${pricingUrl}">${pricingUrl}</a></p>
    <p>Support: <a href="${supportUrl}">${supportUrl}</a></p>
    <p>MarketVibe</p>
  `;

  const textContent = `Hi,

Your ${label} purchase is confirmed.

${nextStep}

Continue:
${access}

Dashboard:
${dashboardUrl}

Pricing and upgrades:
${pricingUrl}

Support:
${supportUrl}

MarketVibe`;

  await sendTransactionalEmail({
    to: normalizedEmail,
    subject: `Your ${label} purchase is confirmed`,
    htmlContent,
    textContent,
  });
  await scheduleBuyerSequence(normalizedEmail);
}

export async function deliverStripeSession(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email || session.customer_email;
  if (!email) return { ok: false, error: "Stripe session has no customer email." };

  const product = classifyStripeSession(session);
  const requestedProduct = requestedProductFromSession(session);
  const leadSlug = session.metadata?.leadSlug || session.metadata?.lead_slug || session.client_reference_id || undefined;

  await recordCompletedPremiumOrder(session);
  await upsertPremiumEntitlement({
    email,
    productCode: product,
    status: "active",
    stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
    stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
    metadata: session.metadata || {},
  });

  await sendBuyerDeliveryEmail({
    email,
    product,
    requestedProduct,
    leadSlug,
    sessionId: session.id,
  });

  return { ok: true, email, product, requestedProduct, leadSlug: leadSlug || "" };
}
