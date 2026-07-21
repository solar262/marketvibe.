import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const onboarding = source("src", "app", "api", "onboarding", "route.ts");
assert.doesNotMatch(onboarding, /getLatestSavedLeads|saveProofPackItems|autoFulfillImportedProspectsForOnboarding/);
assert.match(onboarding, /fillCustomerShortages/);

const dashboard = source("src", "app", "dashboard", "page.tsx");
assert.doesNotMatch(dashboard, /getProofPackItems|getDeliveredProspectsForCustomer|Imported customer delivery/);
assert.match(dashboard, /getCustomerOpportunityDeliveries/);
assert.match(dashboard, /redirect\(`\/legacy-delivery/);

const buyerDelivery = source("src", "lib", "buyer-delivery.ts");
assert.doesNotMatch(buyerDelivery, /\/audit\/\$\{leadSlug\}/);
assert.doesNotMatch(buyerDelivery, /recordPaidSampleRequestFromSession/);
assert.match(buyerDelivery, /legacyProductMap\[requested\]/, "Historical Stripe codes must normalize to current entitlements.");

const checkout = source("src", "lib", "premium-checkout.ts");
assert.doesNotMatch(checkout, /legacyProductLabels|legacy_product|isLegacyProductCode/);

const importPublish = source("src", "app", "api", "admin", "import", "publish", "route.ts");
assert.match(importPublish, /status: 410/);
assert.match(importPublish, /Opportunity Engine/);

const vercel = source("vercel.json");
for (const retired of ["proof-pack-delivery", "daily-radar-email", "imported-prospect-fulfillment"]) {
  assert.doesNotMatch(vercel, new RegExp(`/api/cron/${retired}`));
}

assert.equal(existsSync(join(process.cwd(), "src", "app", "legacy-delivery", "page.tsx")), true);
const legacyPage = source("src", "app", "legacy-delivery", "page.tsx");
assert.match(legacyPage, /Historical MarketVibe delivery/);
assert.doesNotMatch(legacyPage, /CheckoutButton|Buy Proof Pack/);

const auditPage = source("src", "app", "audit", "[slug]", "page.tsx");
assert.doesNotMatch(auditPage, /CheckoutButton|Buy Proof Pack/);
assert.match(auditPage, /Legacy website-audit preview/);

const opportunityEngine = source("src", "lib", "opportunity-engine.ts");
assert.match(opportunityEngine, /navigator_bridge_disabled_for_new_model/);
assert.match(opportunityEngine, /policy: "internal_research_only"/);
assert.doesNotMatch(
  opportunityEngine.slice(
    opportunityEngine.indexOf("export async function syncApprovedNavigatorProspectsToOpportunities"),
    opportunityEngine.indexOf("export async function createOrUpdateSearchProfileFromOnboarding"),
  ),
  /from\("premium_imported_prospects"\)|from\("opportunities"\)/,
);

const buyerRecovery = source("src", "lib", "buyer-pipeline-recovery.ts");
assert.match(buyerRecovery, /\.is\("source_imported_prospect_id", null\)/);

const operationsPipeline = source("src", "lib", "operations-pipeline.ts");
assert.match(operationsPipeline, /legacy_lead_stock_not_new_model_opportunity/);

console.log("Old and new MarketVibe product models are separated.");
