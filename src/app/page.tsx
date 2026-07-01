import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Gauge,
  Layers3,
  Lightbulb,
  MessageSquareText,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "MarketVibe | Opportunity Intelligence for Modern Prospecting",
  description:
    "Uncover high-intent opportunities faster with smarter prospect discovery, outreach insights, opportunity scoring, and audit summaries.",
};

const features = [
  [Gauge, "Opportunity Scoring", "Identify higher-value prospects faster."],
  [MessageSquareText, "Outreach Angles", "Understand context before reaching out."],
  [ClipboardCheck, "Audit Summaries", "Quickly review businesses and opportunities."],
  [SearchCheck, "Faster Prospecting", "Reduce manual prospect research and surface better opportunities faster."],
] as const;

const workflow = [
  [
    Compass,
    "Define your market",
    "Tell MarketVibe what you sell, who you help, and the opportunities you want to find.",
  ],
  [
    Target,
    "Discover relevant opportunities",
    "Surface public conversations and business signals connected to customer acquisition, sales, traffic, visibility, and growth.",
  ],
  [
    BarChart3,
    "Review intent and context",
    "See opportunity score, pain points, relevance, and suggested outreach angles.",
  ],
  [
    ArrowRight,
    "Take action faster",
    "Move from research to outreach with clearer context and less manual searching.",
  ],
] as const;

const audiences = [
  "Freelancers",
  "Agencies",
  "Lead generation businesses",
  "Service providers",
  "Consultants",
  "Growth-focused businesses",
];

const previewCards = [
  {
    label: "Opportunity Found",
    title: "Website consultant needs better leads",
    body: "Business operator asking how to find clients for website and visibility services.",
    meta: "Pain: customer acquisition",
  },
  {
    label: "Intent Score",
    title: "87/100",
    body: "High urgency, strong relevance, and clear buying-intent language.",
    meta: "Urgency 91 · Relevance 86 · Intent 84",
  },
  {
    label: "Outreach Angle",
    title: "Lead with the growth bottleneck",
    body: "Reference the stated prospecting challenge and offer a practical path to better opportunity flow.",
    meta: "Context-first suggestion",
  },
  {
    label: "Audit Summary",
    title: "Weak CTA and missing contact flow",
    body: "Example observations include poor visibility, unclear next step, and conversion friction.",
    meta: "Sample business review",
  },
];

