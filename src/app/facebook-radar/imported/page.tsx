"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";

type ImportCard = {
  id: string;
  text: string;
  sourceName?: string;
  author?: string;
  url?: string;
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

type ImportResponse = {
  importedAt: string;
  counts: { imported: number; scored: number; good: number; manualOnly: number; skipped: number };
  results: ImportCard[];
  skipped: ImportCard[];
};

export default function ImportedFacebookResultsPage() {
  const [data, setData] = useState<ImportResponse | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    const response = await fetch("/api/facebook-radar/import", { cache: "no-store" });
    setData(await response.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  const cards = [...(data?.results || []), ...(showSkipped ? data?.skipped || [] : [])];

  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-8 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Internal Facebook Radar</p>
          <h1 className="mt-3 text-4xl font-semibold">Imported Facebook Results</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Visible Facebook posts imported by the browser helper, scored for MarketVibe buyer intent.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Imported</p><p className="text-2xl font-bold">{data?.counts.imported || 0}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Good</p><p className="text-2xl font-bold text-emerald-300">{data?.counts.good || 0}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Manual</p><p className="text-2xl font-bold text-cyan-200">{data?.counts.manualOnly || 0}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Skipped</p><p className="text-2xl font-bold text-amber-200">{data?.counts.skipped || 0}</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={load} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-slate-950"><RefreshCw className="h-4 w-4" /> Refresh imports</button>
            <button onClick={() => setShowSkipped((value) => !value)} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 font-bold text-white">{showSkipped ? "Hide skipped" : "Show skipped"}</button>
            <a href="/facebook-radar" className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 font-bold text-cyan-100">Back to Radar</a>
          </div>
          {copied && <p className="mt-4 text-sm font-semibold text-emerald-300">Copied.</p>}
        </div>

        <div className="mt-6 grid gap-4">
          {cards.length ? cards.map((card) => (
            <article key={card.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">{card.label} · {card.fitRank}/100</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{card.analysis.score}</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{card.analysis.risk} risk</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300"><strong className="text-white">Why:</strong> {card.analysis.reason}</p>
              <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 leading-7 text-slate-100">{card.text}</p>
              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <p className="text-sm font-bold text-cyan-100">Quick Reply</p>
                <p className="mt-2 leading-7 text-slate-100">{card.analysis.quickReply}</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button onClick={() => copy(card.analysis.quickReply)} className="rounded-full bg-white px-4 py-3 font-bold text-slate-950"><Copy className="mr-2 inline h-4 w-4" />Copy reply</button>
                <button onClick={() => copy(card.analysis.deeperReply)} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 font-bold text-white">Copy deeper</button>
                <a href={card.url || "https://www.facebook.com"} target="_blank" rel="noreferrer" className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-center font-bold text-cyan-100"><ExternalLink className="mr-2 inline h-4 w-4" />Open source</a>
              </div>
            </article>
          )) : (
            <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-8 text-center text-amber-50">
              No imported results found yet. Go to Facebook, press “Send visible posts to MarketVibe”, then refresh this page.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
