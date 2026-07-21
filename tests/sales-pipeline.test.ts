import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSalesEmailSequence,
  buildSalesPipelineCsv,
  customerJourneys,
  assessColdOutboundLead,
  salesEmailSequenceTypes,
  salesOutboundRunLimit,
  salesPipelineStages,
  scoreOutboundProspect,
  scoreSalesLead,
  validateOutboundProspectInput,
  validateSalesLeadInput,
  type ValidatedSalesLeadInput,
} from "../src/lib/sales-pipeline";

const root = process.cwd();

const requiredStages = [
  "new_lead",
  "qualified",
  "contacted",
  "interested",
  "proof_pack_purchased",
  "proof_pack_delivered",
  "subscription_opportunity",
  "subscriber",
  "lost",
];

assert.deepEqual([...salesPipelineStages], requiredStages);
assert.deepEqual([...customerJourneys], ["proof_pack", "subscriber"]);
assert.deepEqual([...salesEmailSequenceTypes], [
  "new_qualified_lead",
  "proof_pack_onboarding",
  "proof_pack_delivery_followup",
  "proof_pack_to_subscription",
  "inactive_subscriber",
  "cold_outbound",
]);

const highInput = {
  email: "Buyer@Example.com",
  name: "Buyer",
  companyName: "Buyer Co",
  customerJourney: "subscriber",
  serviceOffered: "B2B growth consulting",
  averageClientValue: "6000",
  targetIndustry: "B2B SaaS agencies",
  targetCountries: "US, UK, Germany",
  companySize: "11-50",
  weeklyOutreachCapacity: "100",
  currentLeadGenerationMethod: "Manual LinkedIn Sales Navigator and Google research",
  region: "UK",
  country: "United Kingdom",
  consentMarketing: true,
};

const highValidation = validateSalesLeadInput(highInput);
assert.equal(highValidation.ok, true);
const highScore = scoreSalesLead((highValidation as { ok: true; value: ValidatedSalesLeadInput }).value);
assert.equal(highScore.fit, "high");
assert.equal(highScore.score, 100);
assert.ok(highScore.reasons.includes("Interested in recurring delivery"));

const mediumValidation = validateSalesLeadInput({
  ...highInput,
  customerJourney: "proof_pack",
  averageClientValue: "1000",
  targetIndustry: "local services",
  targetCountries: "Brazil",
  weeklyOutreachCapacity: "20",
  currentLeadGenerationMethod: "events",
});
assert.equal(mediumValidation.ok, true);
const mediumScore = scoreSalesLead((mediumValidation as { ok: true; value: ValidatedSalesLeadInput }).value);
assert.equal(mediumScore.fit, "medium");
assert.ok(mediumScore.score >= 60 && mediumScore.score <= 79);

const lowValidation = validateSalesLeadInput({
  ...highInput,
  customerJourney: "proof_pack",
  averageClientValue: "100",
  targetIndustry: "local",
  targetCountries: "Brazil",
  companySize: "Solo",
  weeklyOutreachCapacity: "1",
  currentLeadGenerationMethod: "none",
});
assert.equal(lowValidation.ok, true);
const lowScore = scoreSalesLead((lowValidation as { ok: true; value: ValidatedSalesLeadInput }).value);
assert.equal(lowScore.fit, "low");
assert.ok(lowScore.score < 60);

const invalid = validateSalesLeadInput({ email: "bad", consentMarketing: false });
assert.equal(invalid.ok, false);
assert.match((invalid as { ok: false; errors: Record<string, string> }).errors.serviceOffered, /required/);
assert.match((invalid as { ok: false; errors: Record<string, string> }).errors.consentMarketing, /Consent/);

const emailLead = {
  id: "lead-1",
  email: "buyer@example.com",
  normalized_email: "buyer@example.com",
  name: "Buyer",
  company_name: "Buyer Co",
  customer_journey: "proof_pack" as const,
  target_industry: "construction firms",
  service_offered: "web design",
  score: 84,
  fit: "high" as const,
  source_url: "https://example.com/hiring",
  source_evidence: "Hiring a business development manager",
  region: "UK" as const,
};

for (const sequenceType of salesEmailSequenceTypes) {
  const sequence = buildSalesEmailSequence(sequenceType, emailLead);
  assert.ok(sequence.length > 0, `${sequenceType} should build at least one email`);
  assert.ok(sequence.every((email) => email.textContent.includes("Unsubscribe:")), `${sequenceType} should include unsubscribe text`);
}

const coldSequence = buildSalesEmailSequence("cold_outbound", emailLead);
assert.equal(coldSequence.length, 3, "Cold outreach must contain one initial email and no more than two follow-ups.");
assert.match(coldSequence[0].htmlContent, /MarketVibe/);
assert.match(coldSequence[0].htmlContent, /utm_source=cold_outbound/);
assert.match(coldSequence[0].htmlContent, /marketvibe-email-preview\.png/);
assert.match(coldSequence[0].htmlContent, /View the redacted example/);
assert.match(coldSequence[2].textContent, /utm_campaign=proof_pack_outbound/);

