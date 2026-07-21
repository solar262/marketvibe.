export type PremiumProductCode = "proof_pack" | "radar" | "growth_desk";
export type LegacyProductCode = "audit" | "starter" | "pro";
// Public checkout accepts only the current buyer-intent products. Legacy codes
// remain available below solely to classify historical Stripe sessions.
export type CheckoutProductCode = PremiumProductCode;

export type PremiumEntitlement = "proof_pack" | "radar" | "growth_desk";

export type PremiumProduct = {
  code: PremiumProductCode;
  stripeName: string;
  amount: number;
  currency: "eur";
  mode: "payment" | "subscription";
  description: string;
  entitlement: PremiumEntitlement;
  successDestination: string;
};

export const premiumProducts: Record<PremiumProductCode, PremiumProduct> = {
  proof_pack: {
    code: "proof_pack",
    stripeName: "MarketVibe Proof Pack",
    amount: 9900,
    currency: "eur",
    mode: "payment",
    description: "One-off niche test with a focused opportunity shortlist, buyer context, source links where available, and outreach angles.",
    entitlement: "proof_pack",
    successDestination: "/onboarding/proof-pack",
  },
  radar: {
    code: "radar",
    stripeName: "MarketVibe Radar",
    amount: 29900,
    currency: "eur",
    mode: "subscription",
    description: "Ongoing buyer-intent dashboard access with scored opportunities, pain summaries, saved opportunities, and CSV export.",
    entitlement: "radar",
    successDestination: "/onboarding/radar",
  },
  growth_desk: {
    code: "growth_desk",
    stripeName: "MarketVibe Growth Desk",
    amount: 75000,
    currency: "eur",
    mode: "subscription",
    description: "Managed buyer-intent queue, custom niche and territory tracking, weekly reports, and priority support.",
    entitlement: "growth_desk",
    successDestination: "/onboarding/growth-desk",
  },
};

export const legacyProductMap: Record<LegacyProductCode, PremiumProductCode> = {
  audit: "proof_pack",
  starter: "radar",
  pro: "growth_desk",
};

export const legacyProductLabels: Record<LegacyProductCode, string> = {
  audit: "MarketVibe legacy audit",
  starter: "MarketVibe legacy Starter",
  pro: "MarketVibe legacy Pro",
};

export function isPremiumProductCode(value: unknown): value is PremiumProductCode {
  return value === "proof_pack" || value === "radar" || value === "growth_desk";
}

export function isAutonomousCheckoutProduct(value: unknown): value is Exclude<PremiumProductCode, "growth_desk"> {
  return value === "proof_pack" || value === "radar";
}

export function isLegacyProductCode(value: unknown): value is LegacyProductCode {
  return value === "audit" || value === "starter" || value === "pro";
}

export function normalizeCheckoutProduct(value: unknown): PremiumProductCode {
  if (isPremiumProductCode(value)) return value;
  if (isLegacyProductCode(value)) return legacyProductMap[value];
  return "proof_pack";
}

export function premiumProductLabel(code: PremiumProductCode) {
  return premiumProducts[code].stripeName;
}

export function onboardingPathForProduct(code: PremiumProductCode, sessionId?: string, email?: string) {
  const params = new URLSearchParams();
  if (sessionId) params.set("session_id", sessionId);
  if (email) params.set("email", email);
  const query = params.toString();
  return `${premiumProducts[code].successDestination}${query ? `?${query}` : ""}`;
}
