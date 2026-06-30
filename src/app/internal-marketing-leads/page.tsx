"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";

type InternalMarketingLead = {
  id: string;
  text: string;
  sourceName?: string;
  author?: string;
  dateText?: string;
  url?: string;
  queryUsed?: string;
  sourceUsed?: string;
  painPoint?: string;
  replyDraft?: string;
  outreachMode?: string;
  status?: string;
  outreachStatus?: string;
  fitRank: number;
  label: string;
  analysis: {
    action: string;
    score: string;
    risk: string;
    intent: string;
    reason: string;
    quickReply: string;
    deeperReply: string;
    manualNote: string;
  };
};

type InternalMarketingLeadResponse = {
  importedAt: string;
  storage: string;
  counts: { imported: number; scored: number; good: number; manualOnly: number; skipped: number };
  results: InternalMarketingLead[];
  skipped: InternalMarketingLead[];
};

type LeadHuntStatus = {
  active: boolean;
  paused: boolean;
  recoveryNeeded?: boolean;
  status: string;
  imported: number;
  skipped: number;
  failed: number;
  updatedAt: string;
};

export default function InternalMarketingLeadsPage() {
  const [data, setData] = useState<InternalMarketingLeadResponse | null>(null);
  const [huntStatus, setHuntStatus] = useState<LeadHuntStatus | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replyNotice, setReplyNotice] = useState("");

  async function load() {
    const [leadsResponse, statusResponse] = await Promise.all([
      fetch("/api/internal-marketing-leads", { cache: "no-store" }),
      fetch("/api/internal-marketing-leads/hunt-status", { cache: "no-store" }),
    ]);
    setData(await leadsResponse.json());
    if (statusResponse.ok) setHuntStatus(await statusResponse.json());
  }

  useEffect(() => {
    let ignore = false;

    void Promise.all([
      fetch("/api/internal-marketing-leads", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/internal-marketing-leads/hunt-status", { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
    ])
      .then(([nextData, nextStatus]: [InternalMarketingLeadResponse, LeadHuntStatus | null]) => {
        if (!ignore) {
          setData(nextData);
          if (nextStatus) setHuntStatus(nextStatus);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/internal-marketing-leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, outreachStatus: status }),
    });
    await load();
  }

  function openReplyLink(url?: string) {
    if (!url) {
      setReplyNotice("No reply link available");
      window.setTimeout(() => setReplyNotice(""), 1800);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const cards = [...(data?.results || []), ...(showSkipped ? data?.skipped || [] : [])];

  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-8 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Internal Marketing Leads</p>
          <h1 className="mt-3 text-4xl font-semibold">Lead Hunt Imports</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Private founder-growth leads imported by Lead Hunt Autopilot. This data is separate from customer lead tables and customer-facing pages.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Imported</p><p className="text-2xl font-bold">{data?.counts.imported || 0}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Good</p><p className="text-2xl font-bold text-emerald-300">{data?.counts.good || 0}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Manual</p><p className="text-2xl font-bold text-cyan-200">{data?.counts.manualOnly || 0}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Skipped</p><p className="text-2xl font-bold text-amber-200">{data?.counts.skipped || 0}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Store</p><p className="text-sm font-bold text-white">{data?.storage || "memory"}</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={load} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-slate-950"><RefreshCw className="h-4 w-4" /> Refresh</button>
            <button onClick={() => setShowSkipped((value) => !value)} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 font-bold text-white">{showSkipped ? "Hide skipped" : "Show skipped"}</button>
            <button onClick={() => { window.location.href = "/api/internal-marketing-leads/export"; }} className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 font-bold text-emerald-100">Export CSV</button>
            <a href="/lead-hunt-autopilot" className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 font-bold text-cyan-100">Back to Lead Hunt</a>
          </div>
          {copied && <p className="mt-4 text-sm font-semibold text-emerald-300">Copied.</p>}
          {replyNotice && <p className="mt-4 text-sm font-semibold text-amber-200">{replyNotice}</p>}
          <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-50">
            Automation status: {huntStatus?.recoveryNeeded ? "Recovery needed" : huntStatus?.paused ? "Paused" : huntStatus?.active ? "Running" : huntStatus?.status?.includes("Stopped") ? "Stopped" : "Queued/imported"}.
            Imported {huntStatus?.imported || data?.counts.imported || 0}, skipped {huntStatus?.skipped || 0}, failed {huntStatus?.failed || 0}.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {cards.length ? cards.map((card) => (
            <article key={card.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">{card.label} · {card.fitRank}/100</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{card.analysis.score}</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{card.analysis.risk} risk</span>
              </div>
              <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-200 sm:grid-cols-2">
                <p><strong className="text-white">Group:</strong> {card.sourceName || "Facebook source"}</p>
                <p><strong className="text-white">Author:</strong> {card.author || "Unknown author"}</p>
                <p><strong className="text-white">Timestamp:</strong> {card.dateText || "Not available"}</p>
                <p><strong className="text-white">Score:</strong> {card.fitRank}</p>
                <p><strong className="text-white">Intent:</strong> {card.analysis.intent}</p>
                <p><strong className="text-white">Pain point:</strong> {card.painPoint || card.analysis.intent.replace(/-/g, " ")}</p>
                {card.queryUsed && <p><strong className="text-white">Query:</strong> {card.queryUsed}</p>}
                {card.sourceUsed && <p><strong className="text-white">Source:</strong> {card.sourceUsed}</p>}
                <p><strong className="text-white">Follow-up status:</strong> {card.status || card.outreachStatus || "queued/imported"}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300"><strong className="text-white">Why:</strong> {card.analysis.reason}</p>
              <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 leading-7 text-slate-100"><strong className="text-white">Post:</strong> {card.text || "Facebook post imported"}</p>
              {card.replyDraft && <p className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 leading-7 text-emerald-50"><strong>Reply draft:</strong> {card.replyDraft}</p>}
              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <p className="text-sm font-bold text-cyan-100">Quick Reply</p>
                <p className="mt-2 leading-7 text-slate-100">{card.analysis.quickReply}</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button onClick={() => copy(card.analysis.quickReply)} className="rounded-full bg-white px-4 py-3 font-bold text-slate-950"><Copy className="mr-2 inline h-4 w-4" />Copy reply</button>
                <button onClick={() => copy(card.analysis.deeperReply)} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 font-bold text-white">Copy deeper</button>
                <select defaultValue={card.status || "new"} onChange={(event) => void updateStatus(card.id, event.target.value)} className="rounded-full border border-white/15 bg-slate-950 px-4 py-3 font-bold text-white">
                  <option value="new">new</option>
                  <option value="reviewed">reviewed</option>
                  <option value="replied">replied</option>
                  <option value="follow_up">follow_up</option>
                  <option value="not_fit">not_fit</option>
                  <option value="closed">closed</option>
                </select>
                <button onClick={() => openReplyLink(card.url)} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-center font-bold text-cyan-100"><ExternalLink className="mr-2 inline h-4 w-4" />Reply link</button>
              </div>
            </article>
          )) : (
            <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-8 text-center text-amber-50">
              No internal marketing leads found yet. Run Lead Hunt Autopilot, then refresh this page.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
