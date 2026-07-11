import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSupabaseAdmin, supabaseConnectionStatus } from "@/lib/supabase";
import { ExceptionActions } from "@/components/ExceptionActions";

type ExceptionRow = {
  id: string;
  category: string;
  title: string;
  explanation: string;
  affected_record_type?: string | null;
  affected_record_id?: string | null;
  recommended_action: string;
  commercial_impact?: string | null;
  severity: string;
  status: string;
  created_at: string;
};

export default async function ExceptionsInboxPage() {
  const supabase = getSupabaseAdmin();
  const status = supabaseConnectionStatus();
  let exceptions: ExceptionRow[] = [];
  let loadError = "";

  if (supabase) {
    const { data, error } = await supabase
      .from("marketvibe_exceptions")
      .select("id,category,title,explanation,affected_record_type,affected_record_id,recommended_action,commercial_impact,severity,status,created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) loadError = error.message;
    exceptions = (data || []) as ExceptionRow[];
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-700">Owner review</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Exceptions Inbox</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Commercial decisions and automation blockers that should not be resolved silently.
          </p>
        </div>
        <Link href="/admin/operations" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Back to Operations</Link>
      </div>

      {!status.serverWritesEnabled && (
        <section className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-950">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          Supabase server writes are not configured, so exceptions cannot persist.
        </section>
      )}
      {loadError && (
        <section className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-950">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {loadError}
        </section>
      )}

      <section className="mt-6 grid gap-4">
        {exceptions.length === 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-950">
            <CheckCircle2 className="mb-3 h-5 w-5" />
            No open exceptions require owner attention.
          </div>
        ) : (
          exceptions.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{item.category.replaceAll("_", " ")} · {item.severity}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{item.title}</h2>
                </div>
                <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.explanation}</p>
              <p className="mt-3 text-sm font-semibold text-slate-950">Recommended action: {item.recommended_action}</p>
              {item.commercial_impact && <p className="mt-2 text-sm text-slate-600">Commercial impact: {item.commercial_impact}</p>}
              <p className="mt-2 text-xs text-slate-500">
                Affected record: {[item.affected_record_type, item.affected_record_id].filter(Boolean).join(" / ") || "Not attached"}
              </p>
              <ExceptionActions id={item.id} />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
