import Stripe from "stripe";
import { classifyStripeSession } from "@/lib/buyer-delivery";
import { getPremiumEntitlement } from "@/lib/premium-persistence";
import { isPremiumProductCode, type PremiumProductCode } from "@/lib/premium-products";

export function productFromOnboardingSlug(slug: string): PremiumProductCode | null {
  if (slug === "proof-pack") return "proof_pack";
  if (slug === "radar") return "radar";
  if (slug === "growth-desk") return "growth_desk";
  return null;
}

export async function verifyPremiumAccess({
  productCode,
  sessionId,
  email,
}: {
  productCode: PremiumProductCode;
  sessionId?: string | null;
  email?: string | null;
}) {
  if (sessionId === "demo" && process.env.NODE_ENV !== "production") {
    return { ok: true, email: email || "", productCode, source: "demo" as const };
  }

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionProduct = classifyStripeSession(session);
    const sessionEmail = session.customer_details?.email || session.customer_email || "";
    const paid = session.payment_status === "paid" || session.mode === "subscription";
    if (paid && sessionProduct === productCode && sessionEmail) {
      return { ok: true, email: sessionEmail, productCode, source: "stripe_session" as const };
    }
  }

  if (email && isPremiumProductCode(productCode)) {
    const entitlement = await getPremiumEntitlement(email, productCode);
    if (entitlement) {
      return { ok: true, email, productCode, source: "entitlement" as const };
    }
  }

  return { ok: false, email: email || "", productCode, source: "none" as const };
}
