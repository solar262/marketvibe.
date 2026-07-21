import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isCronAuthorized } from "../src/lib/cron-auth";
import {
  applyCustomerFeedbackPreferences,
  buildCustomerFeedbackPreferences,
  buildOpportunityDeliveryCsv,
  customerFeedbackStatusFromMatchReason,
  extractXmlValue,
  normalizeOpportunityFeedbackStatus,
  parseQuickPasteUrls,
  quickPasteCandidateFromUrl,
  rssItemMatchesProfile,
} from "../src/lib/opportunity-engine";
import { isGenuinePropertyOpportunity } from "../src/lib/property-opportunity-integrity";
import { opportunityConfigForProduct } from "../src/lib/opportunity-products";
import { formatSupabaseServerEnvError, SUPABASE_SERVICE_ROLE_KEY_ENV, supabaseConnectionStatus } from "../src/lib/supabase";
import {
  buildExclusivityKey,
  buildOpportunityDedupeKey,
  calculateOpportunityScores,
  isFakeOrExampleDomain,
  opportunityDeliveryQualityFlags,
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
  company_name: "Bright Works Construction",
  company_domain: "brightworks.example.co.uk",
  company_website: "https://brightworks.example.co.uk",
  company_location: "Manchester",
  company_country: "United Kingdom",
  company_industry: "Construction services",
  company_description: "High-end renovation contractor expanding project delivery capacity.",
  contact_full_name: "Avery Stone",
  contact_job_title: "Head of Operations",
  public_email: "avery@brightworks.example.co.uk",
  public_phone: "+44 20 1111 2222",
  source_type: "public_news_feed",
  source_name: "Public RSS",
  source_url: "https://news.example.co.uk/bright-works-extension-project",
  source_title: "Bright Works requests supplier recommendations for luxury renovation project",
  source_text: "Bright Works is looking for supplier recommendations and quotes for luxury renovation support after winning a Manchester house extension project.",
  source_published_at: "2026-07-08T10:00:00Z",
  captured_at: "2026-07-09T10:00:00Z",
  last_verified_at: "2026-07-09T10:00:00Z",
  niche: "construction",
  target_location: "Manchester, United Kingdom",
};

