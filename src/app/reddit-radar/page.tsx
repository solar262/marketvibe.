"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  SkipForward,
} from "lucide-react";

type Opportunity = {
  subreddit: string;
  title: string;
  url: string;
  niche: string;
  target: string;
  score: "High" | "Medium" | "Low";
  risk: "Low" | "Medium" | "High";
  action?: "Reply" | "ManualOnly" | "Skip";
  reason: string;
  suggestedReply: string;
};

type SourceState = "idle" | "live" | "empty" | "error";

const WAIT_SECONDS = 180;
const SEEN_POSTS_KEY = "marketvibe-reddit-radar-seen-posts";
const MAX_SEEN_POSTS = 250;
const EMPTY_SEARCH_MESSAGE =
  "No strong Reddit opportunities found right now. Try broader pain terms like need help, struggling, no traffic, not converting, or looking for tool.";
const SEARCH_STEPS = [
  "Searching Reddit...",
  "Checking source 1 of 5",
  "Checking source 2 of 5",
  "Checking source 3 of 5",
  "Checking source 4 of 5",
  "Checking source 5 of 5",
  "Filtering weak posts",
  "Scoring opportunities",
];

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

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function postKey(item: Opportunity) {
  return item.url || `${item.subreddit}-${item.title}`;
}

function readSeenPosts() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const saved = window.localStorage.getItem(SEEN_POSTS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeSeenPosts(keys: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_POSTS_KEY, JSON.stringify(keys.slice(-MAX_SEEN_POSTS)));
}

function safeMetric(value: string) {
  return value.replace(/[^a-zA-Z0-9\s,.-]/g, "").slice(0, 80) || "blank";
}

function humanizeReply(reply: string) {
  const exactMatch: Record<string, string> = {
    "I would start with the workflow before the tools. Where are the people, what are they already complaining about, and what useful answer can you add? Once that is clear, the tool choice matters a lot less.":
      "I’d probably start with the workflow before the tools.\n\nWhere are the people, what are they already complaining about, and what useful answer can you add?\n\nOnce that’s clear, the actual tool matters a lot less.",
    "The offer matters more than the platform. A broad service is easy to ignore, but one clear result for one type of customer is much easier to understand and trust.":
      "I think the offer matters more than the platform.\n\nA broad service is easy to ignore. One clear result for one type of customer is much easier to understand and trust.",
    "Reddit feels different because people can sense a funnel quickly. I would use it as research first, comment normally, and only mention something when it genuinely fits the discussion.":
      "Reddit feels different because people can spot a funnel fast.\n\nI’d use it for research first, comment normally, and only mention something when it actually fits the thread.",
    "For ecommerce, I think the content has to start with the problem, not the product. People need to understand why it matters before they care about the store.":
      "For ecommerce, I think the content has to start with the problem, not the product.\n\nPeople usually need to understand why it matters before they care about the store.",
  };

  if (exactMatch[reply]) return exactMatch[reply];

  return reply
    .replace(/^I would /, "I’d ")
    .replace(/I would /g, "I’d ")
    .replace(/Once that is clear/g, "Once that’s clear")
    .replace(/actual tool choice/g, "actual tool")
    .replace(/trying to turn it into a pitch/g, "turning it into a pitch")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join("\n\n");
}

