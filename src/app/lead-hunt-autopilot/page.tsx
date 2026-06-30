"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Pause, Play, RefreshCw, Square } from "lucide-react";

type SourceKey = "facebook" | "google" | "bing";
type OutreachMode = "off" | "draft-only" | "manual-approval" | "allowed-adapters";

type ImportedLead = {
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
  fitRank: number;
  analysis: { score: string; intent: string; reason: string };
};

type ImportResponse = {
  counts: { good: number; manualOnly: number; skipped: number };
  results: ImportedLead[];
  importedAt: string;
};

type LeadHuntStatus = {
  active: boolean;
  paused: boolean;
  query: string;
  source: string;
  currentUrl: string;
  imported: number;
  skipped: number;
  duplicates: number;
  failed: number;
  status: string;
  errors: string[];
  updatedAt: string;
  extensionVersion?: string;
};

const LEAD_HUNT_QUERIES = [
  "I need leads",
  "how do I get clients",
  "struggling to get clients",
  "need more customers",
  "looking for leads",
  "need clients fast",
  "my outreach is not working",
  "web designer need leads",
  "SEO freelancer need clients",
  "agency owner need leads",
];

export default function LeadHuntAutopilotPage() {
  const [sources, setSources] = useState<Record<SourceKey, boolean>>({ facebook: true, google: true, bing: true });
  const [maxSearches, setMaxSearches] = useState(10);
  const [maxImportedLeads, setMaxImportedLeads] = useState(10);
  const [delayMs, setDelayMs] = useState(3500);
  const [outreachMode, setOutreachMode] = useState<OutreachMode>("draft-only");
  const [status, setStatus] = useState("Ready. Click Run Lead Hunt to launch the browser extension workflow.");
  const [internalKey, setInternalKey] = useState("");
  const [importData, setImportData] = useState<ImportResponse | null>(null);
  const [runtimeSeconds, setRuntimeSeconds] = useState(0);
  const [liveProgress, setLiveProgress] = useState({
    query: "Not started",
    source: "Not started",
    currentUrl: "",
    imported: 0,
    skipped: 0,
    duplicates: 0,
    failed: 0,
    errors: [] as string[],
    extensionVersion: "",
  });

  const enabledSourceLabels = useMemo(() => {
    const labels: string[] = [];
    if (sources.facebook) labels.push("Facebook Search");
    if (sources.google) labels.push("Google indexed Facebook results");
    if (sources.bing) labels.push("Bing indexed Facebook results");
    return labels;
  }, [sources]);

  async function refreshImports() {
    const response = await fetch("/api/internal-marketing-leads", { cache: "no-store" });
    setImportData(await response.json());
  }

  async function refreshHuntStatus() {
    const response = await fetch("/api/internal-marketing-leads/hunt-status", { cache: "no-store" });
    if (!response.ok) return;
    const next = (await response.json()) as LeadHuntStatus;
    setLiveProgress({
      query: next.query || "Not started",
      source: next.source || "Not started",
      currentUrl: next.currentUrl || "",
      imported: next.imported || 0,
      skipped: next.skipped || 0,
      duplicates: next.duplicates || 0,
      failed: next.failed || 0,
      errors: next.errors || [],
      extensionVersion: next.extensionVersion || "",
    });
    if (next.status) setStatus(next.status);
  }

  useEffect(() => {
    let ignore = false;

    void fetch("/api/internal-marketing-leads", { cache: "no-store" })
      .then((response) => response.json())
      .then((nextData: ImportResponse) => {
        if (!ignore) setImportData(nextData);
      });

    return () => {
      ignore = true;
    };
  }, []);

  function runLeadHunt() {
    const runId = globalThis.crypto?.randomUUID?.() || `hunt-${Date.now()}`;
    setRuntimeSeconds(0);
    setLiveProgress({
      query: LEAD_HUNT_QUERIES[0],
      source: enabledSourceLabels[0] || "No source enabled",
      currentUrl: "",
      imported: 0,
      skipped: 0,
      duplicates: 0,
      failed: 0,
      errors: [],
      extensionVersion: "",
    });
    setStatus("Lead Hunt launched. The extension will open searches, scan visible public pages, import High Intent matches, and stop at your caps.");
    const config = {
      runId,
      queries: LEAD_HUNT_QUERIES,
      sources,
      caps: { maxSearches, maxImportedLeads, delayMs },
      outreach: { mode: outreachMode, adapters: [] as string[] },
      internalKey: internalKey.trim(),
    };
    window.open(`https://www.facebook.com/search/posts/?q=${encodeURIComponent(LEAD_HUNT_QUERIES[0])}#marketvibeLeadHunt=${encodeURIComponent(JSON.stringify(config))}`, "_blank", "noopener,noreferrer");
  }

  function passiveControl(label: string) {
    setStatus(`${label} is controlled from the floating extension panel on Facebook/Google/Bing so you can stop immediately while pages are opening.`);
  }

  async function createTestLead() {
    const response = await fetch("/api/internal-marketing-leads/test", { method: "POST" });
    if (!response.ok) {
      setStatus("Test internal lead did not save. Check Supabase service role/internal auth before marking complete.");
      return;
    }
    await refreshImports();
    setStatus("Test internal lead saved. Refresh the page and confirm it remains visible before marking complete.");
  }

  function clearLocalProgressHint() {
    setRuntimeSeconds(0);
    setLiveProgress({
      query: "Not started",
      source: "Not started",
      currentUrl: "",
      imported: 0,
      skipped: 0,
      duplicates: 0,
      failed: 0,
      errors: [],
      extensionVersion: "",
    });
    setStatus("Local dashboard progress cleared. Use Stop in the extension panel to stop an active browser tab.");
  }

  useEffect(() => {
    if (!status.includes("launched") && !liveProgress.currentUrl) return;
    const timer = window.setInterval(() => setRuntimeSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status, liveProgress.currentUrl]);

  useEffect(() => {
    if (!status.includes("launched") && !status.includes("Lead Hunt") && !liveProgress.currentUrl) return;
    const timer = window.setInterval(() => {
      void refreshHuntStatus();
      void refreshImports();
    }, 1500);
    return () => window.clearInterval(timer);
  }, [status, liveProgress.currentUrl]);

  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-8 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Internal Growth Tool</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Lead Hunt Autopilot</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            One button launches an automated public-source buyer-intent hunt. No auto-DM, no auto-comment, no private data, and no spam actions.
          </p>

          <label className="mt-5 grid max-w-xl gap-2 text-sm font-bold text-slate-200">
            Internal API key for extension imports
            <input
              type="password"
              value={internalKey}
              onChange={(event) => setInternalKey(event.target.value)}
              placeholder="Only needed when INTERNAL_MARKETING_API_KEY is enabled"
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
            />
          </label>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <button onClick={runLeadHunt} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-200 px-6 py-4 text-base font-black text-slate-950 shadow-xl shadow-emerald-950/30">
              <Play className="h-5 w-5" /> Run Lead Hunt
            </button>
            <button onClick={() => passiveControl("Pause")} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-4 font-bold text-white">
              <Pause className="h-5 w-5" /> Pause
            </button>
            <button onClick={() => passiveControl("Resume")} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-4 font-bold text-white">
              <Play className="h-5 w-5" /> Resume
            </button>
            <button onClick={() => passiveControl("Stop")} className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-300/25 bg-rose-300/10 px-5 py-4 font-bold text-rose-100">
              <Square className="h-5 w-5" /> Stop
            </button>
          </div>

          <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-50">{status}</p>
          {liveProgress.extensionVersion && liveProgress.extensionVersion !== "0.1.1" && (
            <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-semibold text-amber-50">
              Extension version warning: loaded extension reports {liveProgress.extensionVersion}. Reload the unpacked extension if the latest runner is not active.
            </p>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Live query</p><p className="mt-2 min-w-0 break-words text-sm font-bold text-white">{liveProgress.query}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Live source</p><p className="mt-2 text-sm font-bold text-white">{liveProgress.source}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Runtime</p><p className="mt-2 text-sm font-bold text-white">{Math.floor(runtimeSeconds / 60)}m {runtimeSeconds % 60}s</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Current URL</p><p className="mt-2 min-w-0 break-all text-xs font-bold text-cyan-100">{liveProgress.currentUrl || "Extension panel updates while running"}</p></div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4"><p className="text-xs uppercase tracking-[0.16em] text-emerald-200">Imported</p><p className="mt-2 text-2xl font-black text-emerald-100">{importData?.counts.good || liveProgress.imported}</p></div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"><p className="text-xs uppercase tracking-[0.16em] text-amber-200">Skipped</p><p className="mt-2 text-2xl font-black text-amber-100">{liveProgress.skipped}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Duplicates</p><p className="mt-2 text-2xl font-black text-white">{liveProgress.duplicates}</p></div>
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4"><p className="text-xs uppercase tracking-[0.16em] text-rose-200">Failed</p><p className="mt-2 text-2xl font-black text-rose-100">{liveProgress.failed}</p></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={createTestLead} className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 text-sm font-bold text-emerald-100">Create test internal lead</button>
            <button onClick={() => { window.location.href = "/api/internal-marketing-leads/export"; }} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={clearLocalProgressHint} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white">Clear local dashboard</button>
            <a href="/internal-marketing-leads" className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100">View internal leads</a>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-2xl font-semibold">Queue setup</h2>
            <div className="mt-4 grid gap-3">
              {([
                ["facebook", "Facebook Search"],
                ["google", "Google indexed Facebook results"],
                ["bing", "Bing indexed Facebook results"],
              ] as [SourceKey, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm font-bold text-slate-100">
                  {label}
                  <input type="checkbox" checked={sources[key]} onChange={(event) => setSources((current) => ({ ...current, [key]: event.target.checked }))} />
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-bold text-slate-200">
                Max searches
                <input type="number" min={1} max={30} value={maxSearches} onChange={(event) => setMaxSearches(Number(event.target.value))} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-200">
                Max imported leads
                <input type="number" min={1} max={50} value={maxImportedLeads} onChange={(event) => setMaxImportedLeads(Number(event.target.value))} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-200">
                Delay between actions
                <input type="number" min={1500} step={500} value={delayMs} onChange={(event) => setDelayMs(Number(event.target.value))} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
              </label>
            </div>
            <label className="mt-5 grid gap-2 text-sm font-bold text-slate-200">
              Outreach engine mode
              <select value={outreachMode} onChange={(event) => setOutreachMode(event.target.value as OutreachMode)} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white">
                <option value="off">OFF</option>
                <option value="draft-only">Draft only</option>
                <option value="manual-approval">Manual approval</option>
                <option value="allowed-adapters">Autopilot for allowed adapters only</option>
              </select>
            </label>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm font-bold text-emerald-200">Queue system</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Tracks current query, source, result number, imported count, skipped count, duplicate count, daily caps, and extension errors in the floating panel.
              </p>
              <p className="mt-2 text-sm text-slate-400">Enabled sources: {enabledSourceLabels.join(", ") || "none"}</p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-2xl font-semibold">Query presets</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {LEAD_HUNT_QUERIES.map((query) => (
                <div key={query} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-slate-100">{query}</div>
              ))}
            </div>
            <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              The extension skips low-quality, spam, seller, job, freelancer-noise, duplicate, blocked, blank, and unavailable pages.
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Final imported leads</h2>
              <p className="mt-1 text-sm text-slate-400">Only imported leads are shown here. Skipped pages stay out of this list.</p>
            </div>
            <button onClick={refreshImports} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
          <div className="mt-5 grid gap-4">
            {importData?.results?.length ? importData.results.map((lead) => (
              <article key={lead.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">Score {lead.fitRank}</span>
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{lead.painPoint || lead.analysis.intent}</span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{lead.sourceUsed || "Imported"}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300"><strong className="text-white">Group/Page:</strong> {lead.sourceName || "Facebook source"} · <strong className="text-white">Author:</strong> {lead.author || "Unknown"} · <strong className="text-white">Timestamp:</strong> {lead.dateText || "Not available"}</p>
                <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 leading-7 text-slate-100">{lead.text}</p>
                {lead.replyDraft && <p className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 leading-7 text-emerald-50"><strong>Reply draft:</strong> {lead.replyDraft}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {lead.queryUsed && <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">Query: {lead.queryUsed}</span>}
                  {lead.outreachMode && <span className="rounded-full border border-emerald-300/20 px-3 py-1 text-xs font-bold text-emerald-100">Outreach: {lead.outreachMode}</span>}
                  <a href={lead.url || "https://www.facebook.com"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
                    <ExternalLink className="h-4 w-4" /> Open
                  </a>
                </div>
              </article>
            )) : (
              <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-8 text-center text-slate-300">No imported leads yet. Run Lead Hunt, then refresh this list.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
