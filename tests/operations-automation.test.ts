import assert from "node:assert/strict";
import { basicBusinessEmailAssessment } from "../src/lib/operations-enrichment";
import { classifyReply, emailWebhookAuthorized } from "../src/lib/operations-email";
import { automatedSourceAllowed } from "../src/lib/operations-supply";
import { customerEmailForApiKey } from "../src/lib/operations-integrations";
import { summarizeOpportunityPerformance } from "../src/lib/operations-learning";
import { validateDataRequest } from "../src/lib/operations-governance";
import { validMarketVibeActionsClaims } from "../src/lib/github-actions-oidc";

assert.equal(basicBusinessEmailAssessment("founder@acme.co", "acme.co").valid, true);
assert.equal(basicBusinessEmailAssessment("person@gmail.com", "acme.co").reason, "personal_or_free_mail_domain");
assert.equal(basicBusinessEmailAssessment("founder@other.co", "acme.co").reason, "email_domain_does_not_match_company");

assert.equal(classifyReply("Yes, this looks useful. Can we book a call next week?"), "meeting_request");
assert.equal(classifyReply("Please unsubscribe me and do not contact me again."), "unsubscribe");
assert.equal(classifyReply("I am out of office until Monday."), "out_of_office");
assert.equal(classifyReply("Not interested, thanks."), "negative");

process.env.EMAIL_WEBHOOK_SECRET = "test-email-webhook-secret";
assert.equal(emailWebhookAuthorized(new Request("https://example.com", { headers: { authorization: "Bearer test-email-webhook-secret" } }), "{}"), true);
assert.equal(emailWebhookAuthorized(new Request("https://example.com", { headers: { authorization: "Bearer wrong" } }), "{}"), false);

assert.equal(automatedSourceAllowed({
  company_name: "Acme",
  source_url: "https://acme.co/news/hiring",
  source_text: "Acme is hiring a revenue operations director.",
  license_basis: "licensed_partner_feed",
}), true);
assert.equal(automatedSourceAllowed({
  company_name: "Acme",
  source_url: "https://www.linkedin.com/sales/lead/123",
  source_text: "Visible lead card",
  license_basis: "owner_export",
}), false);

const apiKey = "customer-key-that-is-long-enough";
process.env.MARKETVIBE_CUSTOMER_API_KEYS = JSON.stringify({ [apiKey]: "Buyer@Example.com" });
assert.equal(customerEmailForApiKey(apiKey), "buyer@example.com");
assert.equal(customerEmailForApiKey("wrong-key-that-is-long-enough"), "");

const performance = summarizeOpportunityPerformance([
  { source_type: "rss", inventory_status: "QUALIFIED", overall_score: 80 },
  { source_type: "rss", inventory_status: "DELIVERED", overall_score: 90 },
  { source_type: "rss", inventory_status: "REJECTED", overall_score: 20 },
]);
assert.equal(performance.rss.discovered, 3);
assert.equal(performance.rss.qualified, 2);
assert.equal(performance.rss.delivered, 1);
assert.equal(performance.rss.average_score, 63.33);

assert.equal(validateDataRequest({ email: "person@acme.co", requestType: "deletion", message: "Delete the public company contact record." }).ok, true);
assert.equal(validateDataRequest({ email: "invalid", requestType: "access", message: "Please provide my stored data." }).ok, false);

const now = Math.floor(Date.now() / 1000);
assert.equal(validMarketVibeActionsClaims({
  iss: "https://token.actions.githubusercontent.com",
  aud: "https://www.marketvibe1.com/automation",
  repository_owner: "solar262",
  workflow_ref: "solar262/marketvibe/.github/workflows/marketvibe-operations.yml@refs/heads/main",
  ref: "refs/heads/main",
  nbf: now - 5,
  exp: now + 300,
}, now), true);
assert.equal(validMarketVibeActionsClaims({
  iss: "https://token.actions.githubusercontent.com",
  aud: "https://www.marketvibe1.com/automation",
  repository_owner: "attacker",
  workflow_ref: "attacker/repo/.github/workflows/marketvibe-operations.yml@refs/heads/main",
  ref: "refs/heads/main",
  nbf: now - 5,
  exp: now + 300,
}, now), false);

console.log("operations automation tests passed");
