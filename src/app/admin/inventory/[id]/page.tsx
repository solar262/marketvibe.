import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getOpportunityDetail } from "@/lib/opportunity-engine";

function jsonBlock(value: unknown) {
  return JSON.stringify(value || {}, null, 2);
}

export default async function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getOpportunityDetail(id);
  const item = detail.opportunity as Record<string, unknown> | null;

  if (!item) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Opportunity not found.</p>
      </main>
    );
  }

  const scoreReasons = item.score_reasons && typeof item.score_reasons === "object" ? item.score_reasons : {};

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><ArrowLeft className="h-4 w-4" /> Back to inventory</Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-violet-700">{String(item.inventory_status || "")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{String(item.company_name || "")}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{String(item.company_description || item.customer_summary || "")}</p>
          <div className="mt-5 grid gap-2 text-sm text-slate-700">
            <p><span className="font-semibold">Website:</span> {item.company_website ? <Link href={String(item.company_website)} className="text-violet-700">{String(item.company_website)} <ExternalLink className="inline h-3 w-3" /></Link> : "Unavailable"}</p>
            <p><span className="font-semibold">Location:</span> {[item.company_location, item.company_country].filter(Boolean).join(", ") || "Unavailable"}</p>
            <p><span className="font-semibold">Contact:</span> {[item.contact_full_name, item.contact_job_title].filter(Boolean).join(" · ") || "No verified decision-maker supplied"}</p>
            <p><span className="font-semibold">Source:</span> <Link href={String(item.source_url)} className="text-violet-700">{String(item.source_title || item.source_url)} <ExternalLink className="inline h-3 w-3" /></Link></p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Scores</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {["fit_score", "intent_score", "evidence_score", "freshness_score", "overall_score"].map((key) => (
              <div key={key} className="rounded-md bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{key.replace("_", " ")}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{String(item[key] || 0)}</p>
              </div>
            ))}
          </div>
          <pre className="mt-4 max-h-64 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{jsonBlock(scoreReasons)}</pre>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Evidence</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{String(item.source_text || "")}</p>
          <p className="mt-4 text-sm font-semibold text-slate-950">Recommended action</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{String(item.recommended_action || "")}</p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">History</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <p><span className="font-semibold">Verification events:</span> {detail.verification.length}</p>
            <p><span className="font-semibold">Assignments:</span> {detail.assignments.length}</p>
            <p><span className="font-semibold">Replacement requests:</span> {detail.replacements.length}</p>
            <p><span className="font-semibold">Exclusivity key:</span> {String(item.exclusivity_key || "None")}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

