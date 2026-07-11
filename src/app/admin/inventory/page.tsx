import Link from "next/link";
import { Database, Filter } from "lucide-react";
import { getInventoryStats, listInventory } from "@/lib/opportunity-engine";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const rawFilters = await searchParams;
  const filters = Object.fromEntries(Object.entries(rawFilters).filter(([, value]) => typeof value === "string")) as Record<string, string>;
  const [items, stats] = await Promise.all([
    listInventory(filters).catch(() => []),
    getInventoryStats().catch(() => ({} as Record<string, number>)),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold text-violet-700">Qualified stock</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">Inventory</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Source-backed opportunities only. Rejected test data and profile-only rows are excluded from matching.
        </p>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-5">
        {Object.entries(stats).map(([status, value]) => (
          <div key={status} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Database className="h-4 w-4 text-violet-700" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{status.replaceAll("_", " ")}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <form className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <input name="company" placeholder="Company" defaultValue={filters.company || ""} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
        <input name="niche" placeholder="Niche" defaultValue={filters.niche || ""} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
        <input name="country" placeholder="Country" defaultValue={filters.country || ""} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
        <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Apply</button>
      </form>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Company</span>
          <span>Status</span>
          <span>Scores</span>
          <span>Evidence</span>
          <span>Freshness</span>
        </div>
        {items.length === 0 ? (
          <p className="p-5 text-sm text-slate-600">No inventory records match these filters.</p>
        ) : (
          items.map((item: Record<string, unknown>) => (
            <Link key={String(item.id)} href={`/admin/inventory/${item.id}`} className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-3 border-b border-slate-100 px-4 py-4 text-sm hover:bg-slate-50">
              <span>
                <span className="font-semibold text-slate-950">{String(item.company_name || "")}</span>
                <span className="mt-1 block text-xs text-slate-500">{String(item.company_domain || item.company_website || "")}</span>
              </span>
              <span>{String(item.inventory_status || "")}</span>
              <span>O {String(item.overall_score || 0)} · I {String(item.intent_score || 0)}</span>
              <span>{String(item.evidence_status || "")}</span>
              <span>{String(item.last_verified_at || item.captured_at || "").slice(0, 10)}</span>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
