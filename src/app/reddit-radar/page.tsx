"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MessageSquareText,
  Play,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";

type Opportunity = {
  subreddit: string;
  title: string;
  url: string;
  niche: string;
  target: string;
  score: "High" | "Medium" | "Low";
  risk: "Low" | "Medium" | "High";
  reason: string;
  suggestedReply: string;
};

const starterOpportunities: Opportunity[] = [
  {
    subreddit: "r/DigitalMarketing",
    title: "Worth starting a marketing agency in 2026?",
    url: "https://www.reddit.com/r/DigitalMarketing/",
    niche: "agency growth",
    target: "freelancers and agencies",
    score: "High",
    risk: "Low",
    reason: "Sample fallback: people are discussing customer acquisition and positioning.",
    suggestedReply:
      "I think the agency model still works, but only when the offer is very specific. Broad 'I do marketing' feels hard to sell now. Something like lead generation for one niche or fixing one clear revenue problem is easier to trust and easier to explain.",
  },
  {
    subreddit: "r/MarketingHelp",
    title: "I barely understand Reddit marketing",
    url: "https://www.reddit.com/r/MarketingHelp/",
    niche: "reddit marketing",
    target: "brands and agencies",
    score: "High",
    risk: "Low",
    reason: "Sample fallback: the post asks how brands can join conversations without looking fake.",
    suggestedReply:
      "From what I am seeing, Reddit rewards people who sound like they belong in the conversation and punishes anything that feels like marketing. The safer play is to comment usefully for weeks, learn the language of each niche, and let people check your profile naturally instead of forcing links into posts.",
  },
];

const filters = ["All", "High", "Medium", "Low"];
const WAIT_SECONDS = 180;

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