const csv = buildSalesPipelineCsv([{
  id: "lead-1",
  email: "buyer@example.com",
  normalized_email: "buyer@example.com",
  name: "Buyer",
  company_name: "Buyer Co",
  website: null,
  customer_journey: "proof_pack",
  service_offered: "web design",
  average_client_value: 2500,
  target_industry: "construction firms",
  target_countries: "UK",
  company_size: "2-10",
  weekly_outreach_capacity: 50,
  current_lead_generation_method: "Manual Google",
  score: 84,
  fit: "high",
  score_reasons: ["Clear service offer"],
  stage: "qualified",
  owner: null,
  region: "UK",
  country: "United Kingdom",
  consent_marketing: true,
  is_suppressed: false,
  lead_origin: "inbound_fit_check",
  source_url: null,
  source_evidence: null,
  recipient_type: "unknown",
  lawful_basis: "consent",
  compliance_status: "approved",
  email_permission_status: "can_email",
  cold_outbound_approved_at: null,
  cold_outbound_approved_by: null,
  outbound_sequence_status: "not_started",
  metadata: {},
  lost_reason: null,
  next_task_at: null,
  last_contacted_at: null,
  last_activity_at: null,
  created_at: "2026-07-13T00:00:00Z",
  updated_at: "2026-07-13T00:00:00Z",
}]);
assert.match(csv, /email,name,company_name/);
assert.match(csv, /buyer@example.com/);

const outboundValidation = validateOutboundProspectInput({
  email: "founder@boutiqueagency.com",
  name: "Founder",
  companyName: "Boutique Agency",
  country: "United Kingdom",
  sourceUrl: "https://boutiqueagency.com/careers",
  sourceEvidence: "Hiring a business development manager",
  targetIndustry: "AI automation consultants",
});
assert.equal(outboundValidation.ok, true);
if (outboundValidation.ok) {
  assert.equal(outboundValidation.value.region, "UK");
  assert.equal(outboundValidation.value.complianceStatus, "approved");
  assert.equal(outboundValidation.value.emailPermissionStatus, "can_email");
  const outboundScore = scoreOutboundProspect(outboundValidation.value);
  assert.equal(outboundScore.fit, "high");
}

const personalOutbound = validateOutboundProspectInput({
  email: "person@gmail.com",
  companyName: "Personal Consultant",
  country: "United Kingdom",
  sourceUrl: "https://example.com",
  sourceEvidence: "Public service page",
});
assert.equal(personalOutbound.ok, true);
if (personalOutbound.ok) {
  assert.equal(personalOutbound.value.complianceStatus, "blocked");
  assert.equal(personalOutbound.value.emailPermissionStatus, "do_not_email");
}

assert.equal(assessColdOutboundLead({
  email: "founder@boutiqueagency.com",
  normalized_email: "founder@boutiqueagency.com",
  region: "UK",
  is_suppressed: false,
  source_url: "https://boutiqueagency.com/careers",
  source_evidence: "Hiring a business development manager",
  compliance_status: "approved",
  email_permission_status: "can_email",
  recipient_type: "uk_corporate_subscriber",
}, { requireEnabled: false }).allowed, true);
assert.equal(assessColdOutboundLead({
  email: "person@gmail.com",
  normalized_email: "person@gmail.com",
  region: "UK",
  is_suppressed: false,
  source_url: "https://example.com",
  source_evidence: "Public service page",
  compliance_status: "approved",
  email_permission_status: "can_email",
  recipient_type: "personal_email",
}, { requireEnabled: false }).allowed, false);

const migration = readFileSync(join(root, "supabase/migrations/0012_sales_pipeline.sql"), "utf8");
const outboundMigration = readFileSync(join(root, "supabase/migrations/0013_uk_us_cold_outbound.sql"), "utf8");
for (const table of ["sales_leads", "sales_lead_notes", "sales_lead_tasks", "sales_lead_status_history", "sales_email_events", "sales_suppression_list"]) {
  assert.match(migration, new RegExp(`create table if not exists ${table}`));
}
for (const column of ["consent_marketing", "consent_source", "consent_timestamp", "consent_ip", "region", "is_suppressed"]) {
  assert.match(migration, new RegExp(column));
}
for (const stage of requiredStages) {
  assert.match(migration, new RegExp(`'${stage}'`));
}
for (const region of ["US", "UK", "EU", "OTHER"]) {
  assert.match(migration, new RegExp(`'${region}'`));
}
for (const column of ["lead_origin", "source_url", "source_evidence", "recipient_type", "lawful_basis", "compliance_status", "email_permission_status", "outbound_sequence_status"]) {
  assert.match(outboundMigration, new RegExp(column));
}
assert.match(outboundMigration, /cold_outbound/);

const adminRoute = readFileSync(join(root, "src/app/api/admin/sales-pipeline/route.ts"), "utf8");
assert.match(adminRoute, /requireAdminJson/);
const adminDetailRoute = readFileSync(join(root, "src/app/api/admin/sales-pipeline/[id]/route.ts"), "utf8");
assert.match(adminDetailRoute, /requireAdminJson/);
const cronRoute = readFileSync(join(root, "src/app/api/cron/sales-pipeline/route.ts"), "utf8");
assert.match(cronRoute, /requireCron/);
assert.match(cronRoute, /processDueSalesEmails/);

