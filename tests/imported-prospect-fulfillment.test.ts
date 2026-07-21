import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  public_signal_text: "Visible result says the company is seeking a construction supplier for a new project.",
  evidence_summary: "Public signal supplied in the CSV.",
  source_note: "Captured as an internal source candidate.",
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

const persistenceSource = readFileSync(join(process.cwd(), "src", "lib", "sales-navigator-persistence.ts"), "utf8");
assert.match(persistenceSource, /LEGACY_IMPORTED_CUSTOMER_DELIVERY_RETIRED = true/, "Legacy imported customer delivery must be hard-disabled.");
assert.match(persistenceSource, /Direct imported-prospect delivery is retired/, "Direct legacy publishing must fail closed.");

const onboardingRoute = readFileSync(join(process.cwd(), "src", "app", "api", "onboarding", "route.ts"), "utf8");
assert.doesNotMatch(onboardingRoute, /autoFulfillImportedProspectsForOnboarding/, "Paid onboarding must not use imported-prospect fulfillment.");
assert.match(onboardingRoute, /fillCustomerShortages/, "Paid onboarding must enter the verified opportunity engine.");
assert.match(onboardingRoute, /verified_opportunity_engine/, "Onboarding must report the current fulfillment mode.");

const retiredCron = readFileSync(join(process.cwd(), "src", "app", "api", "cron", "imported-prospect-fulfillment", "route.ts"), "utf8");
assert.match(retiredCron, /legacy_imported_prospect_fulfillment_retired/, "Legacy fulfillment cron must fail closed.");

const vercelConfig = readFileSync(join(process.cwd(), "vercel.json"), "utf8");
assert.doesNotMatch(vercelConfig, /\/api\/cron\/imported-prospect-fulfillment/, "Vercel must not schedule legacy imported fulfillment.");

console.log("Imported prospect separation tests passed.");
