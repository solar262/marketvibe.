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
  confidenceScore?: number;
  matchReason?: string;
  fitRank: number;
  analysis: { score: string; intent: string; reason: string };
};

type ImportResponse = {
  counts: { good: number; manualOnly: number; skipped: number };
  results: ImportedLead[];
  importedAt: string;
};

type LeadHuntStatus = {
  runId?: string;
  active: boolean;
  paused: boolean;
  recoveryNeeded?: boolean;
  query: string;
  source: string;
  currentUrl: string;
  currentItem: number;
  totalQueued: number;
  completed: number;
  imported: number;
  skipped: number;
  ignoredLowConfidence?: number;
  duplicates: number;
  failed: number;
  status: string;
  lastError: string;
  errors: string[];
  updatedAt: string;
  extensionVersion?: string;
};

type LeadHuntEvent = {
  runId?: string;
  eventType: string;
  message?: string;
  reason?: string;
  sourceUrl?: string;
  query?: string;
  score?: number;
  createdAt?: string;
};

const LEAD_HUNT_QUERIES = [
  "how do I get web design clients",
  "how do I get SEO clients",
  "where can I find local business leads",
  "how to sell websites to local businesses",
  "how to sell SEO to local businesses",
  "web designer struggling to get clients",
  "SEO freelancer struggling to get clients",
  "agency owner client acquisition",
  "cold outreach not working for agency",
  "where do marketers find prospects",
];

