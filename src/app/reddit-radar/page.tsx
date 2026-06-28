"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquareText,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
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

const sampleOpportunities: Opportunity[] = [
  {
    subreddit: "r/DigitalMarketing",
    title: "Worth starting a marketing agency in 2026?",
    url: "https://www.reddit.com/r/DigitalMarketing/",
    niche: "agency growth",
    target: "freelancers and agencies",
    score: "High",
    risk: "Low",
    reason: "People are discussing customer acquisition, positioning, and whether agencies still work.",
    suggestedReply:
      "I think the agency model still works, but only when the offer is very specific. Broad 'I do marketing' feels hard to sell now. Something like lead generation for one niche, automation for one type of business, or fixing one clear revenue problem is easier to trust and easier to explain.",
  },
  {
    subreddit: "r/MarketingHelp",
    title: "I barely understand Reddit marketing",
    url: "https://www.reddit.com/r/MarketingHelp/",
    niche: "reddit marketing",
    target: "brands and agencies",
    score: "High",
    risk: "Low",
    reason: "The post asks how brands can join Reddit conversations without looking fake or corporate.",
    suggestedReply:
      "From what I am seeing, Reddit rewards people who sound like they belong in the conversation and punishes anything that feels like marketing. The safer play is to comment usefully for weeks, learn the language of each niche, and let people check your profile naturally instead of forcing links into posts.",
  },
  {
    subreddit: "r/shopify",
    title: "How do I get traffic without paid ads?",
    url: "https://www.reddit.com/r/shopify/",
    niche: "shopify traffic",
    target: "store owners",
    score: "Medium",
    risk: "Medium",
    reason: "Good fit for ecommerce advice, but Shopify communities can be strict about promotion.",
    suggestedReply:
      "The easiest organic traffic mistake is posting product links too early. I would start with helpful content around the problem the product solves, then use Pinterest, short videos, Reddit comments, and comparison-style blog posts to create small traffic loops back to the store.",
  },
  {
    subreddit: "r/Entrepreneur",
    title: "Where do you find your first customers?",
    url: "https://www.reddit.com/r/Entrepreneur/",
    niche: "first customers",
    target: "founders",
    score: "Medium",
    risk: "Low",
    reason: "Good discussion for founders trying different acquisition channels.",
    suggestedReply:
      "The first customers usually come from conversations, not polished funnels. I would pick one narrow customer type, find where they complain online, reply with useful advice for a week, then only mention the product when it directly fits the problem.",
  },
];

const filters = ["All", "reddit marketing", "agency growth", "shopify traffic", "first customers"];

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

export default function RedditRadarPage() {
  const [niche, setNiche] = useState("AI tools for ecommerce");
  const [customer, setCustomer] = useState("Shopify owners, agencies, freelancers");
  const [keywords, setKeywords] = useState("customers, Reddit marketing, Shopify traffic, automation");
  const [activeFilter, setActiveFilter] = useState("All");
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);
  const [doneTitles, setDoneTitles] = useState<string[]>([]);

  const opportunities = useMemo(() => {
    if (activeFilter === "All") return sampleOpportunities;
    return sampleOpportunities.filter((item) => item.niche === activeFilter);
  }, [activeFilter]);

  async function copyReply(item: Opportunity) {
    await navigator.clipboard.writeText(item.suggestedReply);
    setCopiedTitle(item.title);
    window.setTimeout(() => setCopiedTitle(null), 1600);
  }

  function markDone(title: string) {
    setDoneTitles((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  }

  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,#10b98135,transparent_24rem),radial-gradient(circle_at_82%_20%,#06b6d42e,transparent_26rem),linear-gradient(135deg,#06111f_0%,#071827_46%,#030712_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050b16] to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/8 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Radar className="h-4 w-4 text-emerald-300" /> Reddit Radar Beta
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.6rem] lg:leading-[1.02]">
              Find Reddit conversations worth joining.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Spot live discussion opportunities, score the risk, and draft helpful replies that build trust before you ever promote a link.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#opportunities" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:brightness-105">
                Review Opportunities <ArrowRight className="h-4 w-4" />
              </a>
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
              </div>
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                  <p>No auto-posting. This beta uses sample data and keeps a human in the loop with Copy Reply + Open Reddit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="opportunities" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Daily opportunity queue</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Sample Reddit opportunities</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Use this to validate the workflow before adding live Reddit/search integration.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${activeFilter === filter ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10"}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          {opportunities.map((item) => {
            const done = doneTitles.includes(item.title);
            return (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/10">
                <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-200">{item.subreddit}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses(item.score)}`}>Opportunity: {item.score}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClasses(item.risk)}`}>Risk: {item.risk}</span>
                      {done && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Done</span>}
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
                      <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
                        <ExternalLink className="h-4 w-4" /> Open Reddit
                      </a>
                      <button onClick={() => markDone(item.title)} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/15">
                        <CheckCircle2 className="h-4 w-4" /> {done ? "Undo Done" : "Mark Done"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[linear-gradient(180deg,#07111f_0%,#050b16_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/15">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Monetization-ready beta</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Package this as a paid MarketVibe feature.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Free users get a small daily queue. Paid users unlock more opportunities, saved niches, reply history, and client dashboards.</p>
              </div>
              <Sparkles className="h-8 w-8 text-cyan-200" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {["Find relevant conversations", "Generate safe human replies", "Track what turns into profile visits"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm font-semibold text-slate-100">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
