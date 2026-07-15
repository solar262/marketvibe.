import { assignVerifiedBuyerIntentOpportunities } from "@/lib/buyer-intent-matching";
import { opportunityConfigForProduct } from "@/lib/opportunity-products";
import { filterProfilesWithActiveEntitlements } from "@/lib/paid-profile-access";
import type { PremiumProductCode } from "@/lib/premium-products";
import { getSupabaseAdmin } from "@/lib/supabase";

function windowStart(frequency: "once" | "daily" | "weekly" | "monthly") {
  if (frequency === "once") return null;
  const days = frequency === "daily" ? 1 : frequency === "weekly" ? 7 : 30;
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export async function fillDueCustomerShortages({ trigger = "cron" }: { trigger?: "admin" | "cron" | "test" } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const { data: profileRows, error } = await supabase
    .from("customer_search_profiles")
    .select("id,customer_email,product_code,status")
    .eq("status", "active")
    .limit(100);
  if (error) throw error;

  const profiles = await filterProfilesWithActiveEntitlements(
    supabase,
    (profileRows || []).map((row) => ({
      id: String(row.id),
      customer_email: String(row.customer_email || ""),
      product_code: String(row.product_code || "proof_pack") as PremiumProductCode,
      status: String(row.status || "active"),
    })),
  );

  const results: Array<Record<string, unknown>> = [];
  let totalShortage = 0;
  let totalAssigned = 0;

  for (const profile of profiles) {
    const productCode = profile.product_code;
    if (!["proof_pack", "radar", "growth_desk"].includes(productCode)) continue;
    const config = opportunityConfigForProduct(productCode);
    let countQuery = supabase
      .from("opportunity_assignments")
      .select("id", { count: "exact", head: true })
      .eq("search_profile_id", profile.id)
      .in("assignment_status", ["assigned", "published", "delivered"]);
    const start = windowStart(config.deliveryFrequency);
    if (start) countQuery = countQuery.gte("assigned_at", start);
    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    const alreadyAllocated = count || 0;
    const remaining = Math.max(0, config.opportunityQuantity - alreadyAllocated);
    if (remaining === 0) {
      results.push({
        profileId: profile.id,
        customerEmail: profile.customer_email,
        productCode,
        status: "cadence_satisfied",
        allocatedInWindow: alreadyAllocated,
        target: config.opportunityQuantity,
      });
      continue;
    }

    const result = await assignVerifiedBuyerIntentOpportunities({
      trigger,
      profileId: profile.id,
      quantity: remaining,
    });
    const shortage = Number(result.customer_shortages || 0);
    const assigned = Number(result.records_added_to_inventory || 0);
    totalShortage += shortage;
    totalAssigned += assigned;
    results.push({
      profileId: profile.id,
      customerEmail: profile.customer_email,
      productCode,
      status: shortage > 0 ? "shortage" : "processed",
      allocatedInWindow: alreadyAllocated,
      requested: remaining,
      assigned,
      shortage,
      runId: "runId" in result ? result.runId : null,
      reason: "reason" in result ? result.reason : null,
    });
  }

  return {
    ok: totalShortage === 0,
    status: totalShortage === 0 ? "healthy" : "degraded",
    profilesExamined: profiles.length,
    excludedWithoutPaidAccess: (profileRows?.length || 0) - profiles.length,
    totalAssigned,
    totalShortage,
    results,
  };
}
