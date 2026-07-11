import Link from "next/link";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, FileText, HeartHandshake, Inbox, MailCheck, RadioTower, TrendingUp, Users } from "lucide-react";
import { getSupabaseAdmin, supabaseConnectionStatus } from "@/lib/supabase";

type CountFilter =
  | { kind: "eq"; column: string; value: string | number | boolean }
  | { kind: "in"; column: string; values: string[] }
  | { kind: "gte"; column: string; value: number };

async function countRows(table: string, filters: CountFilter[] = []) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const filter of filters) {
    if (filter.kind === "eq") query = query.eq(filter.column, filter.value);
    if (filter.kind === "in") query = query.in(filter.column, filter.values);
    if (filter.kind === "gte") query = query.gte(filter.column, filter.value);
  }
  const { count, error } = await query;
  if (error) return null;
  return count || 0;
}

function metric(value: number | null) {
  return value === null ? "Setup needed" : String(value);
}

export default async function MarketVibeOperationsPage() {
  const supabaseStatus = supabaseConnectionStatus();
  const [
    qualifiedBuyers,
    qualifiedOpportunities,
    highScoreMatches,
    proofPacksReady,
    proofPacksDelivered,
    outreachSent,
    interestedReplies,
    meetingsRequested,
    activeCustomers,
    exceptions,
    providerBlocked,
    providerDegraded,
  ] = await Promise.all([
    countRows("marketvibe_buyer_companies", [{ kind: "in", column: "buyer_status", values: ["qualified", "active"] }]),
    countRows("opportunities", [{ kind: "eq", column: "inventory_status", value: "IN_INVENTORY" }, { kind: "eq", column: "is_test_data", value: false }]),
    countRows("marketvibe_matches", [{ kind: "gte", column: "total_match_score", value: 70 }]),
    countRows("marketvibe_proof_packs", [{ kind: "eq", column: "status", value: "ready" }]),
    countRows("marketvibe_proof_packs", [{ kind: "eq", column: "status", value: "delivered" }]),
    countRows("marketvibe_outreach_drafts", [{ kind: "in", column: "outreach_status", values: ["sent", "delivered", "replied", "interested", "meeting_requested", "closed"] }]),
    countRows("marketvibe_outreach_drafts", [{ kind: "eq", column: "outreach_status", value: "interested" }]),
    countRows("marketvibe_outreach_drafts", [{ kind: "eq", column: "outreach_status", value: "meeting_requested" }]),
    countRows("marketvibe_customer_profiles", [{ kind: "eq", column: "active", value: true }]),
    countRows("marketvibe_exceptions", [{ kind: "eq", column: "status", value: "open" }]),
    countRows("marketvibe_provider_configurations", [{ kind: "eq", column: "health_status", value: "Blocked" }]),
    countRows("marketvibe_provider_configurations", [{ kind: "eq", column: "health_status", value: "Degraded" }]),
  ]);

  const health = !supabaseStatus.serverWritesEnabled
    ? "Blocked"
    : providerBlocked && providerBlocked > 0
      ? "Blocked"
      : providerDegraded && providerDegraded > 0
        ? "Degraded"
        : "Operational";
  const healthCopy = health === "Operational"
    ? "Automation health is operational for configured modules."
    : health === "Degraded"
      ? "Some providers need attention, but healthy modules can continue."
      : "Core persistence or required providers need setup before full automation can run.";

  const cards = [
    ["Qualified buyers", metric(qualifiedBuyers), Users],
    ["Qualified opportunities", metric(qualifiedOpportunities), BriefcaseBusiness],
    ["High-score matches", metric(highScoreMatches), HeartHandshake],
    ["Proof packs ready", metric(proofPacksReady), FileText],
    ["Proof packs delivered", metric(proofPacksDelivered), CheckCircle2],
    ["Outreach sent", metric(outreachSent), MailCheck],
    ["Interested replies", metric(interestedReplies), Inbox],
    ["Meetings requested", metric(meetingsRequested), RadioTower],
    ["Active customers", metric(activeCustomers), Users],
    ["Open exceptions", metric(exceptions), AlertTriangle],
    ["Pipeline value", highScoreMatches === null ? "Setup needed" : `Tracked on ${highScoreMatches} matches`, TrendingUp],
    ["Automation health", health, CheckCircle2],
  ] as const;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Owner operations</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">MarketVibe Operations</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            One operating screen for buyer stock, opportunity inventory, matching, proof packs, outreach, replies, pipeline value, automation health, and exceptions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/import" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Import file</Link>
          <Link href="/admin/exceptions" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-950">Exceptions Inbox</Link>
          <Link href="/admin/setup" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-950">Setup</Link>
        </div>
      </div>

      <section className={`mt-6 rounded-lg border p-4 text-sm font-semibold ${health === "Operational" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : health === "Degraded" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-red-200 bg-red-50 text-red-950"}`}>
        {healthCopy}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-emerald-700" />
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
