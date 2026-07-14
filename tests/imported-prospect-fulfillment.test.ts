import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  importedProspectAutoMatchScore,
  importedProspectMatchesFulfillmentProfile,
} from "../src/lib/sales-navigator-persistence";

const matchingProspect = {
  id: "prospect-1",
  company_name: "Bright Works Construction",
  job_title: "Managing Director",
  industry: "Construction and builder services",
  location: "Manchester, United Kingdom",
  country: "United Kingdom",
  city: "Manchester",
  public_signal_text: "Visible Sales Navigator result matched property and construction buyer profile.",
  evidence_summary: "Public signal supplied in the CSV.",
  source_note: "Captured as MarketVibe supply lead.",
  review_status: "approved",
  evidence_status: "public_signal_verified",
  fit_score: 85,
  intent_score: 80,
};

const profile = {
  niche: "construction companies",
  country: "United Kingdom",
  city: "Manchester",
  serviceOffer: "lead generation for builders",
  idealBuyer: "construction company owners",
};

assert.ok(importedProspectAutoMatchScore(matchingProspect, profile) >= 45);
assert.equal(importedProspectMatchesFulfillmentProfile(matchingProspect, profile), true);
assert.equal(importedProspectMatchesFulfillmentProfile({ ...matchingProspect, evidence_status: "profile_only" }, profile), false);
assert.equal(importedProspectMatchesFulfillmentProfile({ ...matchingProspect, review_status: "pending" }, profile), false);
assert.equal(importedProspectMatchesFulfillmentProfile({ ...matchingProspect, is_test_data: true }, profile), false);
assert.equal(importedProspectMatchesFulfillmentProfile(matchingProspect, { ...profile, niche: "dental clinics", serviceOffer: "practice management", idealBuyer: "dentists" }), false);

const persistenceSource = readFileSync(join(process.cwd(), "src", "lib", "sales-navigator-persistence.ts"), "utf8");
assert.match(persistenceSource, /autoFulfillImportedProspectsForOnboarding/, "Sales Navigator persistence must expose automatic paid-onboarding fulfillment.");
assert.match(persistenceSource, /AUTO_FULFILLMENT_TARGETS/, "Automatic fulfillment must define product-level delivery targets.");
assert.match(persistenceSource, /status: "awaiting_supply"/, "Automatic fulfillment must leave customers retryable when supply is short.");
assert.match(persistenceSource, /publishProspects\(\{[\s\S]*adminConfirmedCustomer: true/, "Automatic fulfillment must reuse the existing publish path without manual admin confirmation.");
assert.match(persistenceSource, /onboarding_id: onboardingId \|\| null/, "Automatic deliveries must remain linked to the onboarding record.");
assert.match(persistenceSource, /assignment_status: "assigned",[\s\S]*delivery_batch_id: null/, "Failed delivery emails must leave assignments retryable.");
assert.match(persistenceSource, /unavailableIds/, "Automatic fulfillment must only block unavailable imported prospects, not same-customer retries.");

const onboardingRoute = readFileSync(join(process.cwd(), "src", "app", "api", "onboarding", "route.ts"), "utf8");
assert.match(onboardingRoute, /autoFulfillImportedProspectsForOnboarding/, "Paid onboarding must attempt automatic imported-prospect fulfillment.");
assert.match(onboardingRoute, /awaiting_supply/, "Onboarding response copy must handle waiting-for-supply state.");

const cronRoute = join(process.cwd(), "src", "app", "api", "cron", "imported-prospect-fulfillment", "route.ts");
assert.equal(existsSync(cronRoute), true, "A cron retry route must exist for pending imported-prospect fulfillment.");
const vercelConfig = readFileSync(join(process.cwd(), "vercel.json"), "utf8");
assert.match(vercelConfig, /\/api\/cron\/imported-prospect-fulfillment/, "Vercel cron must schedule imported-prospect fulfillment retries.");

const proofPackDelivery = readFileSync(join(process.cwd(), "src", "lib", "proof-pack-delivery.ts"), "utf8");
assert.match(proofPackDelivery, /waiting_for: "customer_onboarding"/, "Proof Pack PDF delivery must not send before onboarding context exists.");
assert.match(proofPackDelivery, /waiting_for: "matching_supply"/, "Proof Pack PDF delivery must not send a blank pack when no lead supply exists.");

console.log("Imported prospect autofulfillment tests passed.");
