import {
  buildCustomerSummary,
  calculateOpportunityScores,
  normalizeText,
  normalizeUrl,
  qualifyOpportunity,
  recommendedAction,
  type CustomerSearchProfile,
  type OpportunityInput,
} from "@/lib/opportunity-quality";
import type { PremiumProductCode } from "@/lib/premium-products";
import { scanPublicWebsite } from "@/lib/sales-navigator-import";
import { getSupabaseAdmin } from "@/lib/supabase";

type Trigger = "admin" | "cron" | "test";

function nowIso() {
  return new Date().toISOString();
}

function arrayFromDb(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function profileFromRow(row: Record<string, unknown>): CustomerSearchProfile {
  return {
    id: String(row.id || ""),
    customer_email: String(row.customer_email || "").trim().toLowerCase(),
    product_code: String(row.product_code || "proof_pack") as PremiumProductCode,
    status: row.status === "paused" ? "paused" : "active",
    niche: String(row.niche || ""),
    target_service: String(row.target_service || ""),
    target_industries: arrayFromDb(row.target_industries),
    target_locations: arrayFromDb(row.target_locations),
    company_sizes: arrayFromDb(row.company_sizes),
    target_job_roles: arrayFromDb(row.target_job_roles),
    minimum_fit_score: Number(row.minimum_fit_score || 50),
    minimum_intent_score: Number(row.minimum_intent_score || 35),
    minimum_evidence_score: Number(row.minimum_evidence_score || 50),
    maximum_record_age_days: Number(row.maximum_record_age_days || 90),
    opportunity_quantity: Number(row.opportunity_quantity || 10),
    delivery_frequency: row.delivery_frequency === "daily" || row.delivery_frequency === "monthly" || row.delivery_frequency === "once" ? row.delivery_frequency : "weekly",
    exclusivity_mode: row.exclusivity_mode === "non_exclusive" || row.exclusivity_mode === "niche_exclusive" || row.exclusivity_mode === "geographic_exclusive" || row.exclusivity_mode === "time_limited_exclusive" ? row.exclusivity_mode : "customer_exclusive",
    exclusivity_period_days: Number(row.exclusivity_period_days || 14),
    allow_profile_only: Boolean(row.allow_profile_only),
    replacement_policy: row.replacement_policy === "none" || row.replacement_policy === "admin_review" || row.replacement_policy === "automatic" ? row.replacement_policy : "objective_failures",
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {},
  };
}

function opportunityFromRow(row: Record<string, unknown>): OpportunityInput {
  return {
    id: String(row.id || ""),
    company_name: String(row.company_name || ""),
    company_domain: row.company_domain ? String(row.company_domain) : null,
    company_website: row.company_website ? String(row.company_website) : null,
    company_location: row.company_location ? String(row.company_location) : null,
    company_country: row.company_country ? String(row.company_country) : null,
    company_industry: row.company_industry ? String(row.company_industry) : null,
    company_size: row.company_size ? String(row.company_size) : null,
    company_description: row.company_description ? String(row.company_description) : null,
    contact_full_name: row.contact_full_name ? String(row.contact_full_name) : null,
    contact_first_name: row.contact_first_name ? String(row.contact_first_name) : null,
    contact_last_name: row.contact_last_name ? String(row.contact_last_name) : null,
    contact_job_title: row.contact_job_title ? String(row.contact_job_title) : null,
    public_email: row.public_email ? String(row.public_email) : null,
    public_phone: row.public_phone ? String(row.public_phone) : null,
    source_type: String(row.source_type || ""),
    source_name: String(row.source_name || ""),
    source_url: String(row.source_url || ""),
    source_title: row.source_title ? String(row.source_title) : null,
    source_text: String(row.source_text || ""),
    source_published_at: row.source_published_at ? String(row.source_published_at) : null,
    captured_at: row.captured_at ? String(row.captured_at) : null,
    last_verified_at: row.last_verified_at ? String(row.last_verified_at) : null,
    evidence_status: row.evidence_status as OpportunityInput["evidence_status"],
    intent_category: row.intent_category as OpportunityInput["intent_category"],
    inventory_status: row.inventory_status as OpportunityInput["inventory_status"],
    niche: row.niche ? String(row.niche) : null,
    target_location: row.target_location ? String(row.target_location) : null,
    is_test_data: Boolean(row.is_test_data),
  };
}

function firstEvidenceMatch(evidence: string, values: string[]) {
  const normalized = normalizeText(evidence);
  return values.find((value) => value && normalized.includes(normalizeText(value))) || null;
}

export async function runProfileAwareOpportunityVerification({ trigger = "admin", limit = 100 }: { trigger?: Trigger; limit?: number } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("source_type", "public_buyer_intent_news")
    .in("inventory_status", ["DISCOVERED", "VALIDATING", "IN_INVENTORY", "QUALIFIED"])
    .lte("next_verification_at", nowIso())
    .eq("is_test_data", false)
    .limit(limit);
  if (error) throw error;

  const counters = { examined: 0, qualified: 0, rejected: 0, deferred: 0, failures: [] as Array<Record<string, unknown>> };

  for (const raw of data || []) {
    const row = raw as Record<string, unknown>;
    counters.examined += 1;
    const rawPayload = row.raw_payload && typeof row.raw_payload === "object" ? row.raw_payload as Record<string, unknown> : {};
    const profileId = String(rawPayload.search_profile_id || "");
    if (!profileId) {
      counters.rejected += 1;
      await supabase.from("opportunities").update({ inventory_status: "REJECTED", verification_status: "REJECTED", review_status: "rejected", rejection_reason: "missing_customer_search_profile", quality_flags: ["missing_customer_search_profile"], updated_at: nowIso() }).eq("id", row.id);
      continue;
    }

    const { data: profileRow, error: profileError } = await supabase.from("customer_search_profiles").select("*").eq("id", profileId).eq("status", "active").maybeSingle();
    if (profileError || !profileRow) {
      counters.rejected += 1;
      await supabase.from("opportunities").update({ inventory_status: "REJECTED", verification_status: "REJECTED", review_status: "rejected", rejection_reason: "inactive_or_missing_customer_search_profile", quality_flags: ["inactive_or_missing_customer_search_profile"], updated_at: nowIso() }).eq("id", row.id);
      continue;
    }

    const profile = profileFromRow(profileRow as Record<string, unknown>);
    const input = opportunityFromRow(row);
    const sourceUrl = normalizeUrl(input.source_url);

    try {
      const scan = await scanPublicWebsite(sourceUrl);
      const combinedEvidence = `${input.source_title || ""} ${input.source_text || ""} ${scan.textEvidence || ""}`.replace(/\s+/g, " ").trim().slice(0, 5000);
      if (normalizeText(combinedEvidence).length < 40) {
        counters.deferred += 1;
        await supabase.from("opportunities").update({ inventory_status: "VALIDATING", verification_status: "VALIDATING", review_status: "pending", next_verification_at: new Date(Date.now() + 86_400_000).toISOString(), rejection_reason: "source_page_has_no_readable_evidence", updated_at: nowIso() }).eq("id", row.id);
        continue;
      }

      const matchedIndustry = firstEvidenceMatch(combinedEvidence, [profile.niche, profile.target_service, ...profile.target_industries]);
      const matchedLocation = firstEvidenceMatch(combinedEvidence, profile.target_locations);
      const verifiedInput: OpportunityInput = {
        ...input,
        source_url: scan.finalUrl || sourceUrl,
        source_text: combinedEvidence,
        company_description: combinedEvidence.slice(0, 1000),
        company_industry: matchedIndustry,
        company_location: matchedLocation || input.company_location || null,
        niche: matchedIndustry,
        target_location: matchedLocation,
        last_verified_at: nowIso(),
        evidence_status: "public_signal_verified",
      };
      const scores = calculateOpportunityScores(verifiedInput, profile);
      const qualification = qualifyOpportunity(verifiedInput, scores, profile);
      const update = {
        source_url: verifiedInput.source_url,
        source_text: verifiedInput.source_text,
        company_description: verifiedInput.company_description,
        company_industry: verifiedInput.company_industry,
        company_location: verifiedInput.company_location,
        niche: verifiedInput.niche,
        target_location: verifiedInput.target_location,
        last_verified_at: nowIso(),
        next_verification_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        fit_score: scores.fit_score,
        intent_score: scores.intent_score,
        evidence_score: scores.evidence_score,
        freshness_score: scores.freshness_score,
        overall_score: scores.overall_score,
        score_reasons: scores.reasons,
        intent_category: scores.intent_category,
        evidence_status: scores.evidence_status,
        verification_status: qualification.verification_status,
        review_status: qualification.review_status,
        inventory_status: qualification.inventory_status,
        rejection_reason: qualification.rejection_reason || null,
        quality_flags: qualification.quality_flags,
        customer_summary: buildCustomerSummary(verifiedInput, scores),
        recommended_action: recommendedAction(verifiedInput, scores),
        updated_at: nowIso(),
      };
      const { error: updateError } = await supabase.from("opportunities").update(update).eq("id", row.id);
      if (updateError) throw updateError;
      await supabase.from("opportunity_verification_events").insert({ opportunity_id: row.id, verification_status: qualification.verification_status, website_status: "not_applicable", source_status: "resolved", evidence_found: true, notes: `Source verified and rescored against active customer search profile ${profileId}.`, raw_result: { scores, qualification, search_profile_id: profileId, matchedIndustry, matchedLocation } });
      if (qualification.qualified) counters.qualified += 1;
      else counters.rejected += 1;
    } catch (verificationError) {
      counters.deferred += 1;
      counters.failures.push({ opportunityId: row.id, error: verificationError instanceof Error ? verificationError.message : "Source verification failed." });
      await supabase.from("opportunities").update({ inventory_status: "VALIDATING", verification_status: "VALIDATING", review_status: "pending", next_verification_at: new Date(Date.now() + 86_400_000).toISOString(), updated_at: nowIso() }).eq("id", row.id);
    }
  }

  return { ok: counters.failures.length === 0, profileAware: counters, legacy: { skipped: true, reason: "Paid buyer-intent records are isolated from the legacy profile-unaware verifier." } };
}
