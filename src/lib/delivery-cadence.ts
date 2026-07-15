import { sendTransactionalEmail } from "@/lib/brevo";
import { fillCustomerShortages } from "@/lib/opportunity-engine";
import { opportunityConfigForProduct } from "@/lib/opportunity-products";
import type { PremiumProductCode } from "@/lib/premium-products";
import { synchronizeSearchProfileEntitlements } from "@/lib/search-profile-entitlements";
import { getSupabaseAdmin } from "@/lib/supabase";

function windowStart(frequency: "once" | "daily" | "weekly" | "monthly") {
  if (frequency === "once") return null;
  const days = frequency === "daily" ? 1 : frequency === "weekly" ? 7 : 30;
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

async function restoreNonExclusiveInventory(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  profileId: string,
) {
  const { data: assignments, error } = await supabase
    .from("opportunity_assignments")
    .select("opportunity_id")
    .eq("search_profile_id", profileId)
    .in("assignment_status", ["assigned", "published", "delivered"]);
  if (error) throw error;
  const ids = Array.from(new Set((assignments || []).map((row) => String(row.opportunity_id)).filter(Boolean)));
  if (ids.length === 0) return 0;
  const { error: updateError } = await supabase
    .from("opportunities")
    .update({ inventory_status: "IN_INVENTORY", assignment_status: null, delivery_status: null, customer_email: null, product_code: null, updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("is_test_data", false);
  if (updateError) throw updateError;
  return ids.length;
}

async function recordAndAlertShortages(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  shortages: Array<Record<string, unknown>>,
) {
  if (shortages.length === 0) return { recorded: 0, alerted: false };

  for (const shortage of shortages) {
    await supabase.from("opportunity_source_errors").insert({
      source_name: "Customer supply shortage",
      source_type: "inventory_shortage",
      source_url: null,
      error_message: `Profile ${String(shortage.profileId)} is short ${String(shortage.shortage)} verified opportunities for ${String(shortage.productCode)}.`,
    });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!adminEmail) return { recorded: shortages.length, alerted: false };
  const lines = shortages.map((item) => `- ${String(item.customerEmail)} · ${String(item.productCode)} · missing ${String(item.shortage)}`).join("\n");
  await sendTransactionalEmail({
    to: adminEmail,
    subject: `MarketVibe supply shortage (${shortages.length} customer profile${shortages.length === 1 ? "" : "s"})`,
    htmlContent: `<p>MarketVibe could not fill every due customer delivery.</p><pre>${lines.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre><p>The next discovery run will retry automatically.</p>`,
    textContent: `MarketVibe could not fill every due customer delivery.\n\n${lines}\n\nThe next discovery run will retry automatically.`,
  });
  return { recorded: shortages.length, alerted: true };
}

export async function fillDueCustomerShortages({ trigger = "cron" }: { trigger?: "admin" | "cron" | "test" } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const entitlementSync = await synchronizeSearchProfileEntitlements();
  const { data: profiles, error } = await supabase
    .from("customer_search_profiles")
    .select("id,customer_email,product_code,status,exclusivity_mode")
    .eq("status", "active")
    .limit(100);
  if (error) throw error;

  const results: Array<Record<string, unknown>> = [];
  const shortages: Array<Record<string, unknown>> = [];
  let totalShortage = 0;
  let totalAssigned = 0;
  let reusableRestored = 0;

  for (const rawProfile of profiles || []) {
    const productCode = String(rawProfile.product_code || "proof_pack") as PremiumProductCode;
    if (!["proof_pack", "radar", "growth_desk"].includes(productCode)) continue;
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
      results.push({ profileId: rawProfile.id, customerEmail: rawProfile.customer_email, productCode, status: "cadence_satisfied", allocatedInWindow: alreadyAllocated, target: config.opportunityQuantity });
      continue;
    }

    const result = await fillCustomerShortages({ trigger, profileId: String(rawProfile.id), quantity: remaining });
    const shortage = Number(result.customer_shortages || 0);
    const assigned = Number(result.records_added_to_inventory || 0);
    totalShortage += shortage;
    totalAssigned += assigned;

    if (String(rawProfile.exclusivity_mode || config.exclusivityMode) === "non_exclusive" && assigned > 0) {
      reusableRestored += await restoreNonExclusiveInventory(supabase, String(rawProfile.id));
    }

    const row = { profileId: rawProfile.id, customerEmail: rawProfile.customer_email, productCode, status: shortage > 0 ? "shortage" : "processed", allocatedInWindow: alreadyAllocated, requested: remaining, assigned, shortage, runId: result.runId };
    results.push(row);
    if (shortage > 0) shortages.push(row);
  }

  const shortageAlert = await recordAndAlertShortages(supabase, shortages);
  return {
    ok: totalShortage === 0,
    entitlementSync,
    profilesExamined: profiles?.length || 0,
    totalAssigned,
    totalShortage,
    reusableRestored,
    shortageAlert,
    results,
  };
}
