import { publishDueOpportunityDeliveries } from "@/lib/opportunity-engine";
import { getSupabaseAdmin } from "@/lib/supabase";

type Trigger = "admin" | "cron" | "test";

async function quarantineNonCanonicalQueuedAssignments() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");
  const { data, error } = await supabase
    .from("opportunity_assignments")
    .select("id,opportunity_id,opportunities(source_type)")
    .eq("assignment_status", "assigned")
    .eq("delivery_status", "queued")
    .limit(500);
  if (error) throw error;

  const blockedIds = (data || []).filter((row) => {
    const opportunity = Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities;
    return String(opportunity?.source_type || "") !== "public_buyer_intent_news";
  }).map((row) => String(row.id));

  if (blockedIds.length > 0) {
    const { error: updateError } = await supabase.from("opportunity_assignments").update({
      assignment_status: "replaced",
      delivery_status: "blocked_noncanonical",
      updated_at: new Date().toISOString(),
    }).in("id", blockedIds);
    if (updateError) throw updateError;
  }
  return blockedIds.length;
}

export async function restoreReusableProofPackInventory() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");
  const { data, error } = await supabase
    .from("opportunity_assignments")
    .select("opportunity_id,opportunities(source_type,verification_status,review_status,evidence_status)")
    .eq("product_code", "proof_pack")
    .in("assignment_status", ["assigned", "published", "delivered", "replaced"])
    .limit(1000);
  if (error) throw error;

  const reusableIds = Array.from(new Set((data || []).filter((row) => {
    const opportunity = Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities;
    return String(opportunity?.source_type || "") === "public_buyer_intent_news"
      && String(opportunity?.verification_status || "") === "QUALIFIED"
      && String(opportunity?.review_status || "") === "approved"
      && String(opportunity?.evidence_status || "") === "public_signal_verified";
  }).map((row) => String(row.opportunity_id))));

  if (reusableIds.length > 0) {
    const { error: updateError } = await supabase.from("opportunities").update({
      inventory_status: "IN_INVENTORY",
      assignment_status: null,
      delivery_status: null,
      customer_email: null,
      product_code: null,
      replacement_status: "none",
      updated_at: new Date().toISOString(),
    }).in("id", reusableIds);
    if (updateError) throw updateError;
  }
  return { reusableInventoryRestored: reusableIds.length };
}

export async function publishVerifiedBuyerIntentDeliveries({
  trigger = "admin",
  sendEmail = true,
}: {
  trigger?: Trigger;
  sendEmail?: boolean;
} = {}) {
  const blockedNonCanonical = await quarantineNonCanonicalQueuedAssignments();
  const published = await publishDueOpportunityDeliveries({ trigger, sendEmail });
  const reuse = await restoreReusableProofPackInventory();
  return { ...published, blockedNonCanonical, ...reuse };
}