const profile: CustomerSearchProfile = {
  customer_email: "buyer@example.com",
  product_code: "radar",
  status: "active",
  niche: "construction",
  target_service: "Qualified property opportunities",
  target_industries: ["construction", "property"],
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

assert.equal(buildOpportunityDedupeKey(baseOpportunity), "source:https://news.example.co.uk/bright-works-extension-project");
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

const navigatorOpportunity: OpportunityInput = {
  ...baseOpportunity,
  id: "navigator-1",
  company_name: "Prime Build Group",
  company_domain: "",
  company_website: "",
  company_location: "Dallas",
  company_country: "United States",
  company_industry: "Construction and builder services",
  contact_full_name: "Jordan Lee",
  contact_job_title: "Operations Director",
  source_type: "sales_navigator_visible_card",
  source_name: "MarketVibe Sales Navigator Companion",
  source_url: "https://linkedin.com/sales/lead/abc123",
  source_title: "Prime Build Group - Operations Director - visible Navigator signal",
  source_text: "Visible Sales Navigator result matched MarketVibe supply profile. Reasons: target buyer category: builder; decision-maker role visible; visible buying/context signal: hiring. Visible text: Prime Build Group is hiring operations staff for new homes growth.",
  source_published_at: null,
  captured_at: "2026-07-10T10:00:00Z",
  niche: "Property Pipeline Buyers",
  target_location: "Dallas, United States",
};
const navigatorProfile = {
  ...profile,
  niche: "Property Pipeline Buyers",
  target_industries: ["builder", "construction", "property", "real estate"],
  target_locations: ["Dallas", "United States"],
  target_job_roles: ["operations", "director"],
  minimum_intent_score: 80,
  minimum_evidence_score: 65,
};
const navigatorScores = calculateOpportunityScores(navigatorOpportunity, navigatorProfile, now);
assert.equal(navigatorScores.intent_category, "public_opportunity_signal");
assert.equal(navigatorScores.evidence_score >= 65, true);
const navigatorQualified = qualifyOpportunity(navigatorOpportunity, navigatorScores, navigatorProfile, now);
assert.equal(navigatorQualified.qualified, true);
assert.equal(navigatorQualified.quality_flags.includes("broken_or_blocked_source_url"), false);
assert.equal(isGenuinePropertyOpportunity({ ...navigatorOpportunity, id: "navigator-1" }), true);

const screenshotQualityFailures = [
  {
    source_title: "Industrial Leads for the Week of May 25, 2026",
    source_text: "Industrial leads for the week of May 25, 2026.",
    expected: "generic_lead_roundup",
  },
  {
    source_title: "Legal guidance on the appropriation of General Fund land to the Housing Revenue Account (HRA)",
    source_text: "Legal guidance on public-sector land appropriation and the Housing Revenue Account.",
    expected: "policy_or_guidance_only",
  },
  {
    source_title: "Empty and under",
    source_text: "Empty and under",
    expected: "vague_opportunity_record",
  },
  {
    source_title: "ESTATE-11759 - USA (McKinney, Texas) - Real Estate Development Services - Deadline August 6,2026",
    source_text: "Vendor needs to provide real estate development services to the government authority.",
    source_url: "http://rfpmart.com/1142211-usa-mckinney-texas-real-estate-development-services-rfp.html",
    expected: "public_tender_directory_without_named_buyer",
  },
];

for (const failure of screenshotQualityFailures) {
  const candidate = {
    ...baseOpportunity,
    company_name: failure.source_title,
    source_url: failure.source_url || `https://news.example.co.uk/${failure.expected}`,
    source_title: failure.source_title,
    source_text: failure.source_text,
  };
  const flags = opportunityDeliveryQualityFlags(candidate);
  assert.ok(flags.includes(failure.expected), `${failure.source_title} should include ${failure.expected}`);
  const result = qualifyOpportunity(candidate, calculateOpportunityScores(candidate, profile, now), profile, now);
  assert.equal(result.qualified, false);
  assert.match(result.rejection_reason, new RegExp(failure.expected));
}

const contractorAward = {
  ...baseOpportunity,
  company_domain: "realbuilder.com",
  company_website: "https://realbuilder.com",
  source_url: "https://news.example.co.uk/contractor-of-the-year",
  source_title: "Regional builder named contractor of the year",
  source_text: "A regional construction company was named contractor of the year at an industry awards event.",
};
const contractorAwardScores = calculateOpportunityScores(contractorAward, profile, now);
assert.notEqual(contractorAwardScores.intent_category, "verified_direct_intent");
assert.equal(isGenuinePropertyOpportunity({
  id: "weak-news",
  company_name: "Regional builder",
  company_industry: "Construction",
  source_type: "public_rss_feed",
  source_title: "Buckled columns leave office conversion unstable",
  source_text: "Engineers must stabilize the building before seeking answers.",
  niche: "Property Pipeline Buyers",
}), false);
assert.equal(isGenuinePropertyOpportunity({
  id: "planning-application",
  company_name: "North City Development",
  company_industry: "Property development",
  source_type: "public_rss_feed",
  source_title: "North City planning application opens for review",
  source_text: "A planning application for a residential development proposal is open for public review.",
  niche: "Property Pipeline Buyers",
}), true);
assert.equal(isGenuinePropertyOpportunity({
  id: "generic-rfp",
  company_name: "Professional Legal Services",
  company_industry: "Property Pipeline Buyers",
  source_type: "public_rss_feed",
  source_title: "LEGAL-17349 - USA (Floresville, Texas) - Professional Legal Services - Deadline July 29,2026",
  source_text: "Vendor needs to provide professional legal services to the government authority.",
  niche: "Property Pipeline Buyers",
}), false);
assert.equal(isGenuinePropertyOpportunity({
  id: "broad-rfp",
  company_name: "Renewable Natural Gas Brokerage Services",
  company_industry: "Property Pipeline Buyers",
  source_type: "public_rss_feed",
  source_title: "COMMODITY-100 - USA (Denver, Colorado) - Renewable Natural Gas Commodity Brokerage Services - Deadline September 16,2026",
  source_text: "Vendor needs to provide commodity brokerage services and establish a commercial administrative framework.",
  niche: "Property Pipeline Buyers",
}), false);
assert.equal(isGenuinePropertyOpportunity({
  id: "real-estate-rfp",
  company_name: "Real Estate Development Services",
  company_industry: "Property Pipeline Buyers",
  source_type: "public_rss_feed",
  source_title: "ESTATE-11759 - USA (McKinney, Texas) - Real Estate Development Services - Deadline August 6,2026",
  source_text: "Vendor needs to provide real estate development services including developer, architect, engineer, and contractor services.",
  niche: "Property Pipeline Buyers",
}), false);
assert.equal(isGenuinePropertyOpportunity({
  id: "named-buyer-procurement",
  company_name: "North City Development",
  company_industry: "Property development",
  source_type: "public_rss_feed",
  source_title: "North City Development seeks contractor proposals for mixed-use site",
  source_text: "North City Development is seeking contractor proposals for a mixed-use residential construction project.",
  niche: "Property Pipeline Buyers",
}), true);

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

const pastedUrls = parseQuickPasteUrls([
  "www.linkedin.com/sales/lead/ACwAA-test",
  "https://www.linkedin.com/sales/lead/ACwAA-test/",
  "not a url",
  "https://example.org/company",
].join("\n"));
assert.equal(pastedUrls.accepted.length, 2);
assert.equal(pastedUrls.rejected.length, 2);
assert.equal(pastedUrls.accepted[0].url, "https://linkedin.com/sales/lead/ACwAA-test");

const pastedCandidate = quickPasteCandidateFromUrl({
  url: pastedUrls.accepted[0].url,
  niche: "Property developers",
  location: "United Kingdom",
  sourceNote: "Copied from admin browser.",
  capturedAt: now.toISOString(),
});
assert.equal(pastedCandidate.source_type, "sales_navigator_url");
assert.equal(pastedCandidate.company_name, "Unknown company");
assert.equal(pastedCandidate.company_website, null);
assert.equal(pastedCandidate.evidence_status, "profile_only");
assert.equal(pastedCandidate.raw_payload?.no_scraping, true);
assert.equal(pastedCandidate.raw_payload?.no_linkedin_fetch, true);

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
  company_name: "North City Property",
  company_domain: "northcity.example.co.uk",
  company_website: "https://northcity.example.co.uk",
  source_url: "https://news.example.co.uk/north-city-tender",
  dedupe_key: "source:https://news.example.co.uk/north-city-tender",
  overall_score: 70,
};

