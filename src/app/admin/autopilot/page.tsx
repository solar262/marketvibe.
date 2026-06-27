import Link from "next/link";
import { PlayCircle, ShieldCheck, TimerReset } from "lucide-react";
import { autopilotMarkets } from "@/lib/autopilot";

export default function AutopilotAdminPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Autopilot</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Scheduled Lead Hunt</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This is the no-human-in-the-loop engine: it checks configured markets, scans websites, scores opportunities, and saves results when Supabase is connected.
          </p>
        </div>
        <a href="/api/cron/lead-hunt?markets=1&leads=2" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          <PlayCircle className="h-4 w-4" /> Test one run
        </a>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <TimerReset className="h-5 w-5 text-emerald-700" />
          <h2 className="mt-4 font-semibold text-slate-950">Schedule</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Daily at 06:00 UTC from Vercel Cron. The route can also be triggered by an external scheduler for more frequent runs.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <h2 className="mt-4 font-semibold text-slate-950">Safe by default</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">It does not send spam. It finds, scores, and stores opportunities. Email sending remains off until compliance is reviewed.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <PlayCircle className="h-5 w-5 text-emerald-700" />
          <h2 className="mt-4 font-semibold text-slate-950">Endpoint</h2>
          <code className="mt-2 block rounded-md bg-slate-50 p-3 text-xs text-slate-700">/api/cron/lead-hunt</code>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Markets in rotation</h2>
        <div className="mt-4 grid gap-3">
          {autopilotMarkets.map((market) => (
            <div key={market.label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950">{market.label}</h3>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">{market.serviceCategory}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{market.city}, {market.country} · {market.businessType}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{market.buyerAngle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">Important</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          For true saved history, Supabase must stay connected. If Supabase is unavailable, the engine still produces fallback preview packs but cannot keep permanent saved lead inventory.
        </p>
        <Link href="/admin/persistence" className="mt-4 inline-flex text-sm font-semibold text-amber-950 underline">Check persistence</Link>
      </section>
    </main>
  );
}
