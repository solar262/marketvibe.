import { normalizeText, normalizeUrl } from "@/lib/opportunity-quality";

const DELIVERABLE_INTENT = new Set(["verified_direct_intent", "public_opportunity_signal"]);
const DELIVERABLE_EVIDENCE = new Set(["public_signal_verified", "decision_maker_verified"]);
const BLOCKED_SOURCE_TYPES = new Set([
  "public_business_website",
  "admin_pasted_public_url",
  "linkedin_profile_or_company_url",
  "sales_navigator_url",
]);

export function isDeliverableBuyerIntentOpportunity(row: Record<string, unknown>) {
  const sourceType = String(row.source_type || "");
  const intentCategory = String(row.intent_category || "");
  const evidenceStatus = String(row.evidence_status || "");
  const sourceUrl = normalizeUrl(row.source_url);
  const sourceText = normalizeText(row.source_text);
  const companyName = normalizeText(row.company_name);
  const isTestData = Boolean(row.is_test_data);

  if (isTestData || BLOCKED_SOURCE_TYPES.has(sourceType)) return false;
  if (!companyName || !sourceUrl || sourceText.length < 40) return false;
  if (!DELIVERABLE_INTENT.has(intentCategory)) return false;
  if (!DELIVERABLE_EVIDENCE.has(evidenceStatus)) return false;
  return true;
}

export function filterDeliverableBuyerIntentAssignments(rows: Array<Record<string, unknown>>) {
  return rows.filter((row) => {
    const opportunity = (row.opportunities || row.opportunity || row) as Record<string, unknown>;
    return isDeliverableBuyerIntentOpportunity(opportunity);
  });
}
