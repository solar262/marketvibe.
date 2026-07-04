import { AlertTriangle, Bot, Database, Route } from "lucide-react";
import { RunTestHuntButton } from "./RunTestHuntButton";
import { autopilotStatus } from "@/lib/autopilot";
import { getPersistenceStats } from "@/lib/lead-persistence";

export default async function AdminAutopilotPage() {
  const status = autopilotStatus();
  const persistence = await getPersistenceStats();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Autopilot</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Run scheduled lead hunts, save ranked opportunities to Supabase, and keep outreach manual until sending controls are ready.</p>
        </div>
        <RunTestHuntButton />
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Bot className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Autopilot status</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{status.enabled ? "Ready" : "Off"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Route className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Markets in rotation</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{status.marketsInRotation.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Database className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Saved leads</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{persistence.savedLeadsCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Database className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Saved audits</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{persistence.savedAuditsCount}</p>
        </div>
      </section>

      {!persistence.connected && (
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Supabase is not saving lead hunts.</p>
              <p className="mt-1">{persistence.error || "Check Supabase URL, anon key, service role key, and migrations."}</p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Cron endpoint</h2>
        <p className="mt-2 rounded-md bg-slate-50 p-3 font-mono text-sm text-slate-700">{status.cronEndpoint}</p>
        <p className="mt-2 text-sm text-slate-600">Vercel cron is configured to call `/api/cron/lead-hunt?markets=2&leads=3` daily at 07:00 UTC.</p>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Markets currently in rotation</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {status.marketsInRotation.map((market) => (
            <div key={`${market.country}-${market.city}-${market.businessType}`} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{market.city}, {market.country}</p>
              <p className="mt-1 text-sm text-slate-600">{market.businessType} · {market.serviceCategory}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Outreach status</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Automatic cold email sending is not enabled. MarketVibe generates outreach copy for buyers to review and send manually.</p>
      </section>
    </main>
  );
}

