import assert from "node:assert/strict";
import Stripe from "stripe";
import { buildCheckoutSessionParams } from "../src/lib/premium-checkout";
import { classifyStripeSession, requestedProductFromSession } from "../src/lib/buyer-delivery";
import { normalizeCheckoutProduct, premiumProducts } from "../src/lib/premium-products";
import { createCustomerAccessToken, verifyCustomerAccessToken } from "../src/lib/customer-access";

function fakeSession(input: Partial<Stripe.Checkout.Session>): Stripe.Checkout.Session {
  return input as Stripe.Checkout.Session;
}

const origin = "https://www.marketvibe1.com";

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

const growthDesk = buildCheckoutSessionParams({
  product: "growth_desk",
  customer: { email: "buyer@example.com" },
  returnOrigin: origin,
  order: "MV-TEST-GROWTH",
});

assert.equal(growthDesk.mode, "subscription");
assert.equal(growthDesk.metadata?.product_code, "growth_desk");
assert.equal(growthDesk.line_items?.[0]?.price_data?.unit_amount, 75000);
assert.deepEqual(growthDesk.line_items?.[0]?.price_data?.recurring, { interval: "month" });

const legacyAudit = buildCheckoutSessionParams({
  product: "audit",
  leadSlug: "legacy-lead",
  returnOrigin: origin,
  order: "MV-TEST-LEGACY",
});

assert.equal(legacyAudit.metadata?.product_code, "proof_pack");
assert.equal(legacyAudit.metadata?.requested_product, "audit");
assert.equal(legacyAudit.metadata?.legacy_product, "audit");
assert.equal(legacyAudit.__marketvibe.premiumProduct, "proof_pack");

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
  "audit",
);

process.env.CUSTOMER_ACCESS_SECRET = "test-customer-access-secret";
const token = createCustomerAccessToken("Buyer@Example.com");
assert.ok(token);
assert.equal(verifyCustomerAccessToken("buyer@example.com", token), true);
assert.equal(verifyCustomerAccessToken("other@example.com", token), false);

console.log("Premium product checkout and classification tests passed.");
