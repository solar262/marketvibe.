import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Database, MailWarning, PauseCircle, RadioTower, RefreshCw, Users } from "lucide-react";
import { getOpportunityEngineSummary } from "@/lib/opportunity-engine";
import { OpportunityEngineControls } from "@/components/OpportunityEngineControls";

function count(value: number | null | undefined) {
  return typeof value === "number" ? String(value) : "Check setup";
}

export default async function OpportunityEnginePage() {
  const summary = await getOpportunityEngineSummary().catch((error) => ({
    automationPaused: false,
    latestRun: null,
    nextScheduledRun: "Unavailable",
    sourcesEnabled: [],
    counts: {
      activeProfiles: 0,
      qualifiedInventory: 0,
      reserved: 0,
      delivered: 0,
      expired: 0,
      replacementsDue: 0,
      failedDeliveries: 0,
    },
    sourceErrors: [{ error_message: error instanceof Error ? error.message : "Supabase setup unavailable." }],
    setupReady: false,
    supabaseStatus: {
      hasUrl: false,
      hasAnonKey: false,
      hasServiceRoleKey: false,
      serverWritesEnabled: false,
      host: "unavailable",
      urlLooksValid: false,
      missingRequiredServerVariables: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      serviceRoleKeyEnvName: "SUPABASE_SERVICE_ROLE_KEY",
      requiredServerVariableNames: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    },
  }));

  const cards = [
    ["Active search profiles", count(summary.counts.activeProfiles), Users],
    ["Qualified inventory", count(summary.counts.qualifiedInventory), Database],
    ["Reserved or assigned", count(summary.counts.reserved), CheckCircle2],
    ["Delivered", count(summary.counts.delivered), RadioTower],
    ["Expired", count(summary.counts.expired), Clock],
    ["Replacements due", count(summary.counts.replacementsDue), RefreshCw],
    ["Email failures", count(summary.counts.failedDeliveries), MailWarning],
  ] as const;

  const warnings = [
    summary.counts.activeProfiles === 0 ? "No active customer search profiles exist yet." : "",
    summary.counts.qualifiedInventory === 0 ? "No deliverable inventory is currently available." : "",
    summary.counts.replacementsDue > 0 ? "Replacement requests need review." : "",
    summary.counts.failedDeliveries > 0 ? "One or more delivery emails failed." : "",
    summary.automationPaused ? "Automation is paused." : "",
    !summary.setupReady ? `Supabase server setup incomplete: ${summary.supabaseStatus.missingRequiredServerVariables.join(", ") || "unknown"}.` : "",
  ].filter(Boolean);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-700">MarketVibe automation</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Opportunity Engine</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Discover, verify, score, qualify, match, deliver, refresh, and replace source-backed opportunities.
          </p>
        </div>
        <Link href="/admin/inventory" className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          Open inventory
        </Link>
      </div>

      {warnings.length > 0 && (
        <section className="mt-6 grid gap-2">
          {warnings.map((warning) => (
            <div key={warning} className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {warning}
            </div>
          ))}
        </section>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-violet-700" />
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          {summary.automationPaused ? <PauseCircle className="h-5 w-5 text-amber-700" /> : <CheckCircle2 className="h-5 w-5 text-emerald-700" />}
          <h2 className="font-semibold text-slate-950">{summary.automationPaused ? "Automation paused" : summary.setupReady ? "Automation active" : "Setup incomplete"}</h2>
        </div>
        <div className="mt-4 grid gap-4 text-sm text-slate-600 md:grid-cols-3">
          <p><span className="font-semibold text-slate-950">Latest run:</span> {summary.latestRun?.started_at || "No run recorded"}</p>
          <p><span className="font-semibold text-slate-950">Next scheduled run:</span> {summary.nextScheduledRun}</p>
          <p><span className="font-semibold text-slate-950">Sources enabled:</span> {summary.sourcesEnabled.length ? summary.sourcesEnabled.join(", ") : "None configured"}</p>
          <p><span className="font-semibold text-slate-950">Supabase URL:</span> {summary.supabaseStatus.hasUrl ? `Present (${summary.supabaseStatus.host})` : "Missing"}</p>
          <p><span className="font-semibold text-slate-950">Service key env:</span> {summary.supabaseStatus.hasServiceRoleKey ? `Present (${summary.supabaseStatus.serviceRoleKeyEnvName})` : `Missing (${summary.supabaseStatus.serviceRoleKeyEnvName})`}</p>
          <p><span className="font-semibold text-slate-950">Server writes:</span> {summary.supabaseStatus.serverWritesEnabled ? "Enabled" : "Disabled"}</p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Controls</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          These actions create run-history rows and do not publish records until qualification and matching rules pass.
        </p>
        <div className="mt-5">
          <OpportunityEngineControls />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Recent source failures</h2>
        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          {summary.sourceErrors.length === 0 ? (
            <p>No recent source failures recorded.</p>
          ) : (
            summary.sourceErrors.map((error: { id?: string; source_name?: string; error_message?: string; created_at?: string }, index: number) => (
              <p key={error.id || index} className="rounded-md bg-slate-50 p-3">
                <span className="font-semibold text-slate-950">{error.source_name || "Source"}</span>: {error.error_message || "Unknown failure"} {error.created_at ? `(${error.created_at})` : ""}
              </p>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