export default function LeadHuntAutopilotPage() {
  const [sources, setSources] = useState<Record<SourceKey, boolean>>({ facebook: true, google: true, bing: true });
  const [maxSearches, setMaxSearches] = useState(10);
  const [maxImportedLeads, setMaxImportedLeads] = useState(10);
  const [delayMs, setDelayMs] = useState(3500);
  const [confidenceThreshold, setConfidenceThreshold] = useState(78);
  const [outreachMode, setOutreachMode] = useState<OutreachMode>("draft-only");
  const [status, setStatus] = useState("Ready. Click Run Buyer Radar to launch the browser extension workflow.");
  const [internalKey, setInternalKey] = useState("");
  const [importData, setImportData] = useState<ImportResponse | null>(null);
  const [runLogs, setRunLogs] = useState<LeadHuntEvent[]>([]);
  const [runtimeSeconds, setRuntimeSeconds] = useState(0);
  const [liveProgress, setLiveProgress] = useState({
    runId: "",
    active: false,
    paused: false,
    recoveryNeeded: false,
    query: "Not started",
    source: "Not started",
    currentUrl: "",
    currentItem: 0,
    totalQueued: 0,
    completed: 0,
    imported: 0,
    skipped: 0,
    ignoredLowConfidence: 0,
    duplicates: 0,
    failed: 0,
    lastError: "",
    errors: [] as string[],
    extensionVersion: "",
    updatedAt: "",
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

  async function refreshRunLogs() {
    const response = await fetch("/api/internal-marketing-leads/events?limit=25", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json() as { events?: LeadHuntEvent[] };
    setRunLogs(Array.isArray(payload.events) ? payload.events : []);
  }

  async function refreshHuntStatus() {
    const response = await fetch("/api/internal-marketing-leads/hunt-status", { cache: "no-store" });
    if (!response.ok) return;
    const next = (await response.json()) as LeadHuntStatus;
    setLiveProgress({
      runId: next.runId || "",
      active: Boolean(next.active),
      paused: Boolean(next.paused),
      recoveryNeeded: Boolean(next.recoveryNeeded),
      query: next.query || "Not started",
      source: next.source || "Not started",
      currentUrl: next.currentUrl || "",
      currentItem: next.currentItem || 0,
      totalQueued: next.totalQueued || 0,
      completed: next.completed || 0,
      imported: next.imported || 0,
      skipped: next.skipped || 0,
      ignoredLowConfidence: next.ignoredLowConfidence || 0,
      duplicates: next.duplicates || 0,
      failed: next.failed || 0,
      lastError: next.lastError || next.errors?.[0] || "",
      errors: next.errors || [],
      extensionVersion: next.extensionVersion || "",
      updatedAt: next.updatedAt || "",
    });
    if (next.status) setStatus(next.status);
  }

  async function updateHuntControl(patch: Partial<LeadHuntStatus>) {
    const response = await fetch("/api/internal-marketing-leads/hunt-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: liveProgress.runId,
        query: liveProgress.query,
        source: liveProgress.source,
        currentUrl: liveProgress.currentUrl,
        currentItem: liveProgress.currentItem,
        totalQueued: liveProgress.totalQueued,
        completed: liveProgress.completed,
        imported: liveProgress.imported,
        skipped: liveProgress.skipped,
        ignoredLowConfidence: liveProgress.ignoredLowConfidence,
        duplicates: liveProgress.duplicates,
        failed: liveProgress.failed,
        errors: liveProgress.errors,
        extensionVersion: liveProgress.extensionVersion,
        ...patch,
      }),
    });
    if (!response.ok) {
      setStatus("Control update failed. Refresh status and try again.");
      return;
    }
    await refreshHuntStatus();
    await refreshRunLogs();
  }

  useEffect(() => {
    let ignore = false;

    void fetch("/api/internal-marketing-leads", { cache: "no-store" })
      .then((response) => response.json())
      .then((nextData: ImportResponse) => {
        if (!ignore) setImportData(nextData);
      });
    void fetch("/api/internal-marketing-leads/events?limit=25", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { events: [] })
      .then((payload: { events?: LeadHuntEvent[] }) => {
        if (!ignore) setRunLogs(Array.isArray(payload.events) ? payload.events : []);
      });

    return () => {
      ignore = true;
    };
  }, []);

  function runLeadHunt() {
    const runId = globalThis.crypto?.randomUUID?.() || `hunt-${Date.now()}`;
    setRuntimeSeconds(0);
    setLiveProgress({
      runId,
      active: true,
      paused: false,
      recoveryNeeded: false,
      query: LEAD_HUNT_QUERIES[0],
      source: enabledSourceLabels[0] || "No source enabled",
      currentUrl: "",
      currentItem: 1,
      totalQueued: Math.min(maxSearches, LEAD_HUNT_QUERIES.length * enabledSourceLabels.length),
      completed: 0,
      imported: 0,
      skipped: 0,
      ignoredLowConfidence: 0,
      duplicates: 0,
      failed: 0,
      lastError: "",
      errors: [],
      extensionVersion: "",
      updatedAt: new Date().toISOString(),
    });
    setStatus("Buyer Radar launched. The extension will open internal buyer-intent searches, collect high-confidence service-seller matches, and stop at your caps.");
    const config = {
      runId,
      queries: LEAD_HUNT_QUERIES,
      sources,
      caps: { maxSearches, maxImportedLeads, delayMs, confidenceThreshold },
      outreach: { mode: outreachMode, adapters: [] as string[] },
      internalKey: internalKey.trim(),
    };
    window.open(`https://www.facebook.com/search/posts/?q=${encodeURIComponent(LEAD_HUNT_QUERIES[0])}#marketvibeLeadHunt=${encodeURIComponent(JSON.stringify(config))}`, "_blank", "noopener,noreferrer");
  }

  async function pauseLeadHunt() {
    await updateHuntControl({ active: true, paused: true, status: "Paused. No new browser action will start until resumed." });
  }

  async function resumeLeadHunt() {
    await updateHuntControl({ active: true, paused: false, recoveryNeeded: false, status: "Resuming from next unprocessed queued item." });
  }

  async function stopLeadHunt() {
    await updateHuntControl({ active: false, paused: false, recoveryNeeded: false, status: "Stopped. Browser loop, timers, and current task lock cleared." });
  }

  async function skipCurrent() {
    await updateHuntControl({
      active: liveProgress.active || liveProgress.paused,
      paused: liveProgress.paused,
      skipped: liveProgress.skipped + 1,
      completed: liveProgress.completed + 1,
      currentItem: liveProgress.currentItem + 1,
      status: "Skip current requested. Active tab will mark this item skipped and move to the next queued item.",
    });
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
      runId: "",
      active: false,
      paused: false,
      recoveryNeeded: false,
      query: "Not started",
      source: "Not started",
      currentUrl: "",
      currentItem: 0,
      totalQueued: 0,
      completed: 0,
      imported: 0,
      skipped: 0,
      ignoredLowConfidence: 0,
      duplicates: 0,
      failed: 0,
      lastError: "",
      errors: [],
      extensionVersion: "",
      updatedAt: "",
    });
    setStatus("Local dashboard progress cleared. Use Stop in the extension panel to stop an active browser tab.");
  }

  useEffect(() => {
    if (!liveProgress.active && !liveProgress.paused && !status.includes("launched") && !liveProgress.currentUrl) return;
    const timer = window.setInterval(() => setRuntimeSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status, liveProgress.active, liveProgress.currentUrl, liveProgress.paused]);

  useEffect(() => {
    if (!liveProgress.active && !liveProgress.paused && !liveProgress.recoveryNeeded && !status.includes("launched") && !status.includes("Lead Hunt") && !liveProgress.currentUrl) return;
    const timer = window.setInterval(() => {
      void refreshHuntStatus();
      void refreshImports();
      void refreshRunLogs();
    }, 1500);
    return () => window.clearInterval(timer);
  }, [status, liveProgress.active, liveProgress.currentUrl, liveProgress.paused, liveProgress.recoveryNeeded]);

  const displayState = liveProgress.recoveryNeeded
    ? "Recovery needed"
    : liveProgress.paused
      ? "Paused"
      : liveProgress.active
        ? "Running"
        : /error|failed/i.test(status) || Boolean(liveProgress.lastError)
          ? "Error"
          : /completed|complete/i.test(status)
            ? "Completed"
            : /stopped|stop/i.test(status)
              ? "Stopped"
              : "Idle";
  const currentTarget = [liveProgress.source, liveProgress.query].filter((value) => value && value !== "Not started").join(" / ") || "No active target";

  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-8 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Internal Growth Tool</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Buyer Radar Autopilot</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Internal browser workflow for finding service sellers with client-acquisition pain. No auto-DM, no auto-comment, no private data, and no spam actions.
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

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <button onClick={runLeadHunt} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-200 px-5 py-4 text-sm font-black text-slate-950 shadow-xl shadow-emerald-950/30 sm:text-base">
              <Play className="h-5 w-5 shrink-0" /> <span className="truncate">{liveProgress.active || liveProgress.paused || liveProgress.recoveryNeeded ? "Start New Run" : "Run Buyer Radar"}</span>
            </button>
            <button onClick={() => void pauseLeadHunt()} disabled={!liveProgress.active || liveProgress.paused} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:text-base">
              <Pause className="h-5 w-5 shrink-0" /> Pause
            </button>
            <button onClick={() => void resumeLeadHunt()} disabled={!liveProgress.runId || (!liveProgress.paused && !liveProgress.recoveryNeeded && liveProgress.active)} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:text-base">
              <Play className="h-5 w-5 shrink-0" /> Resume
            </button>
            <button onClick={() => void skipCurrent()} disabled={!liveProgress.active && !liveProgress.paused && !liveProgress.recoveryNeeded} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-5 py-4 text-sm font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base">
              Skip Current
            </button>
            <button onClick={() => void stopLeadHunt()} disabled={!liveProgress.active && !liveProgress.paused && !liveProgress.recoveryNeeded} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-rose-300/25 bg-rose-300/10 px-5 py-4 text-sm font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base">
              <Square className="h-5 w-5 shrink-0" /> Stop
            </button>
          </div>

          <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-50">{status}</p>
          <p className={`mt-3 rounded-2xl border p-4 text-sm font-black ${
            liveProgress.recoveryNeeded ? "border-amber-300/25 bg-amber-300/10 text-amber-50" :
            liveProgress.paused ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-50" :
            liveProgress.active ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-50" :
            "border-white/10 bg-slate-950/40 text-slate-200"
          }`}>
            Current state: {displayState}
          </p>
          {liveProgress.extensionVersion && liveProgress.extensionVersion !== "0.1.2" && (
            <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-semibold text-amber-50">
              Extension version warning: loaded extension reports {liveProgress.extensionVersion}. Reload the unpacked extension if the latest runner is not active.
            </p>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Current target</p><p className="mt-2 min-w-0 break-words text-sm font-bold text-white">{currentTarget}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Live source</p><p className="mt-2 text-sm font-bold text-white">{liveProgress.source}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Runtime</p><p className="mt-2 text-sm font-bold text-white">{Math.floor(runtimeSeconds / 60)}m {runtimeSeconds % 60}s</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Current URL</p><p className="mt-2 min-w-0 break-all text-xs font-bold text-cyan-100">{liveProgress.currentUrl || "Extension panel updates while running"}</p></div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4"><p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Current item</p><p className="mt-2 text-2xl font-black text-cyan-100">{liveProgress.currentItem || 0}/{liveProgress.totalQueued || Math.max(liveProgress.currentItem, liveProgress.completed, 0)}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Completed</p><p className="mt-2 text-2xl font-black text-white">{liveProgress.completed || liveProgress.imported + liveProgress.skipped + liveProgress.ignoredLowConfidence + liveProgress.duplicates + liveProgress.failed}</p></div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4"><p className="text-xs uppercase tracking-[0.16em] text-emerald-200">Imported</p><p className="mt-2 text-2xl font-black text-emerald-100">{importData?.counts.good || liveProgress.imported}</p></div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"><p className="text-xs uppercase tracking-[0.16em] text-amber-200">Skipped</p><p className="mt-2 text-2xl font-black text-amber-100">{liveProgress.skipped}</p></div>
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4"><p className="text-xs uppercase tracking-[0.16em] text-rose-200">Failed</p><p className="mt-2 text-2xl font-black text-rose-100">{liveProgress.failed}</p></div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4"><p className="text-xs uppercase tracking-[0.16em] text-violet-200">Ignored low-confidence</p><p className="mt-2 text-2xl font-black text-violet-100">{liveProgress.ignoredLowConfidence}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Duplicates</p><p className="mt-2 text-2xl font-black text-white">{liveProgress.duplicates}</p></div>
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4"><p className="text-xs uppercase tracking-[0.16em] text-rose-200">Last error</p><p className="mt-2 min-w-0 break-words text-sm font-bold text-rose-50">{liveProgress.lastError || liveProgress.errors[0] || "None"}</p></div>
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

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
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
              <label className="grid gap-2 text-sm font-bold text-slate-200">
                Minimum confidence
                <input type="number" min={50} max={95} step={1} value={confidenceThreshold} onChange={(event) => setConfidenceThreshold(Number(event.target.value))} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
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
                Tracks current target, result number, imported count, ignored low-confidence count, skipped count, duplicate count, run caps, and extension errors in the floating panel.
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
              Internal only: these searches look for buyers of MarketVibe opportunity inventory, not salon/cafe/gym/dentist owners. The extension skips generic business posts, job spam, reseller offers, duplicates, blocked pages, and low-confidence results.
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Run logs</h2>
              <p className="mt-1 text-sm text-slate-400">Recent browser actions, skips, imports, and recovery events from the internal runner.</p>
            </div>
            <button onClick={refreshRunLogs} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white">
              <RefreshCw className="h-4 w-4" /> Refresh logs
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            {runLogs.length ? runLogs.map((log, index) => (
              <article key={`${log.createdAt || index}-${log.eventType}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">{log.eventType || "event"}</span>
                  {log.score ? <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">Confidence {log.score}</span> : null}
                  <span className="text-xs font-semibold text-slate-400">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "Just now"}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{log.message || log.reason || "Runner event recorded."}</p>
                {(log.query || log.sourceUrl) && <p className="mt-2 min-w-0 break-words text-xs text-slate-400">{log.query || ""}{log.query && log.sourceUrl ? " · " : ""}{log.sourceUrl || ""}</p>}
              </article>
            )) : (
              <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-8 text-center text-slate-300">No run logs yet. Start Buyer Radar or refresh after the extension reports activity.</div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Latest processed buyer-intent items</h2>
              <p className="mt-1 text-sm text-slate-400">Saved service-seller opportunities with buyer intent. Skipped pages stay out of this list.</p>
            </div>
            <button onClick={refreshImports} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
          <div className="mt-5 grid gap-4">
            {importData?.results?.length ? importData.results.map((lead) => (
              <article key={lead.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">Confidence {lead.confidenceScore || lead.fitRank}</span>
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{lead.painPoint || lead.analysis.intent}</span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{lead.sourceUsed || "Imported"}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300"><strong className="text-white">Group/Page:</strong> {lead.sourceName || "Facebook source"} · <strong className="text-white">Author:</strong> {lead.author || "Unknown"} · <strong className="text-white">Timestamp:</strong> {lead.dateText || "Not available"}</p>
                <p className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold leading-6 text-cyan-50"><strong>Matched because:</strong> {lead.matchReason || lead.analysis.reason}</p>
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
              <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-8 text-center text-slate-300">No buyer-intent items yet. Run Buyer Radar, then refresh this list.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
