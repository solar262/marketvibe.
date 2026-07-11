import { runOpportunityDiscovery } from "@/lib/opportunity-engine";
import { getSupabaseAdmin } from "@/lib/supabase";

export const PROPERTY_PROFILE_NICHE = "High-value property and construction opportunities";

const REVIEWABLE_STATUSES = ["DISCOVERED", "VALIDATING", "QUALIFIED", "IN_INVENTORY"];
const NON_OPPORTUNITY_SOURCE_TYPES = new Set(["public_business_website"]);
const PROPERTY_CONTEXT_PATTERN = /\b(property|real estate|construction|building|builder|contractor|developer|development|renovation|planning|permit|land|housing|residential|commercial|architecture|infrastructure)\b/i;
const OPPORTUNITY_SIGNAL_PATTERN = /\b(looking for|seeking|request(?:ing)?|request for proposal|rfp|tender|procurement|invitation to bid|bid opportunity|contract (?:award|awarded|opportunity)|planning application|permit (?:application|approved|issued)|land for sale|site acquired|development proposal|new build|renovation project|construction project|buyer requirement|seller instruction|investment opportunity)\b/i;

type DiscoveryTrigger = "admin" | "cron" | "test";

type OpportunityRow = {
  id: string;
  company_name?: string | null;
  company_industry?: string | null;
  source_type?: string | null;
  source_name?: string | null;
  source_title?: string | null;
  source_text?: string | null;
  niche?: string | null;
  inventory_status?: string | null;
};

export function isGenuinePropertyOpportunity(row: OpportunityRow) {
  const sourceType = String(row.source_type || "");
  if (NON_OPPORTUNITY_SOURCE_TYPES.has(sourceType)) return false;

  const evidence = [
    row.company_name,
    row.company_industry,
    row.source_title,
    row.source_text,
    row.niche,
  ].filter(Boolean).join(" ");

  return PROPERTY_CONTEXT_PATTERN.test(evidence) && OPPORTUNITY_SIGNAL_PATTERN.test(evidence);
}

export async function enforcePropertyOpportunityIntegrity() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const { data, error } = await supabase
    .from("opportunities")
    .select("id,company_name,company_industry,source_type,source_name,source_title,source_text,niche,inventory_status")
    .eq("niche", PROPERTY_PROFILE_NICHE)
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
        quality_flags: ["property_integrity_guard", "not_opportunity_signal", "directory_business_record"],
        updated_at: new Date().toISOString(),
      })
      .in("id", rejectedIds);

    if (updateError) throw updateError;
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
  const discovery = await runOpportunityDiscovery({ trigger, profileId });
  const after = await enforcePropertyOpportunityIntegrity();

  return {
    ...discovery,
    integrity: { before, after },
  };
}
