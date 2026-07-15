import assert from "node:assert/strict";
import { groundOpportunityInEvidence } from "../src/lib/buyer-intent-evidence";
import { opportunityRemainsReusable } from "../src/lib/buyer-intent-matching";
import { entitlementIsCurrentlyActive } from "../src/lib/paid-profile-access";
import type { CustomerSearchProfile, OpportunityInput } from "../src/lib/opportunity-quality";

const profile: CustomerSearchProfile = {
  id: "profile-1",
  customer_email: "buyer@example.com",
  product_code: "proof_pack",
  status: "active",
  niche: "CRM implementation consulting",
  target_service: "CRM migration and implementation",
  target_industries: ["CRM", "software"],
  target_locations: ["Vienna, Austria"],
  company_sizes: [],
  target_job_roles: [],
  minimum_fit_score: 50,
  minimum_intent_score: 35,
  minimum_evidence_score: 50,
  maximum_record_age_days: 90,
  opportunity_quantity: 30,
  delivery_frequency: "once",
  exclusivity_mode: "non_exclusive",
  exclusivity_period_days: 0,
  allow_profile_only: false,
  replacement_policy: "admin_review",
};

const relevantInput: OpportunityInput = {
  company_name: "Acme",
  source_type: "public_buyer_intent_news",
  source_name: "Public source",
  source_url: "https://news.example.com/acme-crm",
  source_title: "Acme seeks CRM implementation partner",
  source_text: "Acme seeks a CRM implementation partner for a migration project.",
};

const relevant = groundOpportunityInEvidence(relevantInput, profile);
assert.equal(relevant.profileRelevant, true);
assert.equal(relevant.grounded.niche, profile.niche);
assert.equal(relevant.grounded.company_location, null);
assert.equal(relevant.grounded.target_location, null);

const located = groundOpportunityInEvidence({
  ...relevantInput,
  source_text: `${relevantInput.source_text} The work will be delivered in Vienna.`,
}, profile);
assert.equal(located.matchedLocation, "Vienna, Austria");
assert.equal(located.grounded.company_location, "Vienna, Austria");

const irrelevant = groundOpportunityInEvidence({
  ...relevantInput,
  source_title: "Restaurant opens a new summer terrace",
  source_text: "A restaurant opens a new summer terrace.",
}, profile);
assert.equal(irrelevant.profileRelevant, false);
assert.equal(irrelevant.grounded.niche, null);
assert.equal(irrelevant.grounded.company_location, null);

assert.equal(opportunityRemainsReusable("non_exclusive"), true);
assert.equal(opportunityRemainsReusable("customer_exclusive"), false);

assert.equal(entitlementIsCurrentlyActive({ status: "active", ends_at: null }), true);
assert.equal(entitlementIsCurrentlyActive({ status: "cancelled", ends_at: null }), false);
assert.equal(entitlementIsCurrentlyActive({ status: "active", ends_at: "2020-01-01T00:00:00.000Z" }, new Date("2026-01-01T00:00:00.000Z")), false);
assert.equal(entitlementIsCurrentlyActive({ status: "active", ends_at: "2027-01-01T00:00:00.000Z" }, new Date("2026-01-01T00:00:00.000Z")), true);

console.log("operational completion tests passed");