const form = readFileSync(join(root, "src/components/SalesQualificationForm.tsx"), "utf8");
for (const field of [
  "serviceOffered",
  "averageClientValue",
  "targetIndustry",
  "targetCountries",
  "companySize",
  "weeklyOutreachCapacity",
  "currentLeadGenerationMethod",
]) {
  assert.match(form, new RegExp(field), `Form should collect ${field}`);
}
assert.match(form, /consentMarketing/);
assert.match(form, /api\/checkout/);

const adminNav = readFileSync(join(root, "src/components/AdminNav.tsx"), "utf8");
assert.match(adminNav, /Sales Pipeline/);
assert.match(adminNav, /\/admin\/sales-pipeline/);
assert.match(adminNav, /Outbound Sales/);
assert.match(adminNav, /\/admin\/outbound/);

const outboundPage = readFileSync(join(root, "src/app/admin/outbound/page.tsx"), "utf8");
assert.match(outboundPage, /UK\/US B2B Outbound/);
const outboundImportRoute = readFileSync(join(root, "src/app/api/admin/outbound/import/route.ts"), "utf8");
assert.match(outboundImportRoute, /createOutboundSalesProspect/);
const outboundQueueRoute = readFileSync(join(root, "src/app/api/admin/outbound/queue/route.ts"), "utf8");
assert.match(outboundQueueRoute, /queueColdOutboundForLead/);
const outboundAutopilotRoute = readFileSync(join(root, "src/app/api/cron/outbound-autopilot/route.ts"), "utf8");
assert.match(outboundAutopilotRoute, /optionalSafeNumber/);
assert.doesNotMatch(outboundAutopilotRoute, /safeNumber\(url\.searchParams\.get\("markets"\), 2/);
assert.match(outboundAutopilotRoute, /salesOutboundRunLimit/);
const outboundAdminAutopilotRoute = readFileSync(join(root, "src/app/api/admin/outbound/autopilot/route.ts"), "utf8");
assert.match(outboundAdminAutopilotRoute, /optionalSafeNumber/);
assert.match(outboundAdminAutopilotRoute, /salesOutboundRunLimit/);
const outboundAdminComponent = readFileSync(join(root, "src/components/OutboundSalesAdmin.tsx"), "utf8");
assert.doesNotMatch(outboundAdminComponent, /markets: 2, leadsPerMarket: 3/);
const buyerHuntSource = readFileSync(join(root, "src/lib/buyer-hunt.ts"), "utf8");
assert.match(buyerHuntSource, /overpassEndpoints/);
assert.match(buyerHuntSource, /ai consultant/);
assert.match(buyerHuntSource, /Promise\.all/);
assert.match(buyerHuntSource, /passesBuyerIcpGate/);
assert.match(buyerHuntSource, /nonBuyerPattern/);
assert.doesNotMatch(buyerHuntSource, /weak website, SEO, booking, and trust signals/);
assert.doesNotMatch(buyerHuntSource, /Manual review required before contact/);
const outboundAutopilotSource = readFileSync(join(root, "src/lib/outbound-autopilot.ts"), "utf8");
assert.match(outboundAutopilotSource, /SALES_OUTBOUND_AUTOPILOT_QUEUE_LIMIT \|\| "250"/);
assert.match(outboundAutopilotSource, /marketRotationOffset/);
assert.match(outboundAutopilotSource, /Phoenix/);
process.env.SALES_OUTBOUND_DAILY_LIMIT = "250";
assert.equal(salesOutboundRunLimit(), 50);
const outboundReportSource = readFileSync(join(root, "src/lib/outbound-daily-report.ts"), "utf8");
assert.match(outboundReportSource, /SALES_OUTBOUND_REPORT_EMAIL/);
assert.match(outboundReportSource, /sendOutboundDailyReport/);
const outboundReportCron = readFileSync(join(root, "src/app/api/cron/outbound-daily-report/route.ts"), "utf8");
assert.match(outboundReportCron, /requireCron/);
assert.match(outboundReportCron, /sendOutboundDailyReport/);
const sitemapSource = readFileSync(join(root, "src/app/sitemap.ts"), "utf8");
assert.match(sitemapSource, /\/sample/);
assert.match(sitemapSource, /\/pricing/);
assert.doesNotMatch(sitemapSource, /\/qualify/);
assert.match(sitemapSource, /marketvibe-email-preview\.png/);
assert.doesNotMatch(sitemapSource, /\/admin/);

const vercelConfig = readFileSync(join(root, "vercel.json"), "utf8");
assert.match(vercelConfig, /\/api\/cron\/sales-pipeline/);
assert.match(vercelConfig, /\/api\/cron\/outbound-autopilot/);
for (const suffix of ["", "-2", "-3", "-4", "-5"]) {
  assert.match(vercelConfig, new RegExp(`/api/cron/outbound-autopilot${suffix}`));
}
assert.match(vercelConfig, /\/api\/cron\/outbound-daily-report/);
