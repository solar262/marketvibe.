import Link from "next/link";
import { AlertTriangle, CreditCard, FileUp, Inbox, Settings, ShieldCheck } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";

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
  ]);

  const cards = [
    ["New orders", displayCount(newOrders), CreditCard, "/admin/orders"],
    ["Active access", displayCount(activeSubscriptions), ShieldCheck, "/admin/orders"],
    ["Failed payments", displayCount(failedPayments), AlertTriangle, "/admin/orders"],
    ["Incomplete onboarding", displayCount(incompleteOnboarding), Inbox, "/admin/fulfillment"],
    ["Pending proof-pack rows", displayCount(pendingProofPacks), Inbox, "/admin/fulfillment"],
    ["Support requests", displayCount(supportRequests), Inbox, "/admin/orders"],
    ["Data requests", displayCount(dataRequests), Inbox, "/admin/orders"],
    ["Recent imports", displayCount(recentImports), FileUp, "/admin/import"],
    ["Failed email deliveries", displayCount(failedDeliveries), AlertTriangle, "/admin/email"],
  ] as const;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-semibold text-slate-950">Daily Operations</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        One-person operating view for orders, access, onboarding, delivery, support, imports, and email failures. Counts show “Check setup” when Supabase credentials or migrations are unavailable.
      </p>
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
