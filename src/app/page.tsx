import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileSearch, LockKeyhole, MailCheck, MapPinned, SearchCheck, ShieldCheck, Sparkles, UnlockKeyhole } from "lucide-react";
import { sampleLeads } from "@/lib/lead-engine";

export const metadata: Metadata = {
  title: "MarketVibe Lead Engine | Find Business Leads for Service Sellers",
  description: "Find public business opportunities, review website gaps, and create practical audit reports for web design, SEO, booking, review, and local service outreach.",
};

export default function Home() {
  const lead = sampleLeads[0];
  const howItWorks = [
    [MapPinned, "Choose a market", "Pick the country, city, business type, and service you want to sell."],
    [SearchCheck, "Find public business opportunities", "MarketVibe ranks visible business signals so you can focus your research."],
    [ClipboardCheck, "Review the audit signals", "See website gaps, contact visibility, booking routes, trust signals, and SEO basics."],
    [UnlockKeyhole, "Unlock reports or start a plan", "Open a full audit report or choose Starter or Pro when you need more leads."],
  ] as const;
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
    "Built for freelancers, agencies, web designers, SEO workers, and service sellers",
  ];

  return (
    <main>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-900">
              <Sparkles className="h-4 w-4" /> MarketVibe Lead Engine
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Find Businesses That Need Your Services
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              MarketVibe scans local businesses and finds websites with missing calls-to-action, weak SEO, slow speed, poor mobile experience, missing booking links, weak reviews, and other signs they may need help.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/free-leads" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Get Free Leads <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/lead-search" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">
                Find Leads
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm font-medium text-slate-700 sm:grid-cols-3">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Opportunity scoring</span>
              <span className="inline-flex items-center gap-2"><MailCheck className="h-4 w-4 text-emerald-700" /> Audit generator</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-emerald-700" /> Secure checkout</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Sample preview</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">{lead.businessName}</h2>
                <p className="mt-1 text-sm text-slate-600">{lead.city}, {lead.country} · {lead.businessCategory}</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-md bg-white text-xl font-semibold text-emerald-700 shadow-sm">
                {lead.audit.score}
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {lead.audit.findings.filter((finding) => finding.found).slice(0, 4).map((finding) => (
                <div key={finding.label} className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-950">{finding.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{finding.detail}</p>
                </div>
              ))}
            </div>
            <Link href="/lead-results" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 hover:underline">
              Open lead results <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-emerald-700">How MarketVibe Works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Go from market idea to practical audit report.</h2>
          <p className="mt-3 leading-7 text-slate-600">Use public business information and visible website signals to decide which opportunities are worth deeper review.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map(([Icon, title, body], index) => (
            <div key={title} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-950 text-sm font-semibold text-white">{index + 1}</span>
                <Icon className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <FileSearch className="h-8 w-8 text-emerald-700" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">Built for service sellers who need better prospects.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Freelancers, web designers, SEO workers, social media managers, agencies, consultants, and local business service sellers can use MarketVibe to spot practical improvement opportunities.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Web design", "SEO cleanup", "Social proof", "Booking setup", "Google profile", "Review visibility", "Mobile UX", "Conversion fixes"].map((item) => (
              <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-800">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">Full audit preview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">What a full audit report includes.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Start with the sample lead, then unlock deeper reports when an opportunity looks strong enough to review.
            </p>
            <Link href={`/audit/${lead.slug}`} className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              View Sample Audit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {auditIncludes.map((item) => (
              <div key={item} className="min-w-0 rounded-md border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">
                <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-700" />
                <span className="break-words">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <LockKeyhole className="h-7 w-7 text-emerald-300" />
              <h2 className="mt-4 text-2xl font-semibold">Free plan includes 3 sample leads.</h2>
              <p className="mt-2 max-w-2xl text-slate-300">Upgrade to Starter for 50 leads/month, Pro for 250 leads/month, or sell a one-off full audit report for each business.</p>
            </div>
            <Link href="/free-leads" className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">
              Get Free Leads
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-950">Built for a safer buying flow.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item} className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800">
                <ShieldCheck className="mb-3 h-5 w-5 text-emerald-700" />
                <span className="break-words">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
