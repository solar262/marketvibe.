import Link from "next/link";
import { Archive, Database, Radar, ShieldCheck } from "lucide-react";
import { getPersistenceStats } from "@/lib/lead-persistence";

export default async function AdminAutopilotArchivePage() {
  const persistence = await getPersistenceStats();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold text-amber-700">Historical internal tooling</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Legacy lead and audit archive</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          This page records output from the retired local-business lead and website-audit model. It is not scheduled, it cannot publish to customers, and it is not part of Proof Pack, Radar, or Growth Desk fulfillment.
        </p>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <Archive className="h-5 w-5 text-amber-700" />
          <p className="mt-4 text-sm text-amber-800">Archive status</p>
          <p className="mt-1 text-2xl font-semibold text-amber-950">Retired</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Database className="h-5 w-5 text-slate-700" />
          <p className="mt-4 text-sm text-slate-500">Historical leads</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{persistence.savedLeadsCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Database className="h-5 w-5 text-slate-700" />
          <p className="mt-4 text-sm text-slate-500">Historical audits</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{persistence.savedAuditsCount}</p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-semibold">Current customer-delivery boundary</h2>
            <p className="mt-1 text-sm leading-6">Only qualified records in Opportunity Inventory can be matched to a paid search profile and delivered to a customer.</p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/opportunity-engine" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          <Radar className="h-4 w-4" /> Open Opportunity Engine
        </Link>
        <Link href="/admin/inventory" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950">
          <Database className="h-4 w-4" /> Open qualified inventory
        </Link>
      </div>
    </main>
  );
}
