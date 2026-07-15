import {
  buildExclusivityKey,
  buildOpportunityDedupeKey,
  normalizeEmail,
  selectMatchingOpportunities,
  type ActiveExclusivity,
  type CustomerSearchProfile,
  type MatchableOpportunity,
  type OpportunityInput,
} from "@/lib/opportunity-quality";
import { profileHasActiveEntitlement } from "@/lib/paid-profile-access";
import type { PremiumProductCode } from "@/lib/premium-products";
import { getSupabaseAdmin } from "@/lib/supabase";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
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
    customer_email: normalizeEmail(row.customer_email),
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

function opportunityInput(row: Record<string, unknown>): OpportunityInput {
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

function matchableOpportunity(row: Record<string, unknown>): MatchableOpportunity {
  const input = opportunityInput(row);
  return {
    ...input,
    id: String(row.id),
    dedupe_key: String(row.dedupe_key || buildOpportunityDedupeKey(input)),
    exclusivity_key: row.exclusivity_key ? String(row.exclusivity_key) : null,
    inventory_status: String(row.inventory_status || "DISCOVERED") as MatchableOpportunity["inventory_status"],
    delivery_status: row.delivery_status ? String(row.delivery_status) : null,
    fit_score: Number(row.fit_score || 0),
    intent_score: Number(row.intent_score || 0),
    evidence_score: Number(row.evidence_score || 0),
    freshness_score: Number(row.freshness_score || 0),
    overall_score: Number(row.overall_score || 0),
    intent_category: String(row.intent_category || "unavailable") as MatchableOpportunity["intent_category"],
    evidence_status: String(row.evidence_status || "unavailable") as MatchableOpportunity["evidence_status"],
    reasons: {
      fit: [],
      intent: [],
      evidence: [],
      freshness: [],
      overall: "",
    },
  };
}

async function createRun(supabase: SupabaseClient, trigger: Trigger, profile: CustomerSearchProfile) {
  const bucket = trigger === "cron" ? new Date().toISOString().slice(0, 13) : `${nowIso()}:${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await supabase.from("opportunity_source_runs").insert({
    run_type: "buyer_intent_matching",
    trigger_source: trigger,
    idempotency_key: `buyer-intent-matching:${profile.id || "unknown"}:${bucket}`,
    search_profile_id: profile.id || null,
    customer_email: profile.customer_email,
    niche: profile.niche,
    target_location: profile.target_locations.join(", "),
  }).select("id").single();
  if (error || !data) throw error || new Error("Matching run could not be created.");
  return String(data.id);
}

async function finishRun(supabase: SupabaseClient, runId: string, status: "completed" | "failed", result: Record<string, unknown>) {
  const { error } = await supabase.from("opportunity_source_runs").update({
    status,
    finished_at: nowIso(),
    ...result,
  }).eq("id", runId);
  if (error) throw error;
}

async function activeReservations(supabase: SupabaseClient): Promise<ActiveExclusivity[]> {
  const { data, error } = await supabase
    .from("opportunity_exclusivity_reservations")
    .select("exclusivity_key,customer_email,ends_at,status")
    .eq("status", "active");
  if (error) throw error;
  return (data || []).map((row) => ({
    exclusivity_key: String(row.exclusivity_key),
    customer_email: String(row.customer_email),
    ends_at: row.ends_at ? String(row.ends_at) : null,
    status: "active" as const,
  }));
}

async function deliveredIds(supabase: SupabaseClient, profile: CustomerSearchProfile) {
  const { data, error } = await supabase
    .from("opportunity_assignments")
    .select("opportunity_id")
    .eq("customer_email", profile.customer_email)
    .eq("search_profile_id", profile.id || "")
    .in("assignment_status", ["assigned", "published", "delivered", "replaced"]);
  if (error) throw error;
  return new Set((data || []).map((row) => String(row.opportunity_id)));
}

export function opportunityRemainsReusable(exclusivityMode: CustomerSearchProfile["exclusivity_mode"]) {
  return exclusivityMode === "non_exclusive";
}

export async function assignVerifiedBuyerIntentOpportunities({
  trigger = "admin",
  profileId,
  quantity,
}: {
  trigger?: Trigger;
  profileId: string;
  quantity?: number;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const { data: profileRow, error: profileError } = await supabase
    .from("customer_search_profiles")
    .select("*")
    .eq("id", profileId)
    .eq("status", "active")
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profileRow) return { ok: false, skipped: true, reason: "profile_not_active", records_added_to_inventory: 0, customer_shortages: quantity || 0 };

  const profile = profileFromRow(profileRow as Record<string, unknown>);
  if (!await profileHasActiveEntitlement(supabase, profile)) {
    return { ok: false, skipped: true, reason: "paid_entitlement_not_active", records_added_to_inventory: 0, customer_shortages: quantity || profile.opportunity_quantity };
  }

  const runId = await createRun(supabase, trigger, profile);
  const target = Math.max(0, quantity ?? profile.opportunity_quantity);
  const counters = {
    records_discovered: 0,
    records_rejected: 0,
    records_qualified: 0,
    records_added_to_inventory: 0,
    duplicate_count: 0,
    stale_records: 0,
    customer_shortages: 0,
    source_failures: [] as Array<Record<string, unknown>>,
  };

  try {
    const [reservations, alreadyDelivered, inventoryResult] = await Promise.all([
      activeReservations(supabase),
      deliveredIds(supabase, profile),
      supabase
        .from("opportunities")
        .select("*")
        .eq("source_type", "public_buyer_intent_news")
        .in("inventory_status", ["QUALIFIED", "IN_INVENTORY"])
        .eq("verification_status", "QUALIFIED")
        .eq("review_status", "approved")
        .eq("evidence_status", "public_signal_verified")
        .eq("is_test_data", false)
        .order("overall_score", { ascending: false })
        .limit(500),
    ]);
    if (inventoryResult.error) throw inventoryResult.error;

    const opportunities = (inventoryResult.data || []).map((row) => {
      const opportunity = matchableOpportunity(row as Record<string, unknown>);
      return {
        ...opportunity,
        previously_delivered_to: alreadyDelivered.has(opportunity.id) ? [profile.customer_email] : [],
      };
    });
    counters.records_discovered = opportunities.length;

    const selection = selectMatchingOpportunities({
      opportunities,
      profile,
      activeExclusivity: reservations,
      quantity: target,
    });
    counters.records_rejected = selection.rejected.length;
    counters.records_qualified = selection.selected.length;
    counters.customer_shortages = selection.shortage;

    for (const opportunity of selection.selected) {
      const assignedAt = nowIso();
      const exclusivityKey = opportunity.exclusivity_key || buildExclusivityKey(opportunity, profile);
      const endsAt = profile.exclusivity_period_days > 0
        ? new Date(Date.now() + profile.exclusivity_period_days * 86_400_000).toISOString()
        : null;

      if (exclusivityKey) {
        const { error: reservationError } = await supabase.from("opportunity_exclusivity_reservations").insert({
          opportunity_id: opportunity.id,
          search_profile_id: profile.id || null,
          customer_email: profile.customer_email,
          product_code: profile.product_code,
          exclusivity_key: exclusivityKey,
          exclusivity_mode: profile.exclusivity_mode,
          starts_at: assignedAt,
          ends_at: endsAt,
        });
        if (reservationError?.code === "23505") {
          counters.duplicate_count += 1;
          continue;
        }
        if (reservationError) throw reservationError;
      }

      const { error: assignmentError } = await supabase.from("opportunity_assignments").insert({
        opportunity_id: opportunity.id,
        search_profile_id: profile.id || null,
        customer_email: profile.customer_email,
        product_code: profile.product_code,
        assignment_status: "assigned",
        delivery_status: "queued",
        match_reason: {
          reasons: opportunity.match_reasons,
          scores: {
            fit: opportunity.fit_score,
            intent: opportunity.intent_score,
            evidence: opportunity.evidence_score,
            overall: opportunity.overall_score,
          },
        },
        reserved_at: assignedAt,
        assigned_at: assignedAt,
      });
      if (assignmentError?.code === "23505") {
        counters.duplicate_count += 1;
        continue;
      }
      if (assignmentError) throw assignmentError;

      if (!opportunityRemainsReusable(profile.exclusivity_mode)) {
        const { error: updateError } = await supabase.from("opportunities").update({
          inventory_status: "ASSIGNED",
          assignment_status: "assigned",
          delivery_status: "queued",
          customer_email: profile.customer_email,
          product_code: profile.product_code,
          updated_at: assignedAt,
        }).eq("id", opportunity.id);
        if (updateError) throw updateError;
      }
      counters.records_added_to_inventory += 1;
    }

    await finishRun(supabase, runId, "completed", counters);
    return { ok: counters.customer_shortages === 0, runId, ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", {
      ...counters,
      error_summary: { message: error instanceof Error ? error.message : "Buyer-intent matching failed." },
    });
    throw error;
  }
}
