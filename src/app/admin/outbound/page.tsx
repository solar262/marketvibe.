import Link from "next/link";
import { MailCheck, ShieldCheck, UploadCloud } from "lucide-react";
import { OutboundSalesAdmin } from "@/components/OutboundSalesAdmin";
import { getOutboundSalesOverview, listOutboundSalesLeads } from "@/lib/sales-pipeline";

export const dynamic = "force-dynamic";

export default async function AdminOutboundPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const rawFilters = await searchParams;
  const filters = {
    q: rawFilters.q || "",
    status: rawFilters.status || "",
  };
  const [overview, list] = await Promise.all([
    getOutboundSalesOverview(),
    listOutboundSalesLeads({ ...filters, limit: 100 }),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Automated sales</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">UK/US B2B Outbound</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Import buyer prospects, approve only compliant UK/US business contacts, and queue the MarketVibe cold outbound sequence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/api/admin/outbound/export" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white">Download CSV</Link>
          <Link href="/api/cron/sales-pipeline" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Run email cron</Link>
        </div>
      </div>

      {list.error && (
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {list.error}
        </section>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <UploadCloud className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Imported prospects</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{overview.imported ?? "Setup"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Approved UK/US rows</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{overview.approved ?? "Setup"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <MailCheck className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Queued outbound emails</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{overview.queued ?? "Setup"}</p>
        </div>
      </section>

      <OutboundSalesAdmin initialLeads={list.leads} overview={overview} filters={filters} />
    </main>
  );
}
