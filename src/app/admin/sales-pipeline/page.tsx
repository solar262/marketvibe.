import Link from "next/link";
import { MailCheck, ShieldCheck, Users } from "lucide-react";
import { SalesPipelineAdmin } from "@/components/SalesPipelineAdmin";
import { customerJourneys, getSalesPipelineOverview, listSalesLeads, salesPipelineStages } from "@/lib/sales-pipeline";

export const dynamic = "force-dynamic";

export default async function AdminSalesPipelinePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const rawFilters = await searchParams;
  const filters = {
    q: rawFilters.q || "",
    stage: rawFilters.stage || "",
    fit: rawFilters.fit || "",
    journey: rawFilters.journey || "",
  };
  const [overview, list] = await Promise.all([
    getSalesPipelineOverview(),
    listSalesLeads({ ...filters, limit: 100 }),
  ]);
  const summaryCards = [
    { label: "Pipeline stages", value: salesPipelineStages.length, Icon: Users },
    { label: "Compliance regions", value: "US / UK / EU", Icon: ShieldCheck },
    { label: "Email sequences", value: "5 automated", Icon: MailCheck },
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Sales Pipeline</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Manage qualified MarketVibe buyers from first fit check through Proof Pack purchase, delivery, subscription opportunity, subscriber, or lost.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/qualify" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white">Open qualification form</Link>
          <Link href="/api/cron/sales-pipeline" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Run email cron</Link>
        </div>
      </div>

      {list.error && (
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {list.error}
        </section>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {summaryCards.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-emerald-700" />
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <SalesPipelineAdmin
        initialLeads={list.leads}
        overview={overview}
        filters={filters}
        stages={[...salesPipelineStages]}
        journeys={[...customerJourneys]}
      />
    </main>
  );
}