const trustSignals = [
  "Premium opportunity workflow",
  "Context before outreach",
  "Sample-data previews",
  "Practical prospect research",
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#050b16] text-white">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,#10b98135,transparent_24rem),radial-gradient(circle_at_78%_12%,#38bdf82d,transparent_28rem),linear-gradient(135deg,#050b16_0%,#071827_48%,#030712_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050b16] to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:px-8 lg:py-16">
          <div className="min-w-0">
            <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-cyan-300/20 bg-white/8 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Sparkles className="h-4 w-4 text-emerald-300" /> MarketVibe Opportunity Intelligence
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.7rem] lg:leading-[1.02]">
              Stop Chasing Cold Leads
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              MarketVibe helps businesses uncover high-intent opportunities faster with smarter prospect discovery, outreach insights, and opportunity scoring.
            </p>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-cyan-100">
              Built for agencies, freelancers, consultants, and growth-focused businesses.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/free-leads" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:brightness-105">
                Start Finding Opportunities <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 backdrop-blur transition hover:bg-white/15">
                View Pricing
              </Link>
            </div>

            <div className="mt-7 grid gap-2 text-xs font-semibold text-slate-200 sm:grid-cols-2">
              {trustSignals.map((item) => (
                <span key={item} className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-slate-950/35 px-3 py-2 backdrop-blur">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> <span className="truncate">{item}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 md:justify-self-end">
            <div className="relative mx-auto max-w-[600px]">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-400/22 via-cyan-400/15 to-blue-500/18 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/15 bg-slate-950/90 p-3 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur">
                <div className="rounded-[1.45rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,#22d3ee20,transparent_15rem),radial-gradient(circle_at_bottom_left,#10b9811c,transparent_15rem),#08111f] p-4 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Opportunity dashboard</p>
                      <h2 className="mt-2 text-lg font-semibold">Growth Services Pipeline</h2>
                      <p className="mt-1 text-xs text-slate-400">Sample data · opportunity intelligence preview</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-center shadow-lg shadow-emerald-950/20">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200">Score</p>
                      <p className="mt-1 text-3xl font-semibold text-emerald-300">87</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      ["Urgency", "High", "bg-emerald-300/15 text-emerald-100"],
                      ["Relevance", "Strong", "bg-cyan-300/15 text-cyan-100"],
                      ["Buying Intent", "Clear", "bg-blue-300/15 text-blue-100"],
                    ].map(([label, value, tone]) => (
                      <div key={label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3 shadow-inner shadow-white/5">
                        <p className="text-[11px] text-slate-400">{label}</p>
                        <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.97] p-4 text-slate-950 shadow-xl shadow-black/15">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Opportunity Found</p>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Sample</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        &ldquo;We help local businesses improve visibility, but finding qualified prospects takes too long.&rdquo;
                      </p>
                    </div>

                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">Suggested outreach angle</p>
                      <p className="mt-2 text-sm leading-6 text-slate-100">
                        Open with the prospecting bottleneck, then connect the offer to clearer opportunity evaluation and faster research.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {["Weak CTA detected", "Contact flow unclear", "Visibility gap", "Growth angle ready"].map((item) => (
                        <div key={item} className="rounded-xl border border-white/10 bg-slate-950/45 p-3 text-sm font-semibold text-white">
                          <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/10 bg-[#050b16]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-emerald-300">Platform capabilities</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Opportunity Intelligence for Modern Prospecting
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([Icon, title, body]) => (
              <div key={title} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/10">
                <Icon className="h-6 w-6 text-emerald-300" />
                <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#07111f_0%,#050b16_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-emerald-300">Workflow</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                How MarketVibe Helps You Find Better Opportunities
              </h2>
            </div>
            <Link href="/free-leads" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
              Start Finding Opportunities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map(([Icon, title, body], index) => (
              <div key={title} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-sm font-semibold text-slate-950">{index + 1}</span>
                  <Icon className="h-5 w-5 text-emerald-300" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06111f] py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="min-w-0">
            <BriefcaseBusiness className="h-8 w-8 text-emerald-300" />
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Built for People Who Need Better Prospects
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              MarketVibe is designed for practical prospecting teams and service sellers who need better context before they spend time on outreach.
            </p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 font-semibold text-slate-100 shadow-lg shadow-black/10">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,#22d3ee20,transparent_20rem),#08111f] p-5 text-white shadow-2xl shadow-black/20 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-300">See MarketVibe In Action</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Review opportunity context before you spend time pursuing it.</h2>
              <p className="mt-4 leading-7 text-slate-300">
                The preview uses fictional sample data to show how MarketVibe organizes intent, context, outreach angles, and audit observations.
              </p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Opportunity brief</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  A growth-focused service provider is trying to improve prospecting, prioritize the right accounts, and understand where to lead the conversation.
                </p>
              </div>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {previewCards.map((card) => (
                <div key={card.label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-lg shadow-black/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{card.label}</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.body}</p>
                  <p className="mt-4 rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-xs font-semibold text-cyan-100">{card.meta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Lightbulb, "Context-rich research", "See why an opportunity may be relevant before deciding how to approach it."],
            [ShieldCheck, "Practical review flow", "Evaluate signals, fit, and timing without relying on generic lists."],
            [Layers3, "Opportunity-ready outputs", "Turn prospect research into clearer reports, angles, and next steps."],
          ].map(([Icon, title, body]) => (
            <div key={title as string} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-xl shadow-black/10">
              <Icon className="h-7 w-7 text-emerald-300" />
              <h3 className="mt-5 text-xl font-semibold text-white">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{body as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-emerald-300/20 bg-gradient-to-r from-emerald-300/15 to-cyan-300/10 p-6 shadow-2xl shadow-black/15 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <TrendingUp className="mb-4 h-7 w-7 text-emerald-300" />
              <h2 className="text-2xl font-semibold text-white">Find and evaluate better opportunities faster.</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-300">
                Start with the existing MarketVibe entry point, review opportunities, and decide which prospects deserve attention.
              </p>
            </div>
            <Link href="/free-leads" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-950/20 transition hover:brightness-105">
              Start Finding Opportunities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
