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
  LockKeyhole,
  MapPinned,
  MousePointerClick,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UnlockKeyhole,
} from "lucide-react";
import { sampleLeads } from "@/lib/lead-engine";

export const metadata: Metadata = {
  title: "MarketVibe Lead Engine | Find Business Leads for Service Sellers",
  description: "Find public business opportunities, review website gaps, and create practical audit reports for web design, SEO, booking, review, and local service outreach.",
};

export default function Home() {
  const lead = sampleLeads[0];
  const visibleFindings = lead.audit.findings.filter((finding) => finding.found).slice(0, 3);
  const howItWorks = [
    [MapPinned, "Choose a market", "Pick a city, business category, and the service you want to sell."],
    [SearchCheck, "Find public business opportunities", "Rank visible business signals and focus on the strongest matches."],
    [ClipboardCheck, "Review the audit signals", "Scan website gaps, contact routes, booking visibility, and trust signals."],
    [UnlockKeyhole, "Unlock reports or start a plan", "Open full reports or move into Starter or Pro when you need more volume."],
  ] as const;
  const audience = ["Freelancers", "Agencies", "Web designers", "SEO workers", "Booking setup specialists", "Local service sellers"];
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
    "Secure Stripe checkout",
    "Instant buyer access",
    "Uses visible public business signals",
    "No income or client guarantees",
  ];

  return (
    <main className="bg-[radial-gradient(circle_at_top_left,#d1fae5_0,transparent_34rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f8fafc_100%)]">
      <section className="overflow-hidden border-b border-slate-200/80">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.95fr_1.05fr] md:items-center lg:px-8 lg:py-20">
          <div className="min-w-0">
            <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-sm font-semibold text-emerald-900 shadow-sm">
              <Sparkles className="h-4 w-4" /> MarketVibe Lead Engine
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Find Businesses That Need Your Services
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              MarketVibe turns public business signals into lead opportunities, audit previews, and service angles for web design, SEO, booking, reviews, and local presence work.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/free-leads" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-950/20 transition hover:bg-slate-800">
                Get Free Leads <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/lead-search" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50">
                Find Leads
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm font-medium text-slate-700 sm:grid-cols-3">
              {["Opportunity scoring", "Audit previews", "Secure checkout"].map((item) => (
                <span key={item} className="inline-flex min-w-0 items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" /> <span className="truncate">{item}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-[2rem] border border-white/80 bg-slate-950 p-3 shadow-2xl shadow-slate-950/25">
            <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,#10b98133,transparent_18rem),#0f172a] p-4 text-white sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Lead intelligence preview</p>
                  <h2 className="mt-1 truncate text-xl font-semibold">{lead.businessName}</h2>
                  <p className="mt-1 text-sm text-slate-300">{lead.city}, {lead.country} · {lead.businessCategory}</p>
                </div>
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-3xl font-semibold text-slate-950 shadow-lg shadow-emerald-500/20">
                  {lead.audit.score}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  [Globe2, "Website gaps", `${lead.audit.issues.length} signals`],
                  [Eye, "Contact visibility", lead.audit.emailVisible || lead.audit.phoneVisible ? "Detected" : "Needs review"],
                  [MousePointerClick, "CTA issue", lead.audit.clearCallToActionVisible ? "Clear" : "Weak"],
                ].map(([Icon, label, value]) => (
                  <div key={label as string} className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Icon className="h-4 w-4 text-emerald-300" />
                    <p className="mt-3 text-xs text-slate-400">{label as string}</p>
                    <p className="mt-1 truncate text-sm font-semibold">{value as string}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                {visibleFindings.map((finding) => (
                  <div key={finding.label} className="min-w-0 rounded-2xl border border-white/10 bg-white p-4 text-slate-950">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{finding.label}</p>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">Website gap</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{finding.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Suggested service angle</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">{lead.audit.serviceAngle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-emerald-700">How MarketVibe Works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">A dashboard workflow for finding better opportunities.</h2>
          </div>
          <Link href="/lead-search" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 hover:underline">
            Open Lead Search <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map(([Icon, title, body], index) => (
            <div key={title} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-semibold text-white">{index + 1}</span>
                <Icon className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <p className="text-sm font-semibold text-emerald-700">Sample Audit Preview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">See why a business may be worth reviewing.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              The sample audit shows the kind of public website signals MarketVibe turns into a practical report and service angle.
            </p>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{lead.businessName}</p>
                  <p className="mt-1 text-sm text-slate-600">{lead.audit.priority} priority · score {lead.audit.score}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">Preview</span>
              </div>
            </div>
            <Link href={`/audit/${lead.slug}`} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800">
              View Sample Audit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {auditIncludes.map((item) => (
              <div key={item} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-950/5">
                <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-700" />
                <span className="break-words">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/80 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="min-w-0">
            <FileSearch className="h-8 w-8 text-emerald-700" />
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Who It Helps</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Built for service sellers who need a sharper way to find, review, and prioritize public business opportunities.
            </p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {audience.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-800 shadow-sm">
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
            [LockKeyhole, "Checkout-ready access", "Use Stripe checkout for full reports, Starter, or Pro access."],
          ].map(([Icon, title, body]) => (
            <div key={title as string} className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
              <Icon className="h-7 w-7 text-emerald-700" />
              <h3 className="mt-5 text-xl font-semibold text-slate-950">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-300">Trust / Safe Checkout</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built for a clear, safer buying flow.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">MarketVibe keeps the funnel focused on opted-in visitors, buyers, and visible public business signals.</p>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold leading-6 text-slate-100">
                  <ShieldCheck className="mb-3 h-5 w-5 text-emerald-300" />
                  <span className="break-words">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-xl shadow-emerald-900/5 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-slate-950">Start with free lead previews.</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-700">Enter the funnel, open Lead Search, and decide whether a full audit or plan makes sense for your workflow.</p>
            </div>
            <Link href="/free-leads" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800">
              Get Free Leads <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
