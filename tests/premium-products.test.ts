import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Stripe from "stripe";
import { buildCheckoutSessionParams } from "../src/lib/premium-checkout";
import { classifyStripeSession, requestedProductFromSession } from "../src/lib/buyer-delivery";
import { isAutonomousCheckoutProduct, normalizeCheckoutProduct, premiumProducts } from "../src/lib/premium-products";
import { createCustomerAccessToken, verifyCustomerAccessToken } from "../src/lib/customer-access";
import { resolveProofPackPrice } from "../src/lib/proof-pack-pricing";
import { sampleRequestRowFromStripeSession } from "../src/lib/premium-persistence";
import { buildProofPackPdfBuffer } from "../src/lib/proof-pack-delivery";
import { DAILY_RADAR_SQL } from "../src/lib/radar-email";

function fakeSession(input: Partial<Stripe.Checkout.Session>): Stripe.Checkout.Session {
  return input as Stripe.Checkout.Session;
}

const origin = "https://www.marketvibe1.com";
const originalProofPackPrices = process.env.PROOF_PACK_NICHE_PRICES_JSON;
delete process.env.PROOF_PACK_NICHE_PRICES_JSON;

const proofPack = buildCheckoutSessionParams({
  product: "proof_pack",
  customer: { email: "buyer@example.com" },
  returnOrigin: origin,
  order: "MV-TEST-PROOF",
});

assert.equal(proofPack.mode, "payment");
assert.equal(proofPack.customer_email, "buyer@example.com");
assert.equal(proofPack.metadata?.product_code, "proof_pack");
assert.equal(proofPack.metadata?.requested_product, "proof_pack");
assert.equal(proofPack.line_items?.[0]?.price_data?.currency, "eur");
assert.equal(proofPack.line_items?.[0]?.price_data?.unit_amount, 9900);
assert.match(proofPack.success_url || "", /\/payment-success\?/);
assert.doesNotMatch(proofPack.success_url || "", /lead-search/);

const configuredProofPackPrice = resolveProofPackPrice(
  "B2B SaaS Agencies in Germany",
  JSON.stringify({ "b2b saas agencies in germany": 14900, default: 9900 }),
);
assert.equal(configuredProofPackPrice.amount, 14900);
assert.equal(configuredProofPackPrice.matchedKey, "b2b saas agencies in germany");

process.env.PROOF_PACK_NICHE_PRICES_JSON = JSON.stringify({ "b2b saas agencies in germany": 14900, default: 9900 });
const nicheProofPack = buildCheckoutSessionParams({
  product: "proof_pack",
  customer: { email: "buyer@example.com" },
  niche: "B2B SaaS Agencies in Germany",
  returnOrigin: origin,
  order: "MV-TEST-PROOF-NICHE",
});
assert.equal(nicheProofPack.line_items?.[0]?.price_data?.unit_amount, 14900);
assert.equal(nicheProofPack.metadata?.niche, "B2B SaaS Agencies in Germany");
assert.equal(nicheProofPack.metadata?.pricing_key, "b2b saas agencies in germany");
delete process.env.PROOF_PACK_NICHE_PRICES_JSON;

const radar = buildCheckoutSessionParams({
  product: "radar",
  customer: { email: "buyer@example.com" },
  returnOrigin: origin,
  order: "MV-TEST-RADAR",
});

assert.equal(radar.mode, "subscription");
assert.equal(radar.metadata?.product_code, "radar");
assert.equal(radar.line_items?.[0]?.price_data?.unit_amount, 29900);
assert.deepEqual(radar.line_items?.[0]?.price_data?.recurring, { interval: "month" });
assert.equal(radar.subscription_data?.metadata?.product_code, "radar");

assert.equal(isAutonomousCheckoutProduct("proof_pack"), true);
assert.equal(isAutonomousCheckoutProduct("radar"), true);
assert.equal(isAutonomousCheckoutProduct("growth_desk"), false);
assert.throws(() => buildCheckoutSessionParams({
  product: "growth_desk",
  customer: { email: "buyer@example.com" },
  returnOrigin: origin,
  order: "MV-TEST-GROWTH",
}), /autonomous delivery/);

const legacyAudit = buildCheckoutSessionParams({
  product: "audit",
  leadSlug: "legacy-lead",
  returnOrigin: origin,
  order: "MV-TEST-LEGACY",
});

assert.equal(legacyAudit.metadata?.product_code, "proof_pack");
assert.equal(legacyAudit.metadata?.requested_product, "proof_pack");
assert.equal(legacyAudit.metadata?.legacy_product, undefined);
assert.equal(legacyAudit.__marketvibe.premiumProduct, "proof_pack");
assert.equal(legacyAudit.line_items?.[0]?.price_data?.product_data?.name, "MarketVibe Proof Pack");

assert.equal(normalizeCheckoutProduct("audit"), "proof_pack");
assert.equal(normalizeCheckoutProduct("starter"), "radar");
assert.equal(normalizeCheckoutProduct("pro"), "growth_desk");
assert.equal(premiumProducts.proof_pack.amount, 9900);
assert.equal(premiumProducts.radar.amount, 29900);
assert.equal(premiumProducts.growth_desk.amount, 75000);