const tenderDirectoryMatchable: MatchableOpportunity = {
  ...matchable,
  id: "rfp-directory",
  company_name: "Real Estate Development Services",
  company_domain: "",
  company_website: null,
  source_url: "http://rfpmart.com/1142211-usa-mckinney-texas-real-estate-development-services-rfp.html",
  source_title: "ESTATE-11759 - USA (McKinney, Texas) - Real Estate Development Services - Deadline August 6,2026",
  source_text: "Vendor needs to provide real estate development services including developer, architect, engineer, and contractor services.",
  dedupe_key: "source:http://rfpmart.com/1142211-usa-mckinney-texas-real-estate-development-services-rfp.html",
  inventory_status: "IN_INVENTORY",
  fit_score: 100,
  intent_score: 100,
  evidence_score: 100,
  overall_score: 100,
};
const blockedSelection = selectMatchingOpportunities({
  opportunities: [tenderDirectoryMatchable],
  profile,
  activeExclusivity: [],
  now,
});
assert.equal(blockedSelection.selected.length, 0);
assert.match(blockedSelection.rejected[0].reasons.join(" "), /Delivery quality blocker/);

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

assert.equal(normalizeOpportunityFeedbackStatus("booked"), "booked");
assert.equal(normalizeOpportunityFeedbackStatus("bad"), null);
assert.equal(customerFeedbackStatusFromMatchReason({ customer_feedback: { status: "replied" } }), "replied");
const positivePreferences = buildCustomerFeedbackPreferences([{
  match_reason: { customer_feedback: { status: "booked" } },
  opportunities: {
    company_industry: "Construction services",
    company_location: "Manchester",
    intent_category: "verified_direct_intent",
  },
}]);
const positiveAdjusted = applyCustomerFeedbackPreferences([second], positivePreferences);
assert.ok(positiveAdjusted[0].overall_score > second.overall_score);
assert.ok((positiveAdjusted[0].customer_feedback_adjustment || 0) > 0);
const negativePreferences = buildCustomerFeedbackPreferences([{
  match_reason: { customer_feedback: { status: "not_useful" } },
  opportunities: {
    company_industry: "Construction services",
    company_location: "Manchester",
    intent_category: "verified_direct_intent",
  },
}]);
const negativeAdjusted = applyCustomerFeedbackPreferences([second], negativePreferences);
assert.ok(negativeAdjusted[0].overall_score < second.overall_score);
assert.ok((negativeAdjusted[0].customer_feedback_adjustment || 0) < 0);

