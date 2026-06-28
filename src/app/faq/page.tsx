import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, HelpCircle, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "MarketVibe FAQ | Audit Reports and Lead Search Questions",
  description: "Answers about MarketVibe audit reports, lead search, one-off audit purchases, subscriptions, and what buyers receive after checkout.",
};

const auditPoints = [
  "One full audit report for one selected business",
  "Visible website issues and opportunity score",
  "Contact, booking, review, and trust-signal checks",
  "Suggested service angle for your pitch or proposal",
  "Ready-to-edit outreach message",
  "Fix checklist for preparing a service offer",
];

const questions = [
  [
    "What is the €19 Full Audit Report?",
    "It unlocks one selected business audit. You choose a business from Lead Search, open its audit preview, then pay €19 to unlock the full report for that specific business.",
  ],
  [
    "Can I use the audit to pitch the business owner?",
    "Yes. The audit is designed to help you understand visible improvement opportunities before you contact a business. You can use the findings to prepare a professional pitch, proposal, consultation, or service offer.",
  ],
  [
    "Can I resell the audit?",
    "You can use the findings, notes, outreach message, and checklist to support your own service offer or client proposal. MarketVibe is a research and audit preparation tool; it is not a promise that the business owner will buy from you.",
  ],
  [
    "Am I guaranteed to get a client?",
    "No. MarketVibe does not guarantee replies, clients, income, rankings, revenue, or sales. It helps you research better opportunities and approach them with clearer information.",
  ],
  [
    "What happens after I pay?",
    "Stripe returns you to MarketVibe after checkout. If you paid from a selected audit page, that report is unlocked and the app sends an access email automatically.",
  ],
  [
    "Is the audit for one business or many?",
    "The €19 Full Audit Report is for one selected business. Starter and Pro are monthly plans for people who want more lead opportunities each month.",
  ],
  [
    "Where does the information come from?",
    "MarketVibe uses public business information and visible website signals such as contact visibility, booking routes, SEO basics, review/trust signals, and conversion gaps.",
  ],
  [
    "Who is MarketVibe for?",
    "MarketVibe is built for freelancers, agencies, web designers, SEO workers, consultants, local marketers, and service sellers who want a clearer way to find and review local business opportunities.",
  ],
] as const;

export default function FAQPage() {
  return (
    <main className="bg-[radial-gradient(circle_at_top,#d1fae5_0,transparent_30rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_48%,#f8fafc_100%)]">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="min-w-0 rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 lg:sticky lg:top-28">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
              <HelpCircle className="h-4 w-4" /> Buyer questions
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Know exactly what you are buying.</h1>
            <p className="mt-4 leading-7 text-slate-300">
              MarketVibe helps you research public business opportunities and prepare clearer audit-backed pitches. It does not guarantee replies, clients, income, or sales outcomes.
            </p>
            <div className="mt-6 grid gap-3">
              {auditPoints.map((item) => (
                <span key={item} className="flex min-w-0 items-start gap-2 rounded-2xl bg-white/5 p-3 text-sm text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> <span className="break-words">{item}</span>
                </span>
              ))}
            </div>
            <Link href="/lead-search" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">
              Choose a Business to Audit
            </Link>
          </div>

          <div className="min-w-0">
            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
              <ShieldCheck className="h-6 w-6" />
              <h2 className="mt-3 text-xl font-semibold">Clear buying terms</h2>
              <p className="mt-2 text-sm leading-6">
                The €19 audit is not a guaranteed client. It is one selected business report you can use to understand visible issues and prepare a stronger pitch, proposal, consultation, or service offer.
              </p>
            </div>

            <section className="mt-6 grid gap-4">
              {questions.map(([question, answer]) => (
                <article key={question} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5">
                  <h2 className="font-semibold text-slate-950">{question}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
                </article>
              ))}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