assert.equal(
  classifyStripeSession(fakeSession({ mode: "payment", metadata: { product_code: "proof_pack" } })),
  "proof_pack",
);
assert.equal(
  classifyStripeSession(fakeSession({ mode: "subscription", amount_total: 29900, metadata: { product: "radar" } })),
  "radar",
);
assert.equal(
  classifyStripeSession(fakeSession({ mode: "subscription", amount_total: 75000, metadata: { product: "growth_desk" } })),
  "growth_desk",
);
assert.equal(
  classifyStripeSession(fakeSession({ mode: "payment", metadata: { product: "audit" } })),
  "proof_pack",
);
assert.equal(
  requestedProductFromSession(fakeSession({ mode: "payment", metadata: { requested_product: "audit", product_code: "proof_pack" } })),
  "proof_pack",
);

const paidSampleRequest = sampleRequestRowFromStripeSession(fakeSession({
  id: "cs_test_paid",
  mode: "payment",
  amount_total: 14900,
  currency: "eur",
  customer_email: "Buyer@Example.com",
  metadata: {
    product_code: "proof_pack",
    customer_name: "Buyer Name",
    niche: "B2B SaaS Agencies in Germany",
  },
}));
assert.equal(paidSampleRequest?.customer_email, "buyer@example.com");
assert.equal(paidSampleRequest?.status, "paid");
assert.equal(paidSampleRequest?.amount_total, 14900);
assert.equal(paidSampleRequest?.niche, "B2B SaaS Agencies in Germany");
assert.equal(sampleRequestRowFromStripeSession(fakeSession({ id: "cs_cart", customer_email: "buyer@example.com", metadata: { product_code: "cart" } })), null);

const proofPackPdf = buildProofPackPdfBuffer({
  request: {
    id: "sample-request-test",
    customer_email: "buyer@example.com",
    niche: "B2B SaaS Agencies in Germany",
    paid_at: "2026-07-11T08:00:00Z",
  },
  leads: [
    {
      company_name: "Northstar Test Systems",
      website: "https://example.com",
      intent_score: 91,
      evidence_summary: "Fictional public test evidence from lead_vault.",
    },
  ],
});
assert.equal(proofPackPdf.subarray(0, 4).toString("latin1"), "%PDF");
assert.ok(proofPackPdf.length > 500);

assert.equal(
  DAILY_RADAR_SQL,
  "SELECT * FROM lead_vault WHERE created_at >= now() - interval '24 hours' AND intent_score >= 85 ORDER BY intent_score DESC LIMIT 30",
);
const proofPackCronSource = readFileSync(join(process.cwd(), "src", "app", "api", "cron", "proof-pack-delivery", "route.ts"), "utf8");
assert.match(proofPackCronSource, /requireCron/, "Proof-Pack PDF cron must be protected by cron authentication.");
const radarCronSource = readFileSync(join(process.cwd(), "src", "app", "api", "cron", "daily-radar-email", "route.ts"), "utf8");
assert.match(radarCronSource, /requireCron/, "Daily Radar email cron must be protected by cron authentication.");
const radarEmailSource = readFileSync(join(process.cwd(), "src", "lib", "radar-email.ts"), "utf8");
assert.match(radarEmailSource, /SENDGRID_DAILY_RADAR_TEMPLATE_ID/, "Daily Radar email must use a SendGrid template ID.");
const checkoutRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "checkout", "route.ts"), "utf8");
assert.match(checkoutRouteSource, /Checkout is temporarily unavailable/, "Production checkout must fail closed when Stripe is not configured.");
assert.match(checkoutRouteSource, /process\.env\.NODE_ENV === "production"/, "Demo checkout fallback must not run in production.");
assert.match(checkoutRouteSource, /Choose a current MarketVibe product/, "Public checkout must reject retired legacy product codes.");
assert.match(checkoutRouteSource, /Growth Desk is not available for purchase/, "Growth Desk must not be sold before autonomous delivery is complete.");
const autopilotCronSource = readFileSync(join(process.cwd(), "src", "app", "api", "cron", "autopilot", "route.ts"), "utf8");
assert.match(autopilotCronSource, /requireCron/, "Autopilot cron route must be protected by cron authentication.");
const vercelConfigSource = readFileSync(join(process.cwd(), "vercel.json"), "utf8");
assert.doesNotMatch(vercelConfigSource, /\/api\/cron\/autopilot/, "Placeholder autopilot cron must not be scheduled in production.");
const migrationSource = readFileSync(join(process.cwd(), "supabase", "migrations", "0011_proof_pack_radar_email.sql"), "utf8");
assert.match(migrationSource, /create table if not exists sample_requests/, "Proof-Pack checkout migration must create sample_requests.");
assert.match(migrationSource, /create table if not exists lead_vault/, "Daily Radar migration must create lead_vault.");

process.env.CUSTOMER_ACCESS_SECRET = "test-customer-access-secret";
const token = createCustomerAccessToken("Buyer@Example.com");
assert.ok(token);
assert.equal(verifyCustomerAccessToken("buyer@example.com", token), true);
assert.equal(verifyCustomerAccessToken("other@example.com", token), false);

if (originalProofPackPrices === undefined) delete process.env.PROOF_PACK_NICHE_PRICES_JSON;
else process.env.PROOF_PACK_NICHE_PRICES_JSON = originalProofPackPrices;

console.log("Premium product checkout and classification tests passed.");