assert.equal(replacementAutoApprovalReason("website_dead"), true);
assert.equal(replacementAutoApprovalReason("outside_criteria"), false);

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test_value";
const supabaseStatus = supabaseConnectionStatus();
assert.equal(SUPABASE_SERVICE_ROLE_KEY_ENV, "SUPABASE_SERVICE_ROLE_KEY");
assert.equal(supabaseStatus.hasServiceRoleKey, true);
assert.deepEqual(supabaseStatus.missingRequiredServerVariables, ["NEXT_PUBLIC_SUPABASE_URL"]);
assert.match(formatSupabaseServerEnvError(), /NEXT_PUBLIC_SUPABASE_URL/);
if (originalSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
if (originalSupabaseServiceRoleKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
else process.env.SUPABASE_SERVICE_ROLE_KEY = originalSupabaseServiceRoleKey;

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
assert.match(csv, /Bright Works Construction/);
assert.doesNotMatch(csv, /internal_notes|do not expose/);

const cdataRssItem = `
  <item>
    <title><![CDATA[Road Projects Capture 77% of BUILD Grants]]></title>
    <description><![CDATA[Construction project funding creates contractor and supplier opportunities.]]></description>
  </item>
`;
assert.equal(extractXmlValue(cdataRssItem, "title"), "Road Projects Capture 77% of BUILD Grants");
assert.equal(rssItemMatchesProfile(profile, `${extractXmlValue(cdataRssItem, "title")} ${extractXmlValue(cdataRssItem, "description")}`), false);
assert.equal(rssItemMatchesProfile(profile, "North City Development is seeking contractor proposals for a residential construction project in Manchester."), true);
assert.equal(rssItemMatchesProfile(profile, "General newsletter about office snacks and event photos."), false);

const procurementRssItem = `
  <item>
    <title><![CDATA[ESTATE-11759 - USA (McKinney, Texas) - Real Estate Development Services - Deadline August 6,2026]]></title>
    <description><![CDATA[(1) Vendor needs to provide real estate development services to the government authority.&amp;nbsp; Developer, architect, engineer, and contractor/builder services are required.]]></description>
  </item>
`;
const procurementText = `${extractXmlValue(procurementRssItem, "title")} ${extractXmlValue(procurementRssItem, "description")}`;
assert.match(procurementText, /Vendor needs to provide real estate development services/);
assert.equal(rssItemMatchesProfile(profile, procurementText), false);
const procurementScores = calculateOpportunityScores({
  ...baseOpportunity,
  source_title: extractXmlValue(procurementRssItem, "title"),
  source_text: procurementText,
}, profile, now);
assert.equal(procurementScores.intent_category, "verified_direct_intent");
assert.equal(qualifyOpportunity({
  ...baseOpportunity,
  source_url: "http://rfpmart.com/1142211-usa-mckinney-texas-real-estate-development-services-rfp.html",
  source_title: extractXmlValue(procurementRssItem, "title"),
  source_text: procurementText,
}, procurementScores, profile, now).qualified, false);

const propertyIntegritySource = readFileSync(join(process.cwd(), "src", "lib", "property-opportunity-integrity.ts"), "utf8");
assert.match(propertyIntegritySource, /runOpportunityDiscovery/, "Property discovery wrapper must invoke public-source opportunity discovery.");
assert.match(propertyIntegritySource, /includeLiveLeadEngine:\s*false/, "Property discovery wrapper must not run legacy local-business discovery.");
assert.match(propertyIntegritySource, /Property Pipeline Buyers/, "Property integrity must cover the active property import profile.");
assert.match(propertyIntegritySource, /OPPORTUNITY_RSS_FEEDS/, "Property discovery wrapper must mention configured public feeds when no records are discovered.");
assert.match(propertyIntegritySource, /vendor\|contractor\|consultant\|supplier/, "Property integrity must recognize procurement feed wording.");

const automationPipelineSource = readFileSync(join(process.cwd(), "src", "lib", "opportunity-automation.ts"), "utf8");
assert.match(automationPipelineSource, /runPropertyDiscoveryWithIntegrity/, "Full opportunity automation must run discovery.");
assert.match(automationPipelineSource, /runOpportunityVerification/, "Full opportunity automation must run verification.");
assert.match(automationPipelineSource, /fillCustomerShortages/, "Full opportunity automation must run matching.");
assert.match(automationPipelineSource, /sourceSetupNeeded/, "Full opportunity automation must report missing opportunity sources instead of silently returning zero.");
const adminOpportunityControlsSource = readFileSync(join(process.cwd(), "src", "components", "OpportunityEngineControls.tsx"), "utf8");
assert.match(adminOpportunityControlsSource, /run-pipeline/, "Admin controls must expose a one-click full automation pipeline.");
const cronPipelineSource = readFileSync(join(process.cwd(), "src", "app", "api", "cron", "opportunity-pipeline", "route.ts"), "utf8");
assert.match(cronPipelineSource, /requireCron/, "Full opportunity pipeline cron must be protected by cron authentication.");
assert.match(cronPipelineSource, /runOpportunityAutomationPipeline/, "Full opportunity pipeline cron must run the pipeline helper.");
const opportunityVercelConfig = readFileSync(join(process.cwd(), "vercel.json"), "utf8");
assert.match(opportunityVercelConfig, /\/api\/cron\/opportunity-pipeline/, "Vercel must schedule the full opportunity pipeline.");

const feedbackRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "opportunities", "feedback", "route.ts"), "utf8");
assert.match(feedbackRouteSource, /resolveCustomerAccess/, "Feedback route must verify paid customer access.");
assert.match(feedbackRouteSource, /recordOpportunityFeedback/, "Feedback route must persist customer outcomes.");
const dashboardSource = readFileSync(join(process.cwd(), "src", "app", "dashboard", "page.tsx"), "utf8");
assert.match(dashboardSource, /OpportunityFeedbackForm/, "Dashboard must expose customer outcome feedback.");
const engineSource = readFileSync(join(process.cwd(), "src", "lib", "opportunity-engine.ts"), "utf8");
assert.match(engineSource, /requestOpportunityReplacement/, "Not-useful feedback must queue replacements through the existing replacement engine.");
assert.match(engineSource, /applyCustomerFeedbackPreferences/, "Matching must learn from customer feedback.");
assert.match(engineSource, /premium_entitlements/, "Customer matching and delivery must check active paid entitlements.");
assert.match(engineSource, /premium_orders/, "Customer matching and delivery must fall back to completed paid orders.");
assert.match(engineSource, /@marketvibe\.local/, "Internal source profiles must not be treated as billable customer delivery profiles.");
assert.match(engineSource, /no_billable_customer_profiles/, "Matching must skip cleanly when no paid customer profiles exist.");
assert.match(engineSource, /customer_has_no_active_paid_access/, "Delivery must block queued assignments without active paid access.");
assert.match(engineSource, /syncApprovedNavigatorProspectsToOpportunities/, "Navigator imports must have an explicit opportunity-engine boundary.");
assert.match(engineSource, /sales_navigator_visible_card/, "Navigator records must preserve visible-card provenance.");
assert.match(engineSource, /navigator_bridge_disabled_for_new_model/, "Navigator records must remain internal research stock instead of customer inventory.");
const navigatorCompanionSource = readFileSync(join(process.cwd(), "browser-extension", "sales-navigator-companion", "content.js"), "utf8");
assert.match(navigatorCompanionSource, /targetHit && roleHit && signalHit/, "Navigator companion must require a visible signal before capture.");
assert.match(navigatorCompanionSource, /SEARCH_SIGNAL_MODIFIERS/, "Navigator companion searches must include signal modifiers.");
assert.match(navigatorCompanionSource, /opportunitiesAddedToInventory/, "Navigator companion import status must report opportunity inventory creation.");

console.log("Opportunity lifecycle tests passed.");
