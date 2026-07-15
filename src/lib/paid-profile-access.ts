import { normalizeEmail } from "@/lib/opportunity-quality";
import type { PremiumProductCode } from "@/lib/premium-products";
import { getSupabaseAdmin } from "@/lib/supabase";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type PaidProfile = {
  customer_email: string;
  product_code: PremiumProductCode | string;
};

type EntitlementRow = {
  customer_email?: unknown;
  product_code?: unknown;
  status?: unknown;
  ends_at?: unknown;
};

export function paidAccessKey(email: unknown, productCode: unknown) {
  return `${normalizeEmail(email)}:${String(productCode || "")}`;
}

export function entitlementIsCurrentlyActive(row: EntitlementRow, now = new Date()) {
  if (String(row.status || "") !== "active") return false;
  if (!row.ends_at) return true;
  const end = Date.parse(String(row.ends_at));
  return Number.isFinite(end) && end > now.getTime();
}

export async function filterProfilesWithActiveEntitlements<T extends PaidProfile>(
  supabase: SupabaseClient,
  profiles: T[],
) {
  if (profiles.length === 0) return [];
  const emails = Array.from(new Set(profiles.map((profile) => normalizeEmail(profile.customer_email)).filter(Boolean)));
  if (emails.length === 0) return [];

  const { data, error } = await supabase
    .from("premium_entitlements")
    .select("customer_email,product_code,status,ends_at")
    .in("customer_email", emails)
    .eq("status", "active");
  if (error) throw error;

  const active = new Set(
    (data || [])
      .filter((row) => entitlementIsCurrentlyActive(row as EntitlementRow))
      .map((row) => paidAccessKey(row.customer_email, row.product_code)),
  );

  return profiles.filter((profile) => active.has(paidAccessKey(profile.customer_email, profile.product_code)));
}

export async function profileHasActiveEntitlement(supabase: SupabaseClient, profile: PaidProfile) {
  const matches = await filterProfilesWithActiveEntitlements(supabase, [profile]);
  return matches.length === 1;
}

export async function syncSearchProfilesForSubscription(stripeSubscriptionId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !stripeSubscriptionId) return { updatedProfiles: 0, skipped: true };

  const { data, error } = await supabase
    .from("premium_entitlements")
    .select("customer_email,product_code,status,ends_at")
    .eq("stripe_subscription_id", stripeSubscriptionId);
  if (error) throw error;

  let updatedProfiles = 0;
  for (const row of data || []) {
    const active = entitlementIsCurrentlyActive(row as EntitlementRow);
    const { error: updateError, count } = await supabase
      .from("customer_search_profiles")
      .update({
        status: active ? "active" : "paused",
        updated_at: new Date().toISOString(),
      }, { count: "exact" })
      .eq("customer_email", normalizeEmail(row.customer_email))
      .eq("product_code", String(row.product_code || ""));
    if (updateError) throw updateError;
    updatedProfiles += count || 0;
  }

  return { updatedProfiles, skipped: false };
}
