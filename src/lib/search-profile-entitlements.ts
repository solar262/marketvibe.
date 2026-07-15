import { getSupabaseAdmin } from "@/lib/supabase";

function nowIso() {
  return new Date().toISOString();
}

export async function synchronizeSearchProfileEntitlements() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const [{ data: profiles, error: profileError }, { data: entitlements, error: entitlementError }] = await Promise.all([
    supabase.from("customer_search_profiles").select("id,customer_email,product_code,status").limit(500),
    supabase.from("premium_entitlements").select("customer_email,product_code,status,ends_at").limit(500),
  ]);
  if (profileError) throw profileError;
  if (entitlementError) throw entitlementError;

  const activeKeys = new Set(
    (entitlements || [])
      .filter((row) => row.status === "active" && (!row.ends_at || Date.parse(String(row.ends_at)) > Date.now()))
      .map((row) => `${String(row.customer_email || "").trim().toLowerCase()}:${String(row.product_code || "")}`),
  );

  let paused = 0;
  let reactivated = 0;
  for (const profile of profiles || []) {
    const key = `${String(profile.customer_email || "").trim().toLowerCase()}:${String(profile.product_code || "")}`;
    const shouldBeActive = activeKeys.has(key);
    const currentStatus = String(profile.status || "active");
    const nextStatus = shouldBeActive ? "active" : "paused";
    if (currentStatus === nextStatus) continue;

    const { error } = await supabase
      .from("customer_search_profiles")
      .update({ status: nextStatus, updated_at: nowIso() })
      .eq("id", profile.id);
    if (error) throw error;
    if (nextStatus === "paused") paused += 1;
    else reactivated += 1;
  }

  return { ok: true, examined: profiles?.length || 0, paused, reactivated };
}
