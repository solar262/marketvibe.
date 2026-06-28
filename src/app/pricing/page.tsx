import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileText, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";

export const metadata: Metadata = {
  title: "MarketVibe Pricing | Lead Search and Audit Reports",
  description: "Choose a MarketVibe plan for lead opportunity scoring, audit reports, public business signals, and service outreach planning.",
};

const plans = [
  ["Free", "€0", "3 sample leads", "Try the sample lead set and preview how audit signals are organized.", null, false],
  ["Starter", "€19/month", "50 leads/month", "For freelancers and service sellers building a weekly prospecting routine.", "starter", true],
  ["Pro", "€49/month", "250 leads/month", "For agencies and regular prospectors reviewing more markets each month.", "pro", false],
] as const;

const included = [
  "Lead opportunity scoring",
  "Audit summaries",
  "Website/contact visibility checks",
  "Outreach angle suggestions",
  "Secure checkout and instant access",
];

const auditIncludes = [
  "Full audit report for one selected business",
  "Opportunity score and plain-English issue summary",
  "Website, contact, booking, review, and trust-signal checks",
  "Suggested service angle for web design, SEO, booking, or conversion work",
  "Ready-to-edit outreach message",
  "Fix checklist you can use when preparing your offer",
];

const faqs = [
  ["What does MarketVibe do?", "MarketVibe helps service sellers find public business opportunities, review visible website gaps, and turn those signals into practical audit reports and service offer ideas."],
  ["What is the €19 audit?", "The €19 Full Audit Report unlocks one selected business report. Choose a business first, open its audit preview, then pay to unlock that exact report."],
  ["Can I use the audit to pitch the business owner?", "Yes. You can use the findings to prepare a professional pitch, proposal, consultation, or service offer. MarketVibe gives research and pitch support, not guaranteed sales."],
  ["Where do the leads come from?", "Leads are based on public business information and visible website signals such as contact visibility, booking routes, SEO basics, review/trust signals, and conversion gaps."],
  ["Is this guaranteed to get me clients?", "No. MarketVibe helps with research, prioritization, and audit preparation, but it does not guarantee clients, revenue, replies, or sales outcomes."],
  ["What happens after I pay?", "Stripe returns you to MarketVibe after checkout, and the app sends access automatically so you can continue into lead search, audit reports, or your selected plan."],
  ["Can I cancel?", "Starter and Pro are monthly plans. If you need help with billing or cancellation, contact support from the site and the account can be handled from there."],
  ["Who is MarketVibe for?", "MarketVibe is built for freelancers, agencies, web designers, SEO workers, and service sellers who want a clearer way to find and review local business opportunities."],
] as const;

export default function PricingPage() {
  return (
    <main className="bg-[radial-gradient(circle_at_top,#d1fae5_0,transparent_30rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_48%,#f8fafc_100%)]">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-900 shadow-sm">
            <Sparkles className="h-4 w-4" /> SaaS pricing
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Choose the right level for your prospecting rhythm.</h1>
          <p className="mt-5 leading-7 text-slate-600">
            MarketVibe helps you find public business opportunities, review visible website gaps, and turn those signals into practical audit reports and service offers.
          </p>
        </div>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map(([name, price, limit, body, product, recommended]) => (
            <div key={name} className={`relative min-w-0 rounded-[2rem] border bg-white p-6 shadow-xl shadow-slate-950/5 ${recommended ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"}`}>
              {recommended && (
                <span className="absolute right-5 top-5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">Recommended</span>
              )}
              <h2 className="text-xl font-semibold text-slate-950">{name}</h2>
              <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{price}</p>
              <p className="mt-2 font-medium text-emerald-700">{limit}</p>
              <p className="mt-4 min-h-16 text-sm leading-6 text-slate-600">{body}</p>
              <div className="mt-5 grid gap-2 text-sm text-slate-700">
                {included.slice(0, name === "Free" ? 3 : 5).map((item) => (
                  <span key={item} className="flex min-w-0 items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> <span className="break-words">{item}</span>
                  </span>
                ))}
              </div>
              {product ? (
                <CheckoutButton product={product} className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg transition ${recommended ? "bg-emerald-700 text-white shadow-emerald-900/15 hover:bg-emerald-800" : "bg-slate-950 text-white shadow-slate-950/15 hover:bg-slate-800"}`}>
                  Start {name}
                </CheckoutButton>
              ) : (
                <a href="/lead-search" className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">Try Free</a>
              )}
            </div>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
          <div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-8">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                <FileText className="h-4 w-4" /> One-off full audit report
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">€19 for one full business audit report</h2>
              <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                Best for testing one strong lead before choosing a monthly plan. Choose a business first, open its audit preview, then pay €19 to unlock that exact report.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/lead-search" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-white/10 hover:bg-slate-100">
                  Choose a Business to Audit
                </Link>
                <Link href="/faq" className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  Read Buyer Q&amp;A
                </Link>
              </div>
              <p className="mt-3 text-sm text-slate-400">Payment happens on the selected business audit page after the buyer understands what the report includes.</p>
            </div>
            <div className="min-w-0 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-emerald-300">What the €19 audit includes</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                {auditIncludes.map((item) => (
                  <span key={item} className="flex min-w-0 items-start gap-2 rounded-2xl bg-white/5 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> <span className="break-words">{item}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <ShieldCheck className="h-8 w-8 text-emerald-700" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">What you get</h2>
            <p className="mt-3 leading-7 text-slate-600">Each plan is designed to help you move from search to review to a practical service angle without overpromising outcomes.</p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {included.map((item) => (
              <div key={item} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-950/5">
                <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-700" />
                <span className="break-words">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-emerald-700">FAQ</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Common questions before checkout.</h2>
            <Link href="/faq" className="mt-4 inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-white">
              Open full buyer Q&amp;A page
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <div key={question} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5">
                <HelpCircle className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-4 font-semibold text-slate-950">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
