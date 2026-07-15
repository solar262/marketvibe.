import assert from "node:assert/strict";
import {
  buildGdeltPropertyQuery,
  gdeltArticleToCandidate,
  isGenuinePropertyOpportunity,
} from "../src/lib/property-opportunity-integrity";
import type { CustomerSearchProfile } from "../src/lib/opportunity-quality";

const profile: CustomerSearchProfile = {
  id: "profile-1",
  customer_email: "buyer@example.com",
  product_code: "proof_pack",
  status: "active",
  niche: "Luxury residential construction",
  target_service: "High-end building and renovation",
  target_industries: ["construction", "property development"],
  target_locations: ["Dallas", "Texas", "United States"],
  company_sizes: [],
  target_job_roles: ["developer", "owner"],
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

const query = buildGdeltPropertyQuery(profile);
assert.match(query, /planning application/i);
assert.match(query, /construction/i);
assert.match(query, /"Dallas"/);

const candidate = gdeltArticleToCandidate({
  url: "https://example-news.com/property/turner-wins-contract-awarded-for-dallas-commercial-construction-project",
  title: "Turner wins contract awarded for Dallas commercial construction project",
  seendate: "20260715T083000Z",
  domain: "example-news.com",
  sourcecountry: "United States",
}, profile);

assert.ok(candidate);
assert.equal(candidate.source_type, "public_property_news");
assert.equal(candidate.company_name, "Turner");
assert.equal(candidate.source_published_at, "2026-07-15T08:30:00.000Z");
assert.equal(isGenuinePropertyOpportunity(candidate), true);

const irrelevant = gdeltArticleToCandidate({
  url: "https://example-news.com/lifestyle/best-restaurants-in-dallas",
  title: "The best restaurants to visit in Dallas this summer",
  seendate: "20260715T083000Z",
}, profile);
assert.equal(irrelevant, null);

assert.equal(isGenuinePropertyOpportunity({
  id: "legacy-1",
  company_name: "Local Cafe",
  company_industry: "Restaurant",
  source_type: "public_business_website",
  source_title: "Local Cafe",
  source_text: "Website audit record",
  niche: "High-value property and construction opportunities",
}), false);

console.log("property opportunity source tests passed");
