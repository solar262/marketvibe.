import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileSearch,
  Globe2,
  Layers3,
  MousePointerClick,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  UnlockKeyhole,
} from "lucide-react";
import { sampleLeads } from "@/lib/lead-engine";

export const metadata: Metadata = {
  title: "MarketVibe Lead Engine | Find High-Intent Customer Conversations",
  description: "Find people already talking about the problems your business solves, then join conversations with helpful, human replies.",
};

export default function Home() {
  const lead = sampleLeads[0];
  const visibleFindings = lead.audit.findings.filter((finding) => finding.found).slice(0, 3);
  const heroBenefits = [
    [SearchCheck, "Scan public conversations"],
    [Target, "Rank high-intent problems"],
    [MousePointerClick, "Spot lead and traffic pain"],
    [Globe2, "Review public business signals"],
  ] as const;
  const howItWorks = [
    [SearchCheck, "Enter your product and audience", "Describe who you help, what problem you solve, and the terms buyers use."],
    [Target, "Find high-intent conversations", "Rank public posts where people ask for help with customers, leads, traffic, sales, visibility, or growth."],
    [ClipboardCheck, "Review pain and reply angle", "See the detected pain point, intent score, relevance reason, and a helpful reply draft."],
    [UnlockKeyhole, "Move into lead search or reports", "Use public business signals and audit reports when you want local prospect research too."],
  ] as const;
  const audience = ["Web designers", "SEO freelancers", "Agencies", "Consultants", "Local marketers", "Service sellers"];
  const auditIncludes = [
    "Business overview",
    "Opportunity score",
    "Website issues",
    "Contact/booking visibility",
    "Review/trust signals",
    "Suggested service angle",
    "Ready-to-edit outreach message",
    "Fix checklist",
  ];
  const trustItems = [
    "Secure checkout",
    "Audit preview",
    "Public conversations",
    "Built for service sellers",
  ];

  return (
    <main className="overflow-hidden bg-[#050b16] text-white">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,#10b98140,transparent_25rem),radial-gradient(circle_at_78%_18%,#06b6d433,transparent_26rem),linear-gradient(135deg,#06111f_0%,#071827_42%,#030712_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050b16] to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[0.94fr_1.06fr] md:items-center lg:px-8 lg:py-16">
          <div className="min-w-0">
            <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-cyan-300/20 bg-white/8 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Sparkles className="h-4 w-4 text-emerald-300" /> MarketVibe Lead Engine
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.7rem] lg:leading-[1.02]">
              Find People Already Talking About the Problems You Solve
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              MarketVibe helps you discover public conversations where people are asking for help with customers, leads, traffic, sales, visibility, or growth.
            </p>

            <div className="mt-6 grid max-w-xl gap-2 sm:grid-cols-2">
              {heroBenefits.map(([Icon, label]) => (
                <div key={label} className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-100 shadow-inner shadow-white/5 backdrop-blur">
                  <Icon className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/free-leads" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:brightness-105">
                Get Free Leads <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/lead-search" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 backdrop-blur transition hover:bg-white/15">
                Find Leads
              </Link>
            </div>

            <div className="mt-7 grid gap-2 text-xs font-semibold text-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => (
                <span key={item} className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-slate-950/35 px-3 py-2 backdrop-blur">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> <span className="truncate">{item}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 md:justify-self-end">
            <div className="relative mx-auto max-w-[560px]">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-400/25 via-cyan-400/15 to-blue-500/20 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/15 bg-slate-950/90 p-3 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur">
                <div className="rounded-[1.45rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,#22d3ee22,transparent_15rem),radial-gradient(circle_at_bottom_left,#10b9811f,transparent_15rem),#08111f] p-4 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Lead intelligence dashboard</p>
                      <h2 className="mt-2 truncate text-lg font-semibold">{lead.businessName}</h2>
                      <p className="mt-1 text-xs text-slate-400">{lead.city}, {lead.country} · {lead.businessCategory}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-2 text-center shadow-lg shadow-emerald-950/20">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200">Score</p>
                      <p className="mt-1 text-3xl font-semibold text-emerald-300">{lead.audit.score}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      [Globe2, "Website gaps", `${lead.audit.issues.length} signals`],
                      [Eye, "Contact visibility", lead.audit.emailVisible || lead.audit.phoneVisible ? "Detected" : "Needs review"],
                      [MousePointerClick, "CTA issue", lead.audit.clearCallToActionVisible ? "Clear" : "Weak"],
                    ].map(([Icon, label, value]) => (
                      <div key={label as string} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3 shadow-inner shadow-white/5">
                        <Icon className="h-4 w-4 text-cyan-200" />
                        <p className="mt-3 text-[11px] text-slate-400">{label as string}</p>
                        <p className="mt-1 truncate text-sm font-semibold">{value as string}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2.5">
                    {visibleFindings.map((finding) => (
                      <div key={finding.label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.97] p-3 text-slate-950 shadow-xl shadow-black/15">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{finding.label}</p>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Website gap</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{finding.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">Suggested service angle</p>
                      <span className="rounded-full bg-emerald-300/15 px-2 py-1 text-[11px] font-semibold text-emerald-200">{lead.audit.priority} priority</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-100">{lead.audit.serviceAngle}</p>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {["Audit ready", "Signal count", "Service angle"].map((item, index) => (
                      <div key={item} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
                        <p className="text-[11px] text-slate-400">{item}</p>
                        <p className="mt-1 text-sm font-semibold text-white">{index === 1 ? lead.audit.findings.length : "Active"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/10 bg-[#050b16]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-emerald-300">How MarketVibe Works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">A focused workflow for finding better opportunities.</h2>
            </div>
            <Link href="/free-leads" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
              Get Free Leads <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map(([Icon, title, body], index) => (
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

      <section className="bg-[linear-gradient(180deg,#07111f_0%,#050b16_100%)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:px-8">
          <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/15">
            <p className="text-sm font-semibold text-emerald-300">Sample Audit Preview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">See why a business may be worth reviewing.</h2>
            <p className="mt-4 leading-7 text-slate-300">
              The sample audit shows the kind of public website signals MarketVibe turns into a practical report and service angle.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{lead.businessName}</p>
                  <p className="mt-1 text-sm text-slate-400">{lead.audit.priority} priority · score {lead.audit.score}</p>
                </div>
                <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-200">Preview</span>
              </div>
            </div>
            <Link href={`/audit/${lead.slug}`} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-black/20 transition hover:bg-slate-100">
              View Sample Audit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {auditIncludes.map((item) => (
              <div key={item} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm font-semibold text-slate-100 shadow-lg shadow-black/10">
                <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-300" />
                <span className="break-words">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06111f] py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="min-w-0">
            <FileSearch className="h-8 w-8 text-emerald-300" />
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Built for service sellers who need sharper prospecting.</h2>
            <p className="mt-4 leading-7 text-slate-300">
              MarketVibe is designed for people selling practical services into local and public business markets.
            </p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {audience.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 font-semibold text-slate-100 shadow-lg shadow-black/10">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [BarChart3, "Lead scoring", "Rank opportunities by visible gaps instead of sorting through raw lists."],
            [ShieldCheck, "Public signal checks", "Review website, contact, booking, review, and trust signals in one place."],
            [Layers3, "Report-ready workflow", "Move from search to audit preview to checkout without manual handoff."],
          ].map(([Icon, title, body]) => (
            <div key={title as string} className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-xl shadow-black/10">
              <Icon className="h-7 w-7 text-emerald-300" />
              <h3 className="mt-5 text-xl font-semibold text-white">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{body as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,#22d3ee20,transparent_20rem),#08111f] p-6 text-white shadow-2xl shadow-black/20 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-300">Trust / Safe Checkout</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built for a clear, safer buying flow.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">MarketVibe keeps the funnel focused on opted-in visitors, buyers, and visible public business signals.</p>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm font-semibold leading-6 text-slate-100">
                  <ShieldCheck className="mb-3 h-5 w-5 text-emerald-300" />
                  <span className="break-words">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-emerald-300/20 bg-gradient-to-r from-emerald-300/15 to-cyan-300/10 p-6 shadow-2xl shadow-black/15 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-white">Start with free lead previews.</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-300">Enter the funnel, open Lead Search, and decide whether a full audit or plan makes sense for your workflow.</p>
            </div>
            <Link href="/free-leads" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-950/20 transition hover:brightness-105">
              Get Free Leads <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
