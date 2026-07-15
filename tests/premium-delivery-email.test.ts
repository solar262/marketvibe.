import assert from "node:assert/strict";
import { isGenuinePropertyOpportunity } from "../src/lib/property-opportunity-integrity";
import { buildProofPackPdf, proofPackPdfItemsFromOpportunityRows } from "../src/lib/proof-pack-pdf";

const propertyOpportunity = {
  id: "property-opportunity-1",
  company_name: "Northbank Developments",
  company_industry: "Property development",
  source_type: "public_planning_register",
  source_name: "Manchester planning register",
  source_title: "Planning application approved for a 42-home development",
  source_text: "The approved new build development is seeking a main construction contractor.",
  source_url: "https://example.gov/planning/42-homes",
  company_location: "Manchester, United Kingdom",
  niche: "High-value property and construction opportunities",
  inventory_status: "DELIVERED",
  overall_score: 91,
  customer_summary: "Approved residential development with a public construction requirement.",
  recommended_action: "Approach the development team with relevant residential delivery credentials.",
};

const legacyLocalBusiness = {
  id: "legacy-local-business-1",
  company_name: "Sample Cafe",
  company_industry: "Cafe",
  source_type: "public_business_website",
  source_name: "MarketVibe live lead engine",
  source_title: "Sample Cafe website",
  source_text: "The cafe website has no online booking form.",
  niche: "High-value property and construction opportunities",
  inventory_status: "DELIVERED",
};

assert.equal(isGenuinePropertyOpportunity(propertyOpportunity), true);
assert.equal(isGenuinePropertyOpportunity(legacyLocalBusiness), false);

const items = proofPackPdfItemsFromOpportunityRows([
  { product_code: "proof_pack", opportunities: propertyOpportunity },
]);
assert.equal(items.length, 1);
assert.equal(items[0].companyName, "Northbank Developments");
assert.equal(items[0].score, 91);

const pdf = buildProofPackPdf(items, {
  customerEmail: "buyer@example.com",
  generatedAt: "2026-07-11T12:00:00.000Z",
});
const pdfText = pdf.toString("utf8");
assert.equal(pdf.subarray(0, 8).toString("utf8"), "%PDF-1.4");
assert.match(pdfText, /MarketVibe Proof Pack/);
assert.match(pdfText, /Northbank Developments/);
assert.match(pdfText, /verified buyer-intent opportunity intelligence/i);
assert.match(pdfText, /%%EOF$/);

console.log("Brevo premium delivery PDF tests passed.");
