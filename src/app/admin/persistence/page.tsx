import { Database, SearchCheck, Server, ShieldAlert } from "lucide-react";
import { getPersistenceStats } from "@/lib/lead-persistence";

export default async function AdminPersistencePage() {
  const stats = await getPersistenceStats();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Persistence Test</h1>
          <p className="mt-2 text-slate-600">Check whether Supabase is connected and whether live searches are being saved.</p>
        </div>
        <span className={`rounded-md px-3 py-1 text-xs font-semibold ${stats.connected ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
          {stats.connected ? "Supabase connected" : "Supabase not connected"}
        </span>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Database className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Saved leads</p>
          <p className="mt-1 text-3xl font-semibold text-slate-950">{stats.savedLeadsCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SearchCheck className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Saved audits</p>
          <p className="mt-1 text-3xl font-semibold text-slate-950">{stats.savedAuditsCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Server className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Server writes</p>
          <p className="mt-1 text-3xl font-semibold text-slate-950">{stats.status.serverWritesEnabled ? "On" : "Off"}</p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Connection details</h2>
        <div className="mt-3 grid gap-2 text-slate-700 sm:grid-cols-2">
          <p>Supabase host: <span className="font-mono">{stats.status.host}</span></p>
          <p>URL format: <span className="font-semibold">{stats.status.urlLooksValid ? "Valid" : "Invalid"}</span></p>
          <p>Public URL env: <span className="font-semibold">{stats.status.hasUrl ? "Present" : "Missing"}</span></p>
          <p>Anon key env: <span className="font-semibold">{stats.status.hasAnonKey ? "Present" : "Missing"}</span></p>
          <p>Service role env: <span className="font-semibold">{stats.status.hasServiceRoleKey ? "Present" : "Missing"}</span></p>
        </div>
      </section>

      {stats.error && (
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Supabase persistence is not ready.</p>
              <p className="mt-1">{stats.error}</p>
              <p className="mt-1">The app needs the MarketVibe Supabase URL, anon key, and service role key from the same Supabase project.</p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Latest searches</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Business</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Results</th>
              </tr>
            </thead>
            <tbody>
              {stats.latestSearches.map((search: Record<string, unknown>) => (
                <tr key={String(search.id)} className="border-t border-slate-100">
                  <td className="py-3 pr-4">{new Date(String(search.created_at)).toLocaleString()}</td>
                  <td className="py-3 pr-4">{String(search.city)}, {String(search.country)}</td>
                  <td className="py-3 pr-4">{String(search.business_type)}</td>
                  <td className="py-3 pr-4">{String(search.service_category)}</td>
                  <td className="py-3 pr-4">{String(search.source_status).toUpperCase()}</td>
                  <td className="py-3 pr-4">{String(search.result_count)}</td>
                </tr>
              ))}
              {stats.latestSearches.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-slate-500">No saved searches yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