export default function RedditRadarPage() {
  const [niche, setNiche] = useState("AI tools for ecommerce");
  const [customer, setCustomer] = useState("Shopify owners, agencies, freelancers");
  const [keywords, setKeywords] = useState("customers, Reddit marketing, Shopify traffic, automation");
  const [activeFilter, setActiveFilter] = useState("All");
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);
  const [doneTitles, setDoneTitles] = useState<string[]>([]);
  const [skippedTitles, setSkippedTitles] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(starterOpportunities);
  const [source, setSource] = useState<"live" | "fallback" | "sample">("sample");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to search live Reddit posts.");
  const [queueMode, setQueueMode] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [waitSeconds, setWaitSeconds] = useState(0);

  async function loadOpportunities() {
    setLoading(true);
    setStatus("Searching live Reddit conversations...");

    try {
      const params = new URLSearchParams({ niche, target: customer, keywords });
      const response = await fetch(`/api/reddit-radar?${params.toString()}`);
      const data = await response.json();
      const nextOpportunities = data.opportunities?.length ? data.opportunities : starterOpportunities;
      setOpportunities(nextOpportunities);
      setQueueIndex(0);
      setDoneTitles([]);
      setSkippedTitles([]);
      setSource(data.source === "live" ? "live" : "fallback");
      setStatus(data.source === "live" ? "Live Reddit opportunities loaded." : "Live search was limited, showing fallback opportunities.");
    } catch {
      setOpportunities(starterOpportunities);
      setQueueIndex(0);
      setSource("fallback");
      setStatus("Could not load live search, showing fallback opportunities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (waitSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setWaitSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [waitSeconds]);

  const visibleOpportunities = useMemo(() => {
    if (activeFilter === "All") return opportunities;
    return opportunities.filter((item) => item.score === activeFilter);
  }, [activeFilter, opportunities]);

  const activeQueue = useMemo(() => {
    return visibleOpportunities.filter((item) => !doneTitles.includes(item.title) && !skippedTitles.includes(item.title));
  }, [visibleOpportunities, doneTitles, skippedTitles]);

  const currentQueueItem = activeQueue[Math.min(queueIndex, Math.max(activeQueue.length - 1, 0))];

  async function copyReply(item: Opportunity) {
    await navigator.clipboard.writeText(item.suggestedReply);
    setCopiedTitle(item.title);
    window.setTimeout(() => setCopiedTitle(null), 1600);
  }

  function openReddit(item: Opportunity) {
    window.open(item.url, "_blank", "noopener,noreferrer");
  }

  async function copyAndOpen(item: Opportunity) {
    await copyReply(item);
    openReddit(item);
    setWaitSeconds(WAIT_SECONDS);
  }

  function markDone(title: string) {
    setDoneTitles((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
    setQueueIndex(0);
    setWaitSeconds(WAIT_SECONDS);
  }

  function skipItem(title: string) {
    setSkippedTitles((current) => current.includes(title) ? current : [...current, title]);
    setQueueIndex(0);
  }

  function clearProgress() {
    setDoneTitles([]);
    setSkippedTitles([]);
    setQueueIndex(0);
    setWaitSeconds(0);
  }

  function OpportunityCard({ item }: { item: Opportunity }) {
    const done = doneTitles.includes(item.title);
    const skipped = skippedTitles.includes(item.title);

    return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/10">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-200">{item.subreddit}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses(item.score)}`}>Opportunity: {item.score}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClasses(item.risk)}`}>Risk: {item.risk}</span>
              {done && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Done</span>}
              {skipped && <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/20 bg-slate-300/10 px-3 py-1 text-xs font-semibold text-slate-200">Skipped</span>}
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300"><strong className="text-slate-100">Reason:</strong> {item.reason}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <Target className="h-5 w-5 text-emerald-300" />
                <p className="mt-3 text-xs text-slate-400">Target</p>
                <p className="mt-1 text-sm font-semibold text-white">{item.target}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <Search className="h-5 w-5 text-cyan-200" />
                <p className="mt-3 text-xs text-slate-400">Niche match</p>
                <p className="mt-1 text-sm font-semibold text-white">{item.niche}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
              <MessageSquareText className="h-4 w-4" /> Suggested reply
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-200">{item.suggestedReply}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button onClick={() => copyReply(item)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                <Copy className="h-4 w-4" /> {copiedTitle === item.title ? "Copied" : "Copy Reply"}
              </button>
              <button onClick={() => copyAndOpen(item)} className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15">
                <ExternalLink className="h-4 w-4" /> Copy + Open
              </button>
              <button onClick={() => markDone(item.title)} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/15">
                <CheckCircle2 className="h-4 w-4" /> {done ? "Undo Done" : "Mark Done"}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,#10b98135,transparent_24rem),radial-gradient(circle_at_82%_20%,#06b6d42e,transparent_26rem),linear-gradient(135deg,#06111f_0%,#071827_46%,#030712_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050b16] to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/8 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Radar className="h-4 w-4 text-emerald-300" /> Live Reddit Radar
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.6rem] lg:leading-[1.02]">
              Find live Reddit conversations worth joining.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Search fresh Reddit discussions, use queue mode, and work through replies without losing your place.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#opportunities" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:brightness-105">
                Review Opportunities <ArrowRight className="h-4 w-4" />
              </a>
              <button onClick={() => setQueueMode(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-lg shadow-black/15 backdrop-blur transition hover:bg-emerald-300/15">
                <Play className="h-4 w-4" /> Start Queue Mode
              </button>
              <Link href="/lead-search" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 backdrop-blur transition hover:bg-white/15">
                Back to Lead Search
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-slate-950/85 p-4 shadow-2xl shadow-black/35 ring-1 ring-white/10 backdrop-blur">
            <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,#22d3ee22,transparent_15rem),#08111f] p-5">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Opportunity setup</p>
                  <h2 className="mt-2 text-xl font-semibold">Human approval workflow</h2>
                </div>
                <ShieldCheck className="h-7 w-7 text-emerald-300" />
              </div>
              <div className="mt-5 grid gap-3">
                <label className="grid gap-2 text-sm font-semibold text-slate-200">
                  Business / niche
                  <input value={niche} onChange={(event) => setNiche(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-300/40" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-200">
                  Target customer
                  <input value={customer} onChange={(event) => setCustomer(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-300/40" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-200">
                  Keywords
                  <input value={keywords} onChange={(event) => setKeywords(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-300/40" />
                </label>
                <button onClick={loadOpportunities} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Search Live Posts
                </button>
              </div>
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                  <p>No auto-posting. Queue mode keeps MarketVibe open while Reddit opens in a new tab.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {queueMode && (
        <section className="sticky top-[73px] z-30 border-b border-cyan-300/20 bg-[#06111f]/95 px-4 py-4 shadow-2xl shadow-black/25 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Queue Mode</p>
                <p className="mt-1 text-sm text-slate-300">{activeQueue.length} opportunities left · {doneTitles.length} done · {skippedTitles.length} skipped</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setQueueMode(false)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Close Queue</button>
                <button onClick={clearProgress} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Reset</button>
              </div>
            </div>

            {currentQueueItem ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-200">{currentQueueItem.subreddit}</span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses(currentQueueItem.score)}`}>Opportunity: {currentQueueItem.score}</span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClasses(currentQueueItem.risk)}`}>Risk: {currentQueueItem.risk}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-white">{currentQueueItem.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{currentQueueItem.reason}</p>
                  <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-50">
                    <TimerReset className="h-4 w-4" /> {waitSeconds > 0 ? `Wait ${formatTimer(waitSeconds)} before next Reddit comment` : "Safe to copy and open the next post"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Reply to paste</p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{currentQueueItem.suggestedReply}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button onClick={() => copyAndOpen(currentQueueItem)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-100">
                      <Copy className="h-4 w-4" /> Copy + Open Reddit
                    </button>
                    <button onClick={() => markDone(currentQueueItem.title)} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/15">
                      <CheckCircle2 className="h-4 w-4" /> Mark Posted
                    </button>
                    <button onClick={() => skipItem(currentQueueItem.title)} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15">
                      <SkipForward className="h-4 w-4" /> Skip
                    </button>
                    <button onClick={() => setQueueIndex((current) => Math.min(activeQueue.length - 1, current + 1))} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15">
                      Next Card
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-semibold text-emerald-100">Queue finished. Search live posts again for more opportunities.</div>
            )}
          </div>
        </section>
      )}

      <section id="opportunities" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Daily opportunity queue</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{source === "live" ? "Live Reddit opportunities" : "Fallback opportunities"}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{status}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setQueueMode(true)} className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-300/15">Start Queue</button>
            {filters.map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${activeFilter === filter ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10"}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          {visibleOpportunities.map((item) => (
            <OpportunityCard key={`${item.subreddit}-${item.title}`} item={item} />
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[linear-gradient(180deg,#07111f_0%,#050b16_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/15">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Monetization-ready beta</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Queue mode makes this easier to sell.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Users can work through live Reddit opportunities one by one, keep MarketVibe open, and avoid rapid posting with the built-in timer.</p>
              </div>
              <Sparkles className="h-8 w-8 text-cyan-200" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
