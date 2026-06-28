import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";

export const metadata: Metadata = {
  title: "MarketVibe Pricing | Lead Search and Audit Reports",
  description: "Choose a MarketVibe plan for lead opportunity scoring, audit reports, public business signals, and service outreach planning.",
};

const plans = [
  ["Free", "€0", "3 sample leads", "Try the sample lead set and preview how audit signals are organized.", null],
  ["Starter", "€19/month", "50 leads/month", "For freelancers and service sellers building a weekly prospecting routine.", "starter"],
  ["Pro", "€49/month", "250 leads/month", "For agencies and regular prospectors reviewing more markets each month.", "pro"],
] as const;

const included = [
  "Lead opportunity scoring",
  "Audit summaries",
  "Website/contact visibility checks",
  "Outreach angle suggestions",
  "Secure checkout and instant access",
];

const faqs = [
  [
    "What does MarketVibe do?",
    "MarketVibe helps service sellers find public business opportunities, review visible website gaps, and turn those signals into practical audit reports and service offer ideas.",
  ],
  [
    "Where do the leads come from?",
    "Leads are based on public business information and visible website signals such as contact visibility, booking routes, SEO basics, review/trust signals, and conversion gaps.",
  ],
  [
    "Is this guaranteed to get me clients?",
    "No. MarketVibe helps with research, prioritization, and audit preparation, but it does not guarantee clients, revenue, replies, or sales outcomes.",
  ],
  [
    "What happens after I pay?",
    "Stripe returns you to MarketVibe after checkout, and the app sends access automatically so you can continue into lead search, audit reports, or your selected plan.",
  ],
  [
    "Can I cancel?",
    "Starter and Pro are monthly plans. If you need help with billing or cancellation, contact support from the site and the account can be handled from there.",
  ],
  [
    "Who is MarketVibe for?",
    "MarketVibe is built for freelancers, agencies, web designers, SEO workers, and service sellers who want a clearer way to find and review local business opportunities.",
  ],
] as const;

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold text-emerald-700">MarketVibe pricing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Choose the right level for your prospecting rhythm.</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Choose a plan based on how often you prospect. MarketVibe helps you find public business opportunities, review visible website gaps, and turn those signals into practical audit reports and service offers.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map(([name, price, limit, body, product]) => (
          <div key={name} className="min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">{name}</h2>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{price}</p>
            <p className="mt-2 font-medium text-emerald-700">{limit}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            {product ? (
              <CheckoutButton product={product} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Start {name}
              </CheckoutButton>
            ) : (
              <a href="/lead-search" className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">Try Free</a>
            )}
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">One-off full audit report</h2>
        <p className="mt-2 text-slate-600">€19 per business audit report. Unlocks the full audit, lead details, outreach message, fix checklist, and report-ready content for one business opportunity.</p>
        <CheckoutButton product="audit" className="mt-5 inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Buy Audit Report
        </CheckoutButton>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-700">What you get</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">A clearer way to review opportunities.</h2>
          <p className="mt-3 leading-7 text-slate-600">Each plan is designed to help you move from search to review to a practical service angle without overpromising outcomes.</p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {included.map((item) => (
            <div key={item} className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
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
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map(([question, answer]) => (
            <div key={question} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-950">{question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
