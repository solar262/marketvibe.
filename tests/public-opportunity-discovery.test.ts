import assert from "node:assert/strict";
import {
  buildProfileOpportunityQuery,
  gdeltArticleToProfileCandidate,
  isDeliverableBuyerIntentOpportunity,
} from "../src/lib/public-opportunity-discovery";
import type { CustomerSearchProfile } from "../src/lib/opportunity-quality";

const profile: CustomerSearchProfile = {
  id: "profile-1",
  customer_email: "agency@example.com",
  product_code: "radar",
  status: "active",
  niche: "B2B software implementation",
  target_service: "CRM migration and implementation consulting",
  target_industries: ["software", "CRM", "technology"],
  target_locations: ["Vienna, Austria"],
  company_sizes: [],
  target_job_roles: ["chief technology officer", "operations director"],
  minimum_fit_score: 55,
  minimum_intent_score: 40,
  minimum_evidence_score: 55,
  maximum_record_age_days: 45,
  opportunity_quantity: 20,
  delivery_frequency: "weekly",
  exclusivity_mode: "customer_exclusive",
  exclusivity_period_days: 14,
  allow_profile_only: false,
  replacement_policy: "objective_failures",
};

const query = buildProfileOpportunityQuery(profile);
assert.match(query, /request for proposal/i);
assert.match(query, /software/i);
assert.match(query, /Vienna/i);

const candidate = gdeltArticleToProfileCandidate({
  url: "https://example-news.com/technology/acme-seeking-crm-implementation-partner-in-vienna",
  title: "Acme seeking CRM implementation partner in Vienna",
  seendate: "20260715T083000Z",
  domain: "example-news.com",
  sourcecountry: "Austria",
}, profile);

assert.ok(candidate);
assert.equal(candidate.source_type, "public_buyer_intent_news");
assert.equal(candidate.company_name, "Acme");

const irrelevant = gdeltArticleToProfileCandidate({
  url: "https://example-news.com/sport/vienna-football-results",
  title: "Vienna football results and weekend fixtures",
  seendate: "20260715T083000Z",
}, profile);
assert.equal(irrelevant, null);

assert.equal(isDeliverableBuyerIntentOpportunity({
  source_url: "https://example-news.com/acme",
  source_title: "Acme seeking CRM implementation partner",
  source_text: "Acme is seeking a CRM implementation partner for a migration project.",
  intent_category: "verified_direct_intent",
  is_test_data: false,
}), true);

assert.equal(isDeliverableBuyerIntentOpportunity({
  source_url: "https://example-news.com/acme",
  source_text: "Acme company profile",
  intent_category: "profile_only",
  is_test_data: false,
}), false);

console.log("public opportunity discovery tests passed");
