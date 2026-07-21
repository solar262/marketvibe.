import Link from "next/link";
import { AlertTriangle, CreditCard, Database, FileUp, Inbox, Radar, RefreshCw, Settings, ShieldCheck } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getOpportunityEngineSummary } from "@/lib/opportunity-engine";

async function countRows(table: string, filters: Record<string, string> = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) return null;
  return count || 0;
}

function displayCount(value: number | null) {
  return value === null ? "Check setup" : String(value);
}

export default async function AdminDashboard() {
  const [
    newOrders,
    activeSubscriptions,
    failedPayments,
    incompleteOnboarding,
    pendingProofPacks,
    supportRequests,
    dataRequests,
    recentImports,
    failedDeliveries,
    opportunitySummary,
  ] = await Promise.all([
    countRows("premium_orders"),
    countRows("premium_entitlements", { status: "active" }),
    countRows("premium_entitlements", { status: "past_due" }),
    countRows("premium_onboarding", { status: "submitted" }),
    countRows("premium_pack_items"),
    countRows("premium_enquiries", { status: "new" }),
    countRows("premium_enquiries", { offer: "data-request" }),
    countRows("premium_import_batches"),
    countRows("premium_delivery_batches", { status: "email_failed" }),
    getOpportunityEngineSummary().catch(() => null),
  ]);

  const cards = [
    ["New orders", displayCount(newOrders), CreditCard, "/admin/orders"],
    ["Active access", displayCount(activeSubscriptions), ShieldCheck, "/admin/orders"],
    ["Search profiles", opportunitySummary ? displayCount(opportunitySummary.counts.activeProfiles) : "Check setup", Radar, "/admin/opportunity-engine"],
    ["Qualified inventory", opportunitySummary ? displayCount(opportunitySummary.counts.qualifiedInventory) : "Check setup", Database, "/admin/inventory"],
    ["Replacements due", opportunitySummary ? displayCount(opportunitySummary.counts.replacementsDue) : "Check setup", RefreshCw, "/admin/opportunity-engine"],
    ["Failed payments", displayCount(failedPayments), AlertTriangle, "/admin/orders"],
    ["Incomplete onboarding", displayCount(incompleteOnboarding), Inbox, "/admin/fulfillment"],
    ["Legacy pack rows (archive)", displayCount(pendingProofPacks), Inbox, "/admin/autopilot"],
    ["Support requests", displayCount(supportRequests), Inbox, "/admin/orders"],
    ["Data requests", displayCount(dataRequests), Inbox, "/admin/orders"],
    ["Recent imports", displayCount(recentImports), FileUp, "/admin/import"],
    ["Failed email deliveries", displayCount(failedDeliveries), AlertTriangle, "/admin/email"],
  ] as const;

  const warnings = [
    opportunitySummary && opportunitySummary.counts.activeProfiles === 0 ? "No active customer search profiles are configured." : "",
    opportunitySummary && opportunitySummary.counts.qualifiedInventory === 0 ? "No qualified opportunity inventory is available for delivery." : "",
    opportunitySummary && opportunitySummary.counts.replacementsDue > 0 ? "Replacement requests need review." : "",
    opportunitySummary && opportunitySummary.counts.failedDeliveries > 0 ? "Opportunity delivery email failures need attention." : "",
    opportunitySummary?.automationPaused ? "Opportunity automation is paused." : "",
  ].filter(Boolean);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-semibold text-slate-950">MarketVibe Control Centre</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Operating view for paid customers, search profiles, qualified inventory, deliveries, replacements, stale opportunities, automation health, imports, and email failures.
      </p>
      {warnings.length > 0 && (
        <div className="mt-6 grid gap-2">
          {warnings.map((warning) => (
            <div key={warning} className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {warning}
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, Icon, href]) => (
          <Link key={label} href={href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300">
            <Icon className="h-5 w-5 text-emerald-700" />
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          </Link>
        ))}
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Operator shortcuts</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use these links before manual customer work. Never grant paid access from URL parameters, never manually fabricate delivery rows, and never refund outside Stripe records.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin/opportunity-engine" className="inline-flex items-center gap-2 rounded-md bg-violet-700 px-4 py-2 text-sm font-semibold text-white">
            <Radar className="h-4 w-4" /> Opportunity Engine
          </Link>
          <Link href="/admin/inventory" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-950">
            <Database className="h-4 w-4" /> Inventory
          </Link>
          <Link href="/admin/import" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            <FileUp className="h-4 w-4" /> Import CSV
          </Link>
          <Link href="/admin/email" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-950">
            <Inbox className="h-4 w-4" /> Check email
          </Link>
        </div>
        <Link href="/admin/settings" className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          <Settings className="h-4 w-4" /> Open settings
        </Link>
      </section>
    </main>
  );
}