export default function RedditRadarPage() {
  const [niche, setNiche] = useState("AI tools for ecommerce");
  const [customer, setCustomer] = useState("Shopify owners, agencies, freelancers");
  const [keywords, setKeywords] = useState("customers, Reddit marketing, Shopify traffic, automation");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [source, setSource] = useState<SourceState>("idle");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [status, setStatus] = useState("Press Search to load live Reddit posts.");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [postedTitles, setPostedTitles] = useState<string[]>([]);
  const [skippedTitles, setSkippedTitles] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);

  async function loadOpportunities() {
    setLoading(true);
    setLoadingStep(0);
    setSource("idle");
    const progressTimer = window.setInterval(() => {
      setLoadingStep((current) => Math.min(current + 1, SEARCH_STEPS.length - 1));
    }, 900);

    try {
      const params = new URLSearchParams({ niche, target: customer, keywords });
      const response = await fetch(`/api/reddit-radar?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      const fetchedOpportunities: Opportunity[] = Array.isArray(data.opportunities) ? data.opportunities : [];
      const seenPosts = readSeenPosts();
      const nextOpportunities = fetchedOpportunities.filter((item) => !seenPosts.includes(postKey(item)));
      const hiddenSeenCount = fetchedOpportunities.length - nextOpportunities.length;
      const nextSource = data.source === "live" ? "live" : data.source === "error" ? "error" : "empty";

      setOpportunities(nextOpportunities);
      setSource(nextSource);
      setLoadingStep(SEARCH_STEPS.length - 1);
      const baseStatus = data.message || "Live Reddit opportunities loaded.";
      const finalStatus = nextOpportunities.length
        ? hiddenSeenCount > 0
          ? `${baseStatus} Hid ${hiddenSeenCount} posts already shown before.`
          : baseStatus
        : EMPTY_SEARCH_MESSAGE;
      setStatus(finalStatus);
      setCurrentIndex(0);
      setPostedTitles([]);
      setSkippedTitles([]);
      setCopied(false);
      setWaitSeconds(0);

      track("Reddit Radar Search", {
        source: nextSource,
        niche: safeMetric(niche),
        customer: safeMetric(customer),
        keywords: safeMetric(keywords),
        results: nextOpportunities.length,
        fetched: fetchedOpportunities.length,
        hidden_seen: hiddenSeenCount,
      });
    } catch {
      setOpportunities([]);
      setSource("error");
      setStatus(EMPTY_SEARCH_MESSAGE);
      track("Reddit Radar Search Error", {
        niche: safeMetric(niche),
        customer: safeMetric(customer),
        keywords: safeMetric(keywords),
      });
    } finally {
      window.clearInterval(progressTimer);
      setLoading(false);
      setLoadingStep(0);
    }
  }

  useEffect(() => {
    track("Reddit Radar Visit", { page: "reddit-radar" });
    const timer = window.setTimeout(() => {
      loadOpportunities();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (waitSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setWaitSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [waitSeconds]);

  const activeQueue = useMemo(() => {
    return opportunities.filter((item) => !postedTitles.includes(item.title) && !skippedTitles.includes(item.title));
  }, [opportunities, postedTitles, skippedTitles]);

  const currentItem = activeQueue[Math.min(currentIndex, Math.max(activeQueue.length - 1, 0))];
  const humanReply = currentItem ? humanizeReply(currentItem.suggestedReply) : "";
  const totalDone = postedTitles.length + skippedTitles.length;
  const totalCount = opportunities.length;

  function rememberPost(item: Opportunity) {
    const key = postKey(item);
    const current = readSeenPosts().filter((savedKey) => savedKey !== key);
    writeSeenPosts([...current, key]);
  }

  async function copyReply() {
    if (!currentItem) return;
    await navigator.clipboard.writeText(humanReply);
    track("Reddit Radar Copy Reply", {
      subreddit: currentItem.subreddit,
      score: currentItem.score,
      risk: currentItem.risk,
      action: currentItem.action || "none",
    });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function copyAndOpen() {
    if (!currentItem) return;
    await navigator.clipboard.writeText(humanReply);
    rememberPost(currentItem);
    track("Reddit Radar Copy And Open", {
      subreddit: currentItem.subreddit,
      score: currentItem.score,
      risk: currentItem.risk,
      action: currentItem.action || "none",
    });
    setCopied(true);
    window.open(currentItem.url, "_blank", "noopener,noreferrer");
    setWaitSeconds(WAIT_SECONDS);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function markPosted() {
    if (!currentItem) return;
    rememberPost(currentItem);
    track("Reddit Radar Mark Posted", {
      subreddit: currentItem.subreddit,
      score: currentItem.score,
      risk: currentItem.risk,
      action: currentItem.action || "none",
    });
    setPostedTitles((current) => current.includes(currentItem.title) ? current : [...current, currentItem.title]);
    setCurrentIndex(0);
    setWaitSeconds(WAIT_SECONDS);
  }

  function skip() {
    if (!currentItem) return;
    rememberPost(currentItem);
    track("Reddit Radar Skip", {
      subreddit: currentItem.subreddit,
      score: currentItem.score,
      risk: currentItem.risk,
      action: currentItem.action || "none",
    });
    setSkippedTitles((current) => current.includes(currentItem.title) ? current : [...current, currentItem.title]);
    setCurrentIndex(0);
  }

  function resetProgress() {
    track("Reddit Radar Reset Progress", { results: opportunities.length });
    setPostedTitles([]);
    setSkippedTitles([]);
    setCurrentIndex(0);
    setWaitSeconds(0);
  }

  function clearSeenPosts() {
    writeSeenPosts([]);
    track("Reddit Radar Clear Seen", {});
    setStatus("Seen post history cleared. Search again to allow older results.");
  }

  const sourceLabel = loading ? "Searching" : source === "live" ? "Live Reddit posts" : source === "error" ? "Search complete" : source === "empty" ? "Search complete" : "Ready";
  const visibleStatus = loading ? SEARCH_STEPS[loadingStep] : status;
  const progressPercent = loading ? Math.max(16, Math.round(((loadingStep + 1) / SEARCH_STEPS.length) * 100)) : 100;

  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,#10b98135,transparent_24rem),radial-gradient(circle_at_82%_20%,#06b6d42e,transparent_26rem),linear-gradient(135deg,#06111f_0%,#071827_46%,#030712_100%)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/8 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Radar className="h-4 w-4 text-emerald-300" /> Simple Reddit Radar
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">One post at a time.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Search Reddit, copy the reply, open the post, mark it done, then move to the next one.
            </p>
          </div>

          <div className="mt-8 rounded-[2rem] border border-white/15 bg-slate-950/85 p-4 shadow-2xl shadow-black/35 ring-1 ring-white/10 backdrop-blur">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Niche
                <input value={niche} onChange={(event) => setNiche(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Customer
                <input value={customer} onChange={(event) => setCustomer(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-200">
                Keywords
                <input value={keywords} onChange={(event) => setKeywords(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40" />
              </label>
            </div>
            <button onClick={loadOpportunities} disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-6 py-4 text-base font-bold text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />} Search Live Posts
            </button>
            <div className="mt-4 min-h-[82px] rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-300" /> : <Radar className="h-4 w-4 shrink-0 text-cyan-200" />}
                  <span className="min-w-0 break-words font-semibold text-slate-100">{visibleStatus}</span>
                </div>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{loading ? "Live" : "Ready"}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-200 transition-all duration-500 ${loading ? "animate-pulse" : ""}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Progress</p>
            <p className="mt-2 text-2xl font-semibold text-white">{totalCount ? Math.min(totalDone + 1, totalCount) : 0}/{totalCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Posted</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{postedTitles.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Timer</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">{waitSeconds > 0 ? formatTimer(waitSeconds) : "Ready"}</p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
          <span>{sourceLabel} · {visibleStatus}</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={clearSeenPosts} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Clear Seen</button>
            <button onClick={resetProgress} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Reset</button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-8 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-cyan-100">
              <Loader2 className="h-6 w-6 animate-spin" />
              <div>
                <h2 className="text-2xl font-semibold text-white">Searching live Reddit sources</h2>
                <p className="mt-1 text-sm text-slate-300">{visibleStatus}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-white/15" />
                  <div className="mt-4 h-4 w-4/5 animate-pulse rounded-full bg-white/10" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        ) : currentItem ? (
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-200">{currentItem.subreddit}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses(currentItem.score)}`}>{currentItem.score} opportunity</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClasses(currentItem.risk)}`}>{currentItem.risk} risk</span>
              {currentItem.action && <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">{currentItem.action}</span>}
            </div>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">{currentItem.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300"><strong className="text-slate-100">Why this post:</strong> {currentItem.reason}</p>

            <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                <ShieldCheck className="h-4 w-4" /> Reply to paste
              </div>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-100">{humanReply}</p>
            </div>

            <button onClick={copyAndOpen} className="mt-5 flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-5 text-lg font-bold text-slate-950 shadow-xl transition hover:bg-slate-100">
              <Copy className="h-5 w-5" /> {copied ? "Copied — Reddit opened" : "Copy + Open Reddit"} <ExternalLink className="h-5 w-5" />
            </button>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button onClick={copyReply} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15">Copy Only</button>
              <button onClick={markPosted} className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/15"><CheckCircle2 className="mr-2 inline h-4 w-4" />Mark Posted</button>
              <button onClick={skip} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"><SkipForward className="mr-2 inline h-4 w-4" />Skip</button>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                <p>{waitSeconds > 0 ? `Wait ${formatTimer(waitSeconds)} before the next Reddit comment.` : "Do not rapid-post. Copy, post manually on Reddit, then come back and mark posted."}</p>
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-8 text-center">
            <RefreshCw className="mx-auto h-10 w-10 text-amber-200" />
            <h2 className="mt-4 text-3xl font-semibold text-white">No strong Reddit opportunities found right now</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">{EMPTY_SEARCH_MESSAGE}</p>
            <button onClick={loadOpportunities} disabled={loading} className="mt-5 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">Search Again</button>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <p className="text-sm font-semibold text-emerald-300">Simple workflow</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {["1. Search", "2. Copy + Open", "3. Post manually", "4. Mark Posted"].map((step) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm font-semibold text-slate-100">{step}</div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
