import { sendTransactionalEmail } from "@/lib/brevo";
import { fillCustomerShortages } from "@/lib/opportunity-engine";
import { normalizeEmail, type CustomerSearchProfile } from "@/lib/opportunity-quality";
import type { PremiumProductCode } from "@/lib/premium-products";
import { getSupabaseAdmin } from "@/lib/supabase";

type DiscoveryTrigger = "admin" | "cron" | "test";
type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type AssignmentState = {
  assignment_status?: string | null;
  delivered_at?: string | null;
  assigned_at?: string | null;
  created_at?: string | null;
};

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

function deliveryWindowMs(frequency: CustomerSearchProfile["delivery_frequency"]) {
  if (frequency === "daily") return 24 * 3_600_000;
  if (frequency === "monthly") return 30 * 24 * 3_600_000;
  return 7 * 24 * 3_600_000;
}

export function remainingOpportunityQuantity(
  profile: Pick<CustomerSearchProfile, "delivery_frequency" | "opportunity_quantity">,
  assignments: AssignmentState[],
  now = new Date(),
) {
  const activeStatuses = new Set(["assigned", "published", "delivered"]);
  const relevant = assignments.filter((assignment) => activeStatuses.has(String(assignment.assignment_status || "")));
  const counted = profile.delivery_frequency === "once"
    ? relevant.length
    : relevant.filter((assignment) => {
        const timestamp = assignment.delivered_at || assignment.assigned_at || assignment.created_at;
        if (!timestamp) return false;
        const parsed = Date.parse(timestamp);
        return Number.isFinite(parsed) && parsed >= now.getTime() - deliveryWindowMs(profile.delivery_frequency);
      }).length;
  return Math.max(0, profile.opportunity_quantity - counted);
}

async function loadProfiles(supabase: SupabaseClient, profileId?: string) {
  let query = supabase
    .from("customer_search_profiles")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(50);
  if (profileId) query = query.eq("id", profileId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => profileFromRow(row as Record<string, unknown>));
}

async function profileAssignments(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from("opportunity_assignments")
    .select("assignment_status,delivered_at,assigned_at,created_at")
    .eq("search_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data || []) as AssignmentState[];
}

async function sendShortageAlert(shortages: Array<{ profile: CustomerSearchProfile; shortage: number }>) {
  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!adminEmail || shortages.length === 0) return { attempted: false, sent: false };
  const lines = shortages.map(({ profile, shortage }) =>
    `- ${profile.customer_email} · ${profile.product_code} · ${profile.niche}: ${shortage} opportunities still required`,
  );
  await sendTransactionalEmail({
    to: adminEmail,
    subject: `MarketVibe supply shortage: ${shortages.length} customer profile${shortages.length === 1 ? "" : "s"}`,
    htmlContent: `<p>The autonomous matching run could not fully satisfy these active customer profiles:</p><p>${lines.map((line) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join("<br>")}</p><p>Discovery will broaden and retry on the next scheduled run. No unverified records were delivered.</p>`,
    textContent: `The autonomous matching run could not fully satisfy these active customer profiles:\n\n${lines.join("\n")}\n\nDiscovery will broaden and retry on the next scheduled run. No unverified records were delivered.`,
  });
  return { attempted: true, sent: true };
}

export async function runDueBuyerIntentMatching({
  trigger = "admin",
  profileId,
  sendAlert = false,
}: {
  trigger?: DiscoveryTrigger;
  profileId?: string;
  sendAlert?: boolean;
} = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const profiles = await loadProfiles(supabase, profileId);
  const shortages: Array<{ profile: CustomerSearchProfile; shortage: number }> = [];
  const failures: Array<{ profileId: string; error: string }> = [];
  let profilesDue = 0;
  let profilesNotDue = 0;
  let assigned = 0;

  for (const profile of profiles) {
    if (!profile.id) continue;
    try {
      const assignments = await profileAssignments(supabase, profile.id);
      const remaining = remainingOpportunityQuantity(profile, assignments);
      if (remaining === 0) {
        profilesNotDue += 1;
        continue;
      }
      profilesDue += 1;
      const result = await fillCustomerShortages({ trigger, profileId: profile.id, quantity: remaining });
      assigned += Number(result.records_added_to_inventory || 0);
      const shortage = Number(result.customer_shortages || 0);
      if (shortage > 0) shortages.push({ profile, shortage });
    } catch (error) {
      failures.push({ profileId: profile.id, error: error instanceof Error ? error.message : "Matching failed." });
    }
  }

  let alert: { attempted: boolean; sent: boolean; error?: string } = { attempted: false, sent: false };
  if (sendAlert && shortages.length > 0) {
    try {
      alert = await sendShortageAlert(shortages);
    } catch (error) {
      alert = { attempted: true, sent: false, error: error instanceof Error ? error.message : "Shortage alert failed." };
    }
  }

  return {
    ok: failures.length === 0,
    profiles_examined: profiles.length,
    profiles_due: profilesDue,
    profiles_not_due: profilesNotDue,
    records_assigned: assigned,
    customer_shortages: shortages.reduce((sum, item) => sum + item.shortage, 0),
    shortage_profiles: shortages.map(({ profile, shortage }) => ({
      profile_id: profile.id,
      customer_email: profile.customer_email,
      product_code: profile.product_code,
      niche: profile.niche,
      shortage,
    })),
    failures,
    alert,
  };
}
