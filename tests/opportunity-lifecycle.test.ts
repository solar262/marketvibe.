import assert from "node:assert/strict";
import { isCronAuthorized } from "../src/lib/cron-auth";
import { buildOpportunityDeliveryCsv } from "../src/lib/opportunity-engine";
import { opportunityConfigForProduct } from "../src/lib/opportunity-products";
import {
  buildExclusivityKey,
  buildOpportunityDedupeKey,
  calculateOpportunityScores,
  isFakeOrExampleDomain,
  profileFromOnboarding,
  qualifyOpportunity,
  replacementAutoApprovalReason,
  selectMatchingOpportunities,
  shouldExpireOpportunity,
  type CustomerSearchProfile,
  type MatchableOpportunity,
  type OpportunityInput,
} from "../src/lib/opportunity-quality";

const now = new Date("2026-07-10T12:00:00Z");

const baseOpportunity: OpportunityInput = {
  id: "opp-1",
  company_name: "Bright Works Studio",
  company_domain: "brightworks.example.co.uk",
  company_website: "https://brightworks.example.co.uk",
  company_location: "Manchester",
  company_country: "United Kingdom",
  company_industry: "Marketing services",
  company_description: "B2B marketing agency expanding delivery capacity.",
  contact_full_name: "Avery Stone",
  contact_job_title: "Head of Operations",
  public_email: "avery@brightworks.example.co.uk",
  public_phone: "+44 20 1111 2222",
  source_type: "public_news_feed",
  source_name: "Public RSS",
  source_url: "https://news.example.co.uk/bright-works-expansion",
  source_title: "Bright Works requests supplier recommendations for expansion",
  source_text: "Bright Works is looking for supplier recommendations and quotes for marketing support after opening a new Manchester location.",
  source_published_at: "2026-07-08T10:00:00Z",
  captured_at: "2026-07-09T10:00:00Z",
  last_verified_at: "2026-07-09T10:00:00Z",
  niche: "marketing",
  target_location: "Manchester, United Kingdom",
};

const profile: CustomerSearchProfile = {
  customer_email: "buyer@example.com",
  product_code: "radar",
  status: "active",
  niche: "marketing",
  target_service: "Lead generation",
  target_industries: ["marketing"],
  target_locations: ["Manchester", "United Kingdom"],
  company_sizes: [],
  target_job_roles: ["operations", "marketing"],
  minimum_fit_score: 50,
  minimum_intent_score: 40,
  minimum_evidence_score: 50,
  maximum_record_age_days: 45,
  opportunity_quantity: 2,
  delivery_frequency: "weekly",
  exclusivity_mode: "niche_exclusive",
  exclusivity_period_days: 14,
  allow_profile_only: false,
  replacement_policy: "objective_failures",
};

assert.equal(buildOpportunityDedupeKey(baseOpportunity), "source:https://news.example.co.uk/bright-works-expansion");
assert.equal(isFakeOrExampleDomain("example.com"), true);
assert.equal(isFakeOrExampleDomain("marketvibe1.com"), false);

const scores = calculateOpportunityScores(baseOpportunity, profile, now);
assert.equal(scores.intent_category, "verified_direct_intent");
assert.equal(scores.intent_score, 100);
assert.ok(scores.fit_score >= 70);
assert.ok(scores.evidence_score >= 80);
assert.ok(scores.overall_score >= 80);

const qualified = qualifyOpportunity(baseOpportunity, scores, profile, now);
assert.equal(qualified.qualified, true);
assert.equal(qualified.inventory_status, "IN_INVENTORY");

const profileOnly = {
  ...baseOpportunity,
  source_url: "https://brightworks.example.co.uk",
  source_title: "Company profile",
  source_text: "",
};
const profileOnlyScores = calculateOpportunityScores(profileOnly, profile, now);
const profileOnlyQualification = qualifyOpportunity(profileOnly, profileOnlyScores, profile, now);
assert.equal(profileOnlyQualification.qualified, false);
assert.match(profileOnlyQualification.rejection_reason, /profile_only|empty_evidence|intent_below/i);

const stale = { ...baseOpportunity, source_published_at: "2025-01-01T00:00:00Z" };
assert.equal(shouldExpireOpportunity(stale, 45, now), true);
assert.equal(qualifyOpportunity(stale, calculateOpportunityScores(stale, profile, now), profile, now).inventory_status, "EXPIRED");

const onboardingProfile = profileFromOnboarding({
  email: "Buyer@Example.com",
  productCode: "growth_desk",
  niche: "Construction",
  country: "United Kingdom",
  city: "Leeds",
  territory: "Yorkshire",
  serviceOffer: "Commercial property lead generation",
  idealBuyer: "Founder, Operations Director",
});
assert.equal(onboardingProfile.customer_email, "buyer@example.com");
assert.equal(onboardingProfile.product_code, "growth_desk");
assert.equal(onboardingProfile.opportunity_quantity, opportunityConfigForProduct("growth_desk").opportunityQuantity);
assert.equal(onboardingProfile.allow_profile_only, false);
assert.deepEqual(onboardingProfile.target_locations, ["Leeds", "Yorkshire", "United Kingdom"]);

const matchable: MatchableOpportunity = {
  ...baseOpportunity,
  id: "opp-1",
  dedupe_key: buildOpportunityDedupeKey(baseOpportunity),
  inventory_status: "IN_INVENTORY",
  ...scores,
};
const second: MatchableOpportunity = {
  ...matchable,
  id: "opp-2",
  company_name: "North City Marketing",
  company_domain: "northcity.example.co.uk",
  company_website: "https://northcity.example.co.uk",
  source_url: "https://news.example.co.uk/north-city-tender",
  dedupe_key: "source:https://news.example.co.uk/north-city-tender",
  overall_score: 70,
};

const exclusivityKey = buildExclusivityKey(matchable, profile);
assert.match(exclusivityKey, /^niche:/);

const selection = selectMatchingOpportunities({
  opportunities: [matchable, second],
  profile,
  activeExclusivity: [{ exclusivity_key: exclusivityKey, customer_email: "other@example.com", status: "active", ends_at: "2026-07-20T00:00:00Z" }],
  now,
});
assert.equal(selection.selected.length, 1);
assert.equal(selection.selected[0].id, "opp-2");
assert.equal(selection.shortage, 1);

assert.equal(replacementAutoApprovalReason("website_dead"), true);
assert.equal(replacementAutoApprovalReason("outside_criteria"), false);

process.env.CRON_SECRET = "cron-test-secret";
assert.equal(isCronAuthorized(new Request("https://marketvibe1.com/api/cron/opportunity-health", { headers: { authorization: "Bearer cron-test-secret" } })), true);
assert.equal(isCronAuthorized(new Request("https://marketvibe1.com/api/cron/opportunity-health", { headers: { authorization: "Bearer wrong" } })), false);

const csv = buildOpportunityDeliveryCsv([
  {
    delivered_at: "2026-07-10T12:00:00Z",
    internal_notes: "do not expose",
    opportunities: {
      ...baseOpportunity,
      fit_score: scores.fit_score,
      intent_score: scores.intent_score,
      evidence_score: scores.evidence_score,
      freshness_score: scores.freshness_score,
      overall_score: scores.overall_score,
      score_reasons: scores.reasons,
      recommended_action: "Respond with source context.",
      replacement_status: "none",
    },
  },
]);
assert.match(csv, /"Company","Website"/);
assert.match(csv, /Bright Works Studio/);
assert.doesNotMatch(csv, /internal_notes|do not expose/);

console.log("Opportunity lifecycle tests passed.");

