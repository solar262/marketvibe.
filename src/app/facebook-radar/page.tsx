"use client";

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, Radar, Search, ShieldCheck, SkipForward } from "lucide-react";
import { analyzeFacebookLead, generateFacebookSearchLinks, type FacebookRadarResult, type FacebookRadarSearchLink } from "@/lib/facebook-radar";

type ReplyMode = "quick" | "deeper";
type ToolMode = "find" | "analyze";

const DEFAULT_BUYER = "web designers, SEO freelancers, local marketers, small agencies";
const DEFAULT_NICHE = "web design, SEO, local marketing agencies";
const DEFAULT_PAIN = "need clients, looking for leads, cold outreach not working, no customers";

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
  const [mode, setMode] = useState<ToolMode>("find");
  const [targetBuyer, setTargetBuyer] = useState(DEFAULT_BUYER);
  const [niche, setNiche] = useState(DEFAULT_NICHE);
  const [painKeywords, setPainKeywords] = useState(DEFAULT_PAIN);
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

  const searchLinks = useMemo(() => generateFacebookSearchLinks({ targetBuyer, niche, painKeywords }), [targetBuyer, niche, painKeywords]);
  const visibleSearchLinks = searchLinks.filter((link) => !searched.includes(link.phrase) && !skippedSearches.includes(link.phrase));
  const selectedReply = useMemo(() => {
    if (!result) return "";
    return replyMode === "deeper" && result.deeperReply ? result.deeperReply : result.quickReply;
  }, [replyMode, result]);

  function analyze() {
    const next = analyzeFacebookLead({ postText, targetBuyer, painKeywords, sourceUrl });
    setResult(next);
    setReplyMode("quick");
    setCopied(false);
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
    track("Facebook Radar Mark Search", { phrase: link.phrase });
  }

  function skipSearch(link: FacebookRadarSearchLink) {
    setSkippedSearches((current) => current.includes(link.phrase) ? current : [...current, link.phrase]);
    track("Facebook Radar Skip Search", { phrase: link.phrase });
  }

  function clearWorkflowState() {
    setSearched([]);
    setSkippedSearches([]);
    setDoneCount(0);
    setSkippedCount(0);
    setCopied(false);
    setResult(null);
    setReplyMode("quick");
  }

  function resetSearches() {
    clearWorkflowState();
    setResetNotice("Search queue reset.");
    track("Facebook Radar Reset Searches", {});
  }

  function resetToDefaults() {
    clearWorkflowState();
    setTargetBuyer(DEFAULT_BUYER);
    setNiche(DEFAULT_NICHE);
    setPainKeywords(DEFAULT_PAIN);
    setPostText("");
    setSourceUrl("");
    setResetNotice("Search queue reset.");
    track("Facebook Radar Reset Defaults", {});
  }

  function markDone() {
    setDoneCount((value) => value + 1);
    track("Facebook Radar Mark Done", { score: result?.score || "none" });
    setPostText("");
    setResult(null);
    setReplyMode("quick");
  }

  function skip() {
    setSkippedCount((value) => value + 1);
    track("Facebook Radar Skip", { score: result?.score || "none" });
    setResult(null);
    setReplyMode("quick");
  }

  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,#10b98135,transparent_24rem),radial-gradient(circle_at_82%_20%,#2563eb30,transparent_26rem),linear-gradient(135deg,#06111f_0%,#071827_46%,#030712_100%)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/8 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Radar className="h-4 w-4 text-emerald-300" /> Facebook Lead Radar
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
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {[
                ["find", "Find Facebook Posts"],
                ["analyze", "Analyze Pasted Post"],
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
                <input value={targetBuyer} onChange={(event) => setTargetBuyer(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Niche
                <input value={niche} onChange={(event) => setNiche(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Pain keywords
                <input value={painKeywords} onChange={(event) => setPainKeywords(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
              </label>
            </div>

            {mode === "analyze" && (
              <>
                <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-200">
                  Group, page, post, or Facebook search URL
                  <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="Paste a Facebook URL, or leave blank to open Facebook search from your inputs" className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
                </label>
                <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-200">
                  Manual paste area
                  <textarea value={postText} onChange={(event) => setPostText(event.target.value)} rows={7} placeholder="Paste Facebook post text here. Public or permitted posts only; do not paste private group content you are not allowed to use." className="min-h-44 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
                </label>
                <button onClick={analyze} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-6 py-4 text-base font-bold text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:brightness-105">
                  <Search className="h-5 w-5" /> Analyze Manual Post
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Mode</p>
            <p className="mt-2 text-2xl font-semibold text-white">{mode === "find" ? "Find" : "Analyze"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Done</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{mode === "find" ? searched.length : doneCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Skipped</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">{mode === "find" ? skippedSearches.length : skippedCount}</p>
          </div>
        </div>

        {mode === "find" ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Search queue</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Facebook post and group searches</h2>
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
              {visibleSearchLinks.map((link) => (
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
                  <div className="mt-4 grid gap-2 sm:grid-cols-5">
                    <a href={link.postsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100 sm:col-span-2">
                      <ExternalLink className="h-4 w-4" /> Posts
                    </a>
                    <a href={link.groupsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/15 sm:col-span-2">
                      <ExternalLink className="h-4 w-4" /> Groups
                    </a>
                    <button onClick={() => copyText(link.phrase, "Facebook Radar Copy Search Phrase")} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15">
                      <Copy className="mr-2 inline h-4 w-4" />Copy exact search
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button onClick={() => markSearch(link)} className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/15"><CheckCircle2 className="mr-2 inline h-4 w-4" />Mark searched</button>
                    <button onClick={() => skipSearch(link)} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"><SkipForward className="mr-2 inline h-4 w-4" />Skip</button>
                  </div>
                </div>
              ))}
              {!visibleSearchLinks.length && (
                <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8 text-center text-amber-50">
                  All generated searches are marked. Reset or change the inputs for a fresh queue.
                </div>
              )}
            </div>
          </div>
        ) : result ? (
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses(result.score)}`}>{result.score} opportunity</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClasses(result.risk)}`}>{result.risk} risk</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">{result.action}</span>
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-200">{result.intent}</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300"><strong className="text-slate-100">Why this post:</strong> {result.reason}</p>
            <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                <ShieldCheck className="h-4 w-4" /> Reply to paste
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
        )}

        {copied && <p className="mt-4 text-center text-sm font-semibold text-emerald-300">Copied.</p>}
      </section>
    </main>
  );
}
