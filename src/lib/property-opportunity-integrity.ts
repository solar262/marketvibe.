import { getSupabaseAdmin } from "@/lib/supabase";
import { runOpportunityDiscovery } from "@/lib/opportunity-engine";
import { opportunityDeliveryQualityFlags } from "@/lib/opportunity-quality";

export const PROPERTY_PROFILE_NICHE = "High-value property and construction opportunities";
const PROPERTY_PROFILE_NICHES = [PROPERTY_PROFILE_NICHE, "Property Pipeline Buyers"];

const REVIEWABLE_STATUSES = ["DISCOVERED", "VALIDATING", "QUALIFIED", "IN_INVENTORY", "ASSIGNED"];
const NON_OPPORTUNITY_SOURCE_TYPES = new Set(["public_business_website"]);
const PROPERTY_CONTEXT_PATTERN = /\b(property|real estate|construction|building|builder|contractor|developer|development|renovation|planning|permit|land|housing|residential|architecture|infrastructure)\b/i;
const OPPORTUNITY_SIGNAL_PATTERN = /\b(request for proposal|rfp|tender|procurement|invitation to bid|bid opportunity|quote request|(?:vendor|contractor|consultant|supplier) needs? to provide|request(?:ing)? (?:quotes?|proposals?|supplier|vendor|contractor|builder|agency|consultant|support|help)|looking for (?:a |an |new |qualified |local |specialist )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support|help|quotes?|proposals?)|need(?:s|ed)? (?:a |an |new |qualified |local |specialist )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support|help|quotes?|proposals?)|seeking (?:a |an |new |qualified |local |specialist |for )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support|help|quotes?|proposals?)|contract (?:award|awarded|opportunity)|planning application|permit (?:application|approved|issued)|land for sale|land acquired|site acquired|site release|development proposal|new build|new homes?|renovation project|construction project|buyer requirement|seller instruction|investment opportunity|hiring|recruiting|expanding|expansion|opening|launching|growth|pipeline|portfolio growth|project launch)\b/i;
const RFPMART_ALLOWED_PROPERTY_CATEGORIES = new Set(["CONS", "ESTATE"]);

type DiscoveryTrigger = "admin" | "cron" | "test";

type OpportunityRow = {
  id: string;
  company_name?: string | null;
  company_industry?: string | null;
  source_type?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  source_title?: string | null;
  source_text?: string | null;
  niche?: string | null;
  inventory_status?: string | null;
};

export function isGenuinePropertyOpportunity(row: OpportunityRow) {
  const sourceType = String(row.source_type || "");
  if (NON_OPPORTUNITY_SOURCE_TYPES.has(sourceType)) return false;
  if (opportunityDeliveryQualityFlags({
    company_name: String(row.company_name || ""),
    source_url: String(row.source_url || ""),
    source_title: row.source_title || null,
    source_text: String(row.source_text || ""),
  }).length > 0) return false;

  const profileLabels = new Set([String(row.niche || ""), ...PROPERTY_PROFILE_NICHES].map((value) => value.toLowerCase()));
  const companyIndustry = String(row.company_industry || "");
  const usableIndustry = profileLabels.has(companyIndustry.toLowerCase()) ? "" : companyIndustry;
  const rfpmartCategory = String(row.source_title || "").match(/^([A-Z]+)-\d+\s+-/)?.[1]?.toUpperCase();
  if (rfpmartCategory && !RFPMART_ALLOWED_PROPERTY_CATEGORIES.has(rfpmartCategory)) return false;

  const evidence = [
    row.company_name,
    usableIndustry,
    row.source_title,
    row.source_text,
  ].filter(Boolean).join(" ");

  if (/\bproperty and casualty\b/i.test(evidence) && !/\b(real estate|housing|land|development|construction|building|builder|contractor)\b/i.test(evidence.replace(/\bproperty and casualty\b/gi, ""))) {
    return false;
  }

  return PROPERTY_CONTEXT_PATTERN.test(evidence) && OPPORTUNITY_SIGNAL_PATTERN.test(evidence);
}

export async function enforcePropertyOpportunityIntegrity() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const { data, error } = await supabase
    .from("opportunities")
    .select("id,company_name,company_industry,source_type,source_name,source_url,source_title,source_text,niche,inventory_status")
    .in("niche", PROPERTY_PROFILE_NICHES)
    .in("inventory_status", REVIEWABLE_STATUSES)
    .limit(1000);

  if (error) throw error;

  const rows = (data || []) as OpportunityRow[];
  const rejectedIds = rows.filter((row) => !isGenuinePropertyOpportunity(row)).map((row) => row.id);

  if (rejectedIds.length > 0) {
    const { error: updateError } = await supabase
      .from("opportunities")
      .update({
        inventory_status: "REJECTED",
        verification_status: "REJECTED",
        review_status: "rejected",
        rejection_reason: "not_a_verified_property_opportunity_signal",
        quality_flags: ["property_integrity_guard", "legacy_lead_engine_quarantined", "not_opportunity_signal"],
        updated_at: new Date().toISOString(),
      })
      .in("id", rejectedIds);

    if (updateError) throw updateError;

    const { error: assignmentUpdateError } = await supabase
      .from("opportunity_assignments")
      .update({
        assignment_status: "removed",
        delivery_status: "not_delivered",
        updated_at: new Date().toISOString(),
      })
      .in("opportunity_id", rejectedIds)
      .in("assignment_status", ["reserved", "assigned"]);

    if (assignmentUpdateError) throw assignmentUpdateError;
  }

  return {
    examined: rows.length,
    rejected: rejectedIds.length,
    retained: rows.length - rejectedIds.length,
  };
}

export async function runPropertyDiscoveryWithIntegrity({
  trigger = "admin",
  profileId,
}: {
  trigger?: DiscoveryTrigger;
  profileId?: string;
} = {}) {
  const before = await enforcePropertyOpportunityIntegrity();
  const discovery = await runOpportunityDiscovery({ trigger, profileId, includeLiveLeadEngine: false });
  const after = await enforcePropertyOpportunityIntegrity();

  return {
    ok: true,
    skipped: discovery.records_discovered === 0,
    trigger,
    profileId: profileId || null,
    source_policy: "dedicated_property_sources_only",
    discovery_status: discovery.records_discovered > 0 ? "completed" : "awaiting_dedicated_property_sources",
    records_discovered: discovery.records_discovered,
    records_rejected: discovery.records_rejected + after.rejected,
    records_qualified: discovery.records_qualified,
    records_added_to_inventory: discovery.records_added_to_inventory,
    duplicate_count: discovery.duplicate_count,
    stale_records: discovery.stale_records,
    customer_shortages: discovery.customer_shortages,
    source_failures: discovery.source_failures,
    integrity: { before, after },
    discovery,
    message: discovery.records_discovered > 0
      ? "Dedicated public-source discovery ran and legacy local-business records were quarantined."
      : "Legacy local-business discovery is quarantined. Configure OPPORTUNITY_RSS_FEEDS or import reviewed public signals to create deliverable inventory.",
  };
}
