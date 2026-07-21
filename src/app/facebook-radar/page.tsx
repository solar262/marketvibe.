"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, Radar, Search, ShieldCheck, SkipForward } from "lucide-react";
import { normalizeCustomSearchTerm, searchModeLabel } from "@/lib/custom-search";
import {
  BUYER_INTENT_QUERY_LIBRARY,
  analyzeFacebookLead,
  createDefaultFacebookFilters,
  filterAndRankFacebookLeads,
  generateFacebookSearchLinks,
  shouldSendFacebookLead,
  type FacebookLeadPreview,
  type FacebookRadarFilters,
  type FacebookRadarResult,
  type FacebookRadarSchedule,
  type FacebookRadarSearchLink,
} from "@/lib/facebook-radar";

type ReplyMode = "quick" | "deeper";
type ToolMode = "find" | "analyze" | "welcome";
type MainTab = "Search" | "Presets" | "Results" | "Sent Leads" | "Logs" | "Settings";

const DEFAULT_BUYER = "web designers, SEO freelancers, local marketers, small agencies";
const DEFAULT_NICHE = "web design, SEO, local marketing agencies";
const DEFAULT_PAIN = "need clients, looking for leads, cold outreach not working, no customers";
const PASTE_PROMPT = "Paste the Facebook post text here.";
const MAIN_TABS: MainTab[] = ["Search", "Presets", "Results", "Sent Leads", "Logs", "Settings"];

function badgeClasses(value: string) {
  if (value === "High") return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
  if (value === "Medium") return "border-amber-300/30 bg-amber-300/15 text-amber-100";
  return "border-slate-300/20 bg-slate-300/10 text-slate-200";
}

function riskClasses(value: string) {
  if (value === "Low") return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
  if (value === "Medium") return "border-amber-300/30 bg-amber-300/15 text-amber-100";
  return "border-rose-300/30 bg-rose-300/15 text-rose-100";
}

