import { fillCustomerShortages } from "@/lib/opportunity-engine";
import { opportunityConfigForProduct } from "@/lib/opportunity-products";
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

  const { data: profiles, error } = await supabase
    .from("customer_search_profiles")
    .select("id,customer_email,product_code,status")
    .eq("status", "active")
    .limit(100);
  if (error) throw error;

  const results: Array<Record<string, unknown>> = [];
  let totalShortage = 0;
  let totalAssigned = 0;

  for (const rawProfile of profiles || []) {
    const productCode = String(rawProfile.product_code || "proof_pack") as PremiumProductCode;
    if (!['proof_pack', 'radar', 'growth_desk'].includes(productCode)) continue;
    const config = opportunityConfigForProduct(productCode);
    let countQuery = supabase
      .from("opportunity_assignments")
      .select("id", { count: "exact", head: true })
      .eq("search_profile_id", rawProfile.id)
      .in("assignment_status", ["assigned", "published", "delivered"]);
    const start = windowStart(config.deliveryFrequency);
    if (start) countQuery = countQuery.gte("assigned_at", start);
    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    const alreadyAllocated = count || 0;
    const remaining = Math.max(0, config.opportunityQuantity - alreadyAllocated);
    if (remaining === 0) {
      results.push({
        profileId: rawProfile.id,
        customerEmail: rawProfile.customer_email,
        productCode,
        status: "cadence_satisfied",
        allocatedInWindow: alreadyAllocated,
        target: config.opportunityQuantity,
      });
      continue;
    }

    const result = await fillCustomerShortages({
      trigger,
      profileId: String(rawProfile.id),
      quantity: remaining,
    });
    totalShortage += Number(result.customer_shortages || 0);
    totalAssigned += Number(result.records_added_to_inventory || 0);
    results.push({
      profileId: rawProfile.id,
      customerEmail: rawProfile.customer_email,
      productCode,
      status: "processed",
      allocatedInWindow: alreadyAllocated,
      requested: remaining,
      assigned: result.records_added_to_inventory,
      shortage: result.customer_shortages,
      runId: result.runId,
    });
  }

  return {
    ok: true,
    profilesExamined: profiles?.length || 0,
    totalAssigned,
    totalShortage,
    results,
  };
}