export default function FacebookRadarPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("Search");
  const [mode, setMode] = useState<ToolMode>("find");
  const [targetBuyer, setTargetBuyer] = useState(DEFAULT_BUYER);
  const [niche, setNiche] = useState(DEFAULT_NICHE);
  const [painKeywords, setPainKeywords] = useState(DEFAULT_PAIN);
  const [customSearchTerm, setCustomSearchTerm] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [postText, setPostText] = useState("");
  const [result, setResult] = useState<FacebookRadarResult | null>(null);
  const [replyMode, setReplyMode] = useState<ReplyMode>("quick");
  const [copied, setCopied] = useState(false);
  const [searched, setSearched] = useState<string[]>([]);
  const [skippedSearches, setSkippedSearches] = useState<string[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [resetNotice, setResetNotice] = useState("");
  const [linkNotice, setLinkNotice] = useState("");
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [customQueries, setCustomQueries] = useState<string[]>([]);
  const [queryDraft, setQueryDraft] = useState("");
  const [filters, setFilters] = useState<FacebookRadarFilters>(() => createDefaultFacebookFilters());
  const [savedPresets, setSavedPresets] = useState<{ name: string; queries: string[] }[]>([]);
  const [schedules, setSchedules] = useState<FacebookRadarSchedule[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [sentLeads, setSentLeads] = useState<FacebookLeadPreview[]>([]);

  const activeCustomSearchTerm = normalizeCustomSearchTerm(customSearchTerm);
  const searchMode = activeCustomSearchTerm ? "custom" : "preset";
  const modeText = searchModeLabel(searchMode);
  const allQueries = useMemo(() => [...BUYER_INTENT_QUERY_LIBRARY, ...customQueries], [customQueries]);
  const activeTargetBuyer = activeCustomSearchTerm || targetBuyer;
  const activePainKeywords = activeCustomSearchTerm || painKeywords;
  const activeScheduleQueries = useMemo(() => activeCustomSearchTerm ? [activeCustomSearchTerm] : allQueries, [activeCustomSearchTerm, allQueries]);
  const searchLinks = useMemo(() => generateFacebookSearchLinks({ targetBuyer, niche, painKeywords: [painKeywords, ...allQueries].join(", "), customSearchTerm: activeCustomSearchTerm }), [targetBuyer, niche, painKeywords, allQueries, activeCustomSearchTerm]);
  const availableSearchLinks = searchLinks.filter((link) => !searched.includes(link.phrase) && !skippedSearches.includes(link.phrase));
  const activeSearchLink = availableSearchLinks[Math.min(currentSearchIndex, Math.max(availableSearchLinks.length - 1, 0))];
  const sentSignatures = useMemo(() => new Set(sentLeads.map((lead) => lead.id)), [sentLeads]);
  const previewLeads = useMemo(() => {
    const text = postText.trim() === PASTE_PROMPT ? "" : postText.trim();
    if (!text) return [];
    return filterAndRankFacebookLeads([
      {
        text,
        url: sourceUrl,
        groupName: sourceUrl ? "Manual Facebook source" : "Manual paste",
        groupMembers: filters.minimumMembers,
        groupPostsPerDay: filters.minimumPostsPerDay,
        comments: filters.minimumEngagement,
        reactions: 0,
        language: filters.language,
        location: filters.location,
        isPublicGroup: true,
      },
    ], filters, sentSignatures);
  }, [filters, postText, sentSignatures, sourceUrl]);
  const selectedReply = useMemo(() => {
    if (!result) return "";
    return replyMode === "deeper" && result.deeperReply ? result.deeperReply : result.quickReply;
  }, [replyMode, result]);
  const welcomeTargets = useMemo(() => {
    const text = postText.trim();
    if (!text) return [];
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => /\b(new member|welcome|joined|introduced|introduction|say hello|new here)\b/i.test(line))
      .slice(0, 8);
  }, [postText]);
  const welcomeMessage = useMemo(() => {
    const groupName = sourceUrl ? "the group" : "this community";
    return `Welcome in. I saw your intro in ${groupName} and hope the group is useful. If you are working on getting more clients or leads, happy to point you toward a few public resources.`;
  }, [sourceUrl]);

  function addLog(message: string) {
    const stamped = `${new Date().toLocaleString()} - ${message}`;
    setLogs((current) => [stamped, ...current].slice(0, 80));
  }

  function analyze() {
    const analyzableText = postText.trim() === PASTE_PROMPT ? "" : postText;
    const next = analyzeFacebookLead({ postText: analyzableText, targetBuyer: activeTargetBuyer, painKeywords: activePainKeywords, sourceUrl });
    setResult(next);
    setReplyMode("quick");
    setCopied(false);
    addLog(`Manual post analyzed: ${next.score} intent, ${next.action}.`);
    track("Facebook Radar Analyze", { action: next.action, score: next.score, risk: next.risk, intent: next.intent });
  }

  async function copyText(value: string, eventName: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    track(eventName, {});
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function copyReply() {
    if (!selectedReply || !result) return;
    await navigator.clipboard.writeText(selectedReply);
    setCopied(true);
    track("Facebook Radar Copy Reply", { action: result.action, score: result.score, reply_mode: replyMode });
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function copyAndOpen() {
    if (!selectedReply || !result) return;
    await navigator.clipboard.writeText(selectedReply);
    setCopied(true);
    track("Facebook Radar Copy And Open", { action: result.action, score: result.score, reply_mode: replyMode });
    window.open(result.searchUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setCopied(false), 1600);
  }

  function markSearch(link: FacebookRadarSearchLink) {
    setSearched((current) => current.includes(link.phrase) ? current : [...current, link.phrase]);
    addLog(`Search marked good: ${link.phrase}`);
    track("Facebook Radar Mark Search", { phrase: link.phrase });
  }

  function clearSourceUrl() {
    setSourceUrl("");
    setLinkNotice("");
    setResetNotice("Link field cleared.");
  }

  function openReplyLink() {
    if (!sourceUrl.trim()) {
      setLinkNotice("No reply link available");
      window.setTimeout(() => setLinkNotice(""), 1800);
      return;
    }
    window.open(sourceUrl.trim(), "_blank", "noopener,noreferrer");
  }

  async function copyWelcomeMessage() {
    await navigator.clipboard.writeText(welcomeMessage);
    setCopied(true);
    addLog("Facebook welcome message copied for manual review.");
    window.setTimeout(() => setCopied(false), 1600);
  }

  function skipSearch(link: FacebookRadarSearchLink) {
    setSkippedSearches((current) => current.includes(link.phrase) ? current : [...current, link.phrase]);
    setSkippedCount((value) => value + 1);
    addLog(`Search skipped: ${link.phrase}`);
    track("Facebook Radar Skip Search", { phrase: link.phrase });
  }

  function openSearch(link: FacebookRadarSearchLink, url: string, searchType: "posts" | "groups") {
    void navigator.clipboard.writeText(link.phrase).then(() => setCopied(true)).catch(() => setCopied(false));
    addLog(`Opened ${searchType} search: ${link.phrase}`);
    track("Facebook Radar Open Search", { phrase: link.phrase, search_type: searchType });
    window.location.assign(url);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function markBadNext(link?: FacebookRadarSearchLink) {
    if (!link) return;
    skipSearch(link);
    setCurrentSearchIndex((value) => Math.min(value, Math.max(availableSearchLinks.length - 2, 0)));
  }

  function markGoodAnalyze(link?: FacebookRadarSearchLink) {
    if (!link) return;
    markSearch(link);
    setSourceUrl(link.postsUrl);
    setPostText(PASTE_PROMPT);
    setResult(null);
    setReplyMode("quick");
    setMode("analyze");
    track("Facebook Radar Mark Good Analyze", { phrase: link.phrase });
  }

  function clearWorkflowState() {
    setSearched([]);
    setSkippedSearches([]);
    setDoneCount(0);
    setSkippedCount(0);
    setCopied(false);
    setResult(null);
    setReplyMode("quick");
    setCurrentSearchIndex(0);
  }

  function resetSearches() {
    clearWorkflowState();
    setResetNotice("Search queue reset.");
    addLog("Search queue reset.");
    track("Facebook Radar Reset Searches", {});
  }

  function resetToDefaults() {
    clearWorkflowState();
    setTargetBuyer(DEFAULT_BUYER);
    setNiche(DEFAULT_NICHE);
    setPainKeywords(DEFAULT_PAIN);
    setCustomSearchTerm("");
    setPostText("");
    setSourceUrl("");
    setResetNotice("Search queue reset.");
    addLog("Search queue reset to default inputs.");
    track("Facebook Radar Reset Defaults", {});
  }

  function markDone() {
    setDoneCount((value) => value + 1);
    track("Facebook Radar Mark Done", { score: result?.score || "none" });
    setPostText("");
    setResult(null);
    setReplyMode("quick");
    addLog("Manual reply marked done.");
  }

  function skip() {
    setSkippedCount((value) => value + 1);
    track("Facebook Radar Skip", { score: result?.score || "none" });
    setResult(null);
    setReplyMode("quick");
    addLog("Manual result skipped.");
  }

  function addCustomQuery() {
    const query = queryDraft.trim();
    if (!query || allQueries.map((item) => item.toLowerCase()).includes(query.toLowerCase())) return;
    setCustomQueries((current) => [...current, query]);
    setQueryDraft("");
    addLog(`Custom query added: ${query}`);
  }

  function deleteCustomQuery(query: string) {
    setCustomQueries((current) => current.filter((item) => item !== query));
    addLog(`Custom query deleted: ${query}`);
  }

  function saveSearchPreset() {
    const name = `Preset ${savedPresets.length + 1}`;
    setSavedPresets((current) => [{ name, queries: activeScheduleQueries.slice(0, 12) }, ...current]);
    addLog(`${name} saved with ${Math.min(activeScheduleQueries.length, 12)} queries.`);
  }

  function addSchedule(cadence: FacebookRadarSchedule["cadence"]) {
    const nextSchedule: FacebookRadarSchedule = {
      id: `${cadence}-${schedules.length + 1}`,
      name: `${cadence} Facebook buyer-intent search`,
      cadence,
      paused: false,
      queries: activeScheduleQueries.slice(0, 10),
    };
    setSchedules((current) => [nextSchedule, ...current]);
    addLog(`Schedule created: ${cadence}. Runs require Facebook API permissions or manual extension use.`);
  }

  function toggleSchedule(id: string) {
    setSchedules((current) => current.map((schedule) => schedule.id === id ? { ...schedule, paused: !schedule.paused } : schedule));
    addLog("Schedule pause/resume changed.");
  }

  function deleteSchedule(id: string) {
    setSchedules((current) => current.filter((schedule) => schedule.id !== id));
    addLog("Schedule deleted.");
  }

  async function sendHighIntentPreviews() {
    const sendable = previewLeads.filter((lead) => shouldSendFacebookLead(lead, sentSignatures));
    if (!sendable.length) {
      addLog("No High Intent preview leads passed filters for sending.");
      return;
    }

    const response = await fetch("/api/facebook-radar/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        posts: sendable.map((lead) => ({
          text: lead.snippet,
          sourceName: lead.groupName,
          comments: lead.intentRank,
          url: lead.url,
        })),
        searchPhrase: activeCustomSearchTerm || "manual high-intent preview",
        targetBuyer: activeTargetBuyer,
        painKeywords: activePainKeywords,
      }),
    });

    if (!response.ok) {
      addLog(`Send failed: API returned ${response.status}.`);
      return;
    }

    setSentLeads((current) => [...sendable, ...current].filter((lead, index, array) => array.findIndex((item) => item.id === lead.id) === index));
    addLog(`Sent ${sendable.length} High Intent lead(s) to MarketVibe.`);
  }

  function nextSearch() {
    setCurrentSearchIndex((value) => Math.min(value + 1, Math.max(availableSearchLinks.length - 1, 0)));
  }

  function previousSearch() {
    setCurrentSearchIndex((value) => Math.max(value - 1, 0));
  }

  return (
    <main className="min-h-screen bg-[#050b16] pb-28 text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,#10b98135,transparent_24rem),radial-gradient(circle_at_82%_20%,#2563eb30,transparent_26rem),linear-gradient(135deg,#06111f_0%,#071827_46%,#030712_100%)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/8 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Radar className="h-4 w-4 text-emerald-300" /> Facebook Lead Radar
            </p>
            <p className="mx-auto mt-3 inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-100">
              INTERNAL TOOL · DIRECT LINK ONLY
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Internal Growth Tool</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Find Facebook search angles, analyze pasted posts, and manually engage where buyers ask for clients, leads, traffic, websites, SEO, ecommerce, or automation help.
            </p>
            <p className="mx-auto mt-3 max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-50">
              No auto-posting. No scraping. Manual engagement only.
            </p>
          </div>

          <div className="mt-8 rounded-[2rem] border border-white/15 bg-slate-950/85 p-4 shadow-2xl shadow-black/35 ring-1 ring-white/10 backdrop-blur">
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              {[
                ["find", "Find Facebook Posts"],
                ["analyze", "Analyze Pasted Post"],
                ["welcome", "Group Welcome"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value as ToolMode)}
                  className={`rounded-full border px-4 py-3 text-sm font-bold transition ${
                    mode === value ? "border-cyan-200 bg-cyan-200 text-slate-950" : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Target buyer
                <textarea value={targetBuyer} onChange={(event) => setTargetBuyer(event.target.value)} rows={2} className="min-h-20 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Niche
                <textarea value={niche} onChange={(event) => setNiche(event.target.value)} rows={2} className="min-h-20 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Pain keywords
                <textarea value={painKeywords} onChange={(event) => setPainKeywords(event.target.value)} rows={2} className="min-h-20 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
              </label>
            </div>

            <div className="mt-3 grid gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 md:grid-cols-[1fr_auto] md:items-end">
              <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                Custom Search Term
                <input
                  value={customSearchTerm}
                  onBlur={() => setCustomSearchTerm((value) => normalizeCustomSearchTerm(value))}
                  onChange={(event) => setCustomSearchTerm(event.target.value)}
                  placeholder="etsy listing removed, shopify product page no sales, agency owner struggling to get clients"
                  className="rounded-2xl border border-cyan-200/20 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-200/60"
                />
              </label>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white">{modeText}</span>
            </div>

            {mode === "analyze" && (
              <>
                <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-200">
                  Group, page, post, or Facebook search URL
                  <span className="flex flex-col gap-2 sm:flex-row">
                    <input value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setLinkNotice(""); }} placeholder="Paste a Facebook URL, or leave blank to open Facebook search from your inputs" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
                    <button type="button" onClick={clearSourceUrl} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15">Clear link</button>
                  </span>
                </label>
                {linkNotice && <p className="mt-2 text-sm font-semibold text-amber-200">{linkNotice}</p>}
                <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-200">
                  Manual paste area
                  <textarea value={postText} onChange={(event) => setPostText(event.target.value)} rows={7} placeholder="Paste Facebook post text here. Public or permitted posts only; do not paste private group content you are not allowed to use." className="min-h-44 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
                </label>
                <button onClick={analyze} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-6 py-4 text-base font-bold text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:brightness-105">
                  <Search className="h-5 w-5" /> Analyze Manual Post
                </button>
              </>
            )}
            {mode === "welcome" && (
              <>
                <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-200">
                  Group or welcome thread link
                  <span className="flex flex-col gap-2 sm:flex-row">
                    <input value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setLinkNotice(""); }} placeholder="Paste the public group, post, or profile URL" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
                    <button type="button" onClick={clearSourceUrl} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15">Clear link</button>
                  </span>
                </label>
                {linkNotice && <p className="mt-2 text-sm font-semibold text-amber-200">{linkNotice}</p>}
                <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-200">
                  Welcome/new-member text
                  <textarea value={postText} onChange={(event) => setPostText(event.target.value)} rows={7} placeholder="Paste permitted welcome/new-member posts or intro text. Keep private group rules and platform rules in mind." className="min-h-44 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
                </label>
                <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
                  Facebook welcome outreach must follow platform rules and group rules. This mode prepares manual drafts only; confirm context before posting or sending anything.
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Mode</p>
            <p className="mt-2 text-2xl font-semibold text-white">{mode === "find" ? "Find" : mode === "welcome" ? "Welcome" : "Analyze"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{mode === "find" ? "Good" : "Done"}</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{mode === "find" ? searched.length : doneCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Bad / Skipped</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">{mode === "find" ? skippedSearches.length : skippedCount}</p>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.05] p-2">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTab === tab ? "bg-cyan-200 text-slate-950" : "text-slate-200 hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Presets" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Buyer Intent Query Library</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Search presets</h2>
              </div>
              <button onClick={saveSearchPreset} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">Save current preset</button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-bold text-cyan-100">Built-in buyer-intent queries</p>
                <div className="mt-3 grid gap-2">
                  {BUYER_INTENT_QUERY_LIBRARY.map((query) => (
                    <div key={query} className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100">{query}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-bold text-cyan-100">Custom queries</p>
                <div className="mt-3 flex gap-2">
                  <input value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} placeholder="Add a buyer-intent query" className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
                  <button onClick={addCustomQuery} className="rounded-full bg-emerald-300 px-4 py-3 text-sm font-bold text-slate-950">Add</button>
                </div>
                <div className="mt-3 grid gap-2">
                  {customQueries.length ? customQueries.map((query) => (
                    <div key={query} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100">
                      <span className="min-w-0 break-words">{query}</span>
                      <button onClick={() => deleteCustomQuery(query)} className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white">Delete</button>
                    </div>
                  )) : <p className="text-sm text-slate-400">No custom queries yet.</p>}
                </div>
                <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                  <p className="text-sm font-bold text-cyan-100">Saved presets</p>
                  {savedPresets.length ? savedPresets.map((preset) => (
                    <p key={preset.name} className="mt-2 text-sm text-slate-200">{preset.name}: {preset.queries.length} queries</p>
                  )) : <p className="mt-2 text-sm text-slate-400">Save a preset when this query mix performs well.</p>}
                </div>
                <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <p className="text-sm font-bold text-amber-100">Scheduled searches</p>
                  <p className="mt-2 text-sm leading-6 text-amber-50">Schedules are automation-ready. Actual background Facebook API searches require approved Facebook permissions; otherwise use the extension/manual workflow.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["every 3h", "every 6h", "every 12h", "daily"] as FacebookRadarSchedule["cadence"][]).map((cadence) => (
                      <button key={cadence} onClick={() => addSchedule(cadence)} className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-50">{cadence}</button>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-sm text-slate-100">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>{schedule.name} · {schedule.paused ? "Paused" : "Active"}</span>
                          <span className="flex gap-2">
                            <button onClick={() => toggleSchedule(schedule.id)} className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold">{schedule.paused ? "Resume" : "Pause"}</button>
                            <button onClick={() => deleteSchedule(schedule.id)} className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold">Delete</button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Results" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Preview before sending</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Filtered High Intent Leads</h2>
              </div>
              <button onClick={sendHighIntentPreviews} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">Send Visible High-Intent Posts to MarketVibe</button>
            </div>
            <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">Facebook data may be unavailable because of permissions, group privacy, region restrictions, or rate limits. This tool does not bypass those limits.</p>
            <div className="mt-5 grid gap-3">
              {previewLeads.length ? previewLeads.map((lead) => (
                <article key={lead.id} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClasses(lead.intentScore)}`}>{lead.intentScore} Intent · {lead.intentRank}/100</span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{lead.painPoint}</span>
                    {!lead.passedFilters && <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">Filtered</span>}
                  </div>
                  <p className="mt-3 text-sm text-slate-300"><strong className="text-white">Group:</strong> {lead.groupName} · {lead.groupSizeActivity}</p>
                  <p className="mt-2 text-sm text-slate-300"><strong className="text-white">Author:</strong> {lead.authorType} · <strong className="text-white">Category:</strong> {lead.businessCategory} · <strong className="text-white">Location:</strong> {lead.location}</p>
                  <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-sm leading-6 text-slate-100">{lead.snippet}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300"><strong className="text-white">Why it matched:</strong> {lead.reason}</p>
                  <p className="mt-2 text-sm text-amber-100">{lead.duplicateWarning}</p>
                  <p className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-50"><strong>Suggested reply:</strong> {lead.suggestedReply}</p>
                </article>
              )) : (
                <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-8 text-center text-slate-300">No results yet. Paste a Facebook post in Search → Analyze Pasted Post, or import visible posts with the browser extension.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Sent Leads" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <h2 className="text-2xl font-semibold text-white">Sent Leads</h2>
            <div className="mt-5 grid gap-3">
              {sentLeads.length ? sentLeads.map((lead) => (
                <a key={lead.id} href={lead.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-100 hover:bg-white/10">
                  {lead.intentScore} · {lead.painPoint} · {lead.snippet}
                </a>
              )) : <p className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-slate-300">No sent leads in this browser session yet.</p>}
            </div>
          </div>
        )}

        {activeTab === "Logs" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <h2 className="text-2xl font-semibold text-white">Logs and Analytics</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {[["Searches run", searched.length + skippedSearches.length], ["Posts found", previewLeads.length], ["High intent", previewLeads.filter((lead) => lead.intentScore === "High").length], ["Sent", sentLeads.length], ["Top pain", previewLeads[0]?.painPoint || "None"]].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-2 text-lg font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2">
              {logs.length ? logs.map((log) => <p key={log} className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">{log}</p>) : <p className="text-slate-400">No logs yet. Searches, skips, sends, and API limits will appear here.</p>}
            </div>
          </div>
        )}

        {activeTab === "Settings" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <h2 className="text-2xl font-semibold text-white">Filters and Safety</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-200">Posted within
                <select value={filters.postedWithin} onChange={(event) => setFilters((current) => ({ ...current, postedWithin: event.target.value as FacebookRadarFilters["postedWithin"] }))} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
                  {(["24h", "72h", "7d", "30d"] as FacebookRadarFilters["postedWithin"][]).map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">Language
                <input value={filters.language} onChange={(event) => setFilters((current) => ({ ...current, language: event.target.value }))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">Country/city/local filter
                <input value={filters.location} onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))} placeholder="Optional city or country" className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-slate-500" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">Minimum members
                <input type="number" value={filters.minimumMembers} onChange={(event) => setFilters((current) => ({ ...current, minimumMembers: Number(event.target.value) }))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">Minimum posts per day
                <input type="number" value={filters.minimumPostsPerDay} onChange={(event) => setFilters((current) => ({ ...current, minimumPostsPerDay: Number(event.target.value) }))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">Minimum reactions/comments
                <input type="number" value={filters.minimumEngagement} onChange={(event) => setFilters((current) => ({ ...current, minimumEngagement: Number(event.target.value) }))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white" />
              </label>
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm font-semibold text-slate-100">
              <input type="checkbox" checked={filters.publicGroupsOnly} onChange={(event) => setFilters((current) => ({ ...current, publicGroupsOnly: event.target.checked }))} />
              Public groups only
            </label>
            <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-200">Exclude keywords
              <textarea value={filters.excludeKeywords.join(", ")} onChange={(event) => setFilters((current) => ({ ...current, excludeKeywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} rows={3} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white" />
            </label>
            <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">Read-only discovery only. No auto-posting, no auto-messaging, no cookies/password/session collection, and no private group bypassing.</p>
          </div>
        )}

        {activeTab === "Search" && (mode === "find" ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Search queue</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Facebook post and group searches</h2>
                <p className="mt-1 text-sm font-semibold text-cyan-100">{modeText}{activeCustomSearchTerm ? `: ${activeCustomSearchTerm}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={resetSearches} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Reset</button>
                <button onClick={resetToDefaults} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/15">Reset to defaults</button>
              </div>
            </div>
            {resetNotice && (
              <p className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                {resetNotice}
              </p>
            )}
            <div className="mt-5 grid gap-3">
              {activeSearchLink ? (
                (() => {
                  const link = activeSearchLink;
                  return (
                <div key={link.phrase} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-lg font-semibold text-white">{link.phrase}</p>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
                      MarketVibe fit {link.fitScore}/100
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{link.reason}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Good if results contain</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-50">{link.goodSignals.join(", ")}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Skip if results contain</p>
                      <p className="mt-2 text-sm leading-6 text-amber-50">{link.skipSignals.join(", ")}</p>
                    </div>
                  </div>
                  <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-200">
                    Bad results? Try next search. If the first screen is mostly jobs, spam, or offers, mark searched/skip and move on.
                  </p>
                  <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-50">
                    Check first screen only. If mostly jobs/spam/offers, come back and press Skip.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button onClick={() => openSearch(link, link.postsUrl, "posts")} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-base font-bold text-slate-950 hover:bg-slate-100">
                      <ExternalLink className="h-5 w-5" /> Open Posts
                    </button>
                    <button onClick={() => openSearch(link, link.groupsUrl, "groups")} className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-4 text-base font-bold text-cyan-100 hover:bg-cyan-300/15">
                      <ExternalLink className="h-5 w-5" /> Open Groups
                    </button>
                    <button onClick={() => markBadNext(link)} className="rounded-full border border-white/15 bg-white/10 px-5 py-4 text-base font-bold text-white hover:bg-white/15">
                      <SkipForward className="mr-2 inline h-5 w-5" />Mark Bad / Next
                    </button>
                    <button onClick={() => markGoodAnalyze(link)} className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-4 text-base font-bold text-emerald-100 hover:bg-emerald-300/15">
                      <CheckCircle2 className="mr-2 inline h-5 w-5" />Mark Good / Analyze
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <button onClick={previousSearch} disabled={currentSearchIndex <= 0} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50">
                      Previous Search
                    </button>
                    <button onClick={nextSearch} disabled={currentSearchIndex >= availableSearchLinks.length - 1} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50">
                      Next Search
                    </button>
                    <button onClick={() => copyText(link.phrase, "Facebook Radar Copy Search Phrase")} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15">
                      <Copy className="mr-2 inline h-4 w-4" />Copy Search
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-400">Use Posts first to find leads. Use Groups only to find places to join.</p>
                </div>
                  );
                })()
              ) : (
                <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8 text-center text-amber-50">
                  All generated searches are marked. Reset or change the inputs for a fresh queue.
                </div>
              )}
            </div>
          </div>
        ) : mode === "welcome" ? (
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">Manual mode</span>
              <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">Confirmation required before send/post</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">Facebook group welcome outreach</h2>
            <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              Use only where you are allowed to participate. Do not auto-spam groups, mass-DM members, or bypass privacy settings.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-bold text-cyan-100">Possible welcome targets</p>
                <div className="mt-3 grid gap-2">
                  {welcomeTargets.length ? welcomeTargets.map((target) => (
                    <p key={target} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-sm leading-6 text-slate-100">{target}</p>
                  )) : <p className="text-sm text-slate-400">Paste welcome/new-member text above to identify targets.</p>}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <p className="text-sm font-bold text-emerald-100">Prepared manual message</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-emerald-50">{welcomeMessage}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button onClick={copyWelcomeMessage} className="rounded-full bg-white px-4 py-3 text-sm font-bold text-slate-950">Copy draft</button>
                  <button onClick={openReplyLink} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-100">Open reply link</button>
                </div>
              </div>
            </div>
          </article>
        ) : result ? (
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses(result.score)}`}>MarketVibe fit: {result.score}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClasses(result.risk)}`}>{result.risk} risk</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">{result.action}</span>
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-200">{result.intent}</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300"><strong className="text-slate-100">Why this is/isn&apos;t worth replying:</strong> {result.reason}</p>
            <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                <ShieldCheck className="h-4 w-4" /> {replyMode === "quick" ? "Quick Reply" : "Deeper Reply"}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["quick", "deeper"] as ReplyMode[]).map((replyOption) => (
                  <button
                    key={replyOption}
                    type="button"
                    onClick={() => setReplyMode(replyOption)}
                    disabled={replyOption === "deeper" && !result.deeperReply}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                      replyMode === replyOption ? "border-cyan-200 bg-cyan-200 text-slate-950" : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                    }`}
                  >
                    {replyOption === "quick" ? "Quick Reply" : "Deeper Reply"}
                  </button>
                ))}
              </div>
              <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-100">{selectedReply}</p>
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                  <p><strong>Manual note:</strong> {result.manualNote}</p>
                </div>
              </div>
            </div>
            <button onClick={copyAndOpen} disabled={!selectedReply || result.action === "Skip"} className="mt-5 flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-5 text-lg font-bold text-slate-950 shadow-xl transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
              <Copy className="h-5 w-5" /> {copied ? "Copied - Facebook opened" : "Copy + Open Facebook"} <ExternalLink className="h-5 w-5" />
            </button>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button onClick={copyReply} disabled={!selectedReply || result.action === "Skip"} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60">Copy Only</button>
              <button onClick={markDone} className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/15"><CheckCircle2 className="mr-2 inline h-4 w-4" />Mark Done</button>
              <button onClick={skip} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"><SkipForward className="mr-2 inline h-4 w-4" />Skip</button>
            </div>
          </article>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
            <Radar className="mx-auto h-10 w-10 text-cyan-200" />
            <h2 className="mt-4 text-3xl font-semibold text-white">Paste a Facebook post to analyze</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">Facebook Lead Radar does not scrape groups or auto-post. It helps you decide whether a permitted post is worth a manual, helpful reply.</p>
          </div>
        ))}

        {copied && <p className="mt-4 text-center text-sm font-semibold text-emerald-300">Copied.</p>}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 truncate text-sm font-semibold text-slate-200">
            {mode === "find" ? activeSearchLink?.phrase || "Search queue complete" : mode === "welcome" ? "Manual welcome mode - confirm before any send/post" : "Back to Radar / Next Search"}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button onClick={() => { setMode("find"); setActiveTab("Search"); }} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15">
              Back to Radar
            </button>
            <button onClick={() => { setMode("find"); setActiveTab("Search"); nextSearch(); }} disabled={!activeSearchLink} className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100 hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-50">
              Next Search
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

