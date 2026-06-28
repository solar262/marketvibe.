import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "MarketVibe Terms of Service | Audit Reports and Lead Search",
  description: "Terms for using MarketVibe Lead Engine, lead search, one-off audit reports, subscriptions, checkout, and buyer responsibilities.",
};

const sections = [
  {
    title: "Service overview",
    body: "MarketVibe Lead Engine provides lead-search tools, business opportunity previews, audit-style reports, and related digital access for freelancers, agencies, consultants, and service sellers.",
  },
  {
    title: "What the €19 Full Audit Report includes",
    body: "A €19 Full Audit Report unlocks one selected business audit. It may include visible website issues, an opportunity score, contact and booking visibility checks, review/trust-signal notes, a suggested service angle, a ready-to-edit outreach message, and a fix checklist. The audit is for the selected business only and does not include unlimited leads or subscription access.",
  },
  {
    title: "How audit reports may be used",
    body: "You may use MarketVibe audit findings to prepare your own pitch, proposal, consultation, service offer, or internal research. You are responsible for how you present, edit, share, or act on the report. You must not present MarketVibe outputs as guaranteed facts, guaranteed results, legal advice, or proof that a business will buy from you.",
  },
  {
    title: "No guaranteed results",
    body: "MarketVibe does not guarantee sales, clients, rankings, replies, deliverability, revenue, profit, or business outcomes. Lead scores and audit notes are practical indicators, not promises that a business will buy services or respond to outreach.",
  },
  {
    title: "User responsibility",
    body: "You are responsible for how you use MarketVibe results, reports, business contact details, outreach messages, and exported content. You must use the service lawfully and avoid deceptive, abusive, misleading, or spam-like activity.",
  },
  {
    title: "Public business information",
    body: "MarketVibe may use publicly visible business information such as business names, websites, contact pages, generic business emails, phone numbers, social links, and visible website signals. We do not promise that any public information is complete, current, error-free, or suitable for a particular purpose.",
  },
  {
    title: "Outreach and communications",
    body: "If you contact businesses using information or message drafts from MarketVibe, you are responsible for complying with applicable email, privacy, marketing, and anti-spam rules in your location and the recipient's location. You should identify yourself clearly, use accurate claims, avoid misleading subject lines, and honor opt-out requests.",
  },
  {
    title: "Paid access and subscriptions",
    body: "Paid audit reports, Starter access, and Pro access are digital products or subscriptions. Prices and included limits may change. Subscription billing is handled by Stripe and continues until cancelled according to Stripe checkout or account billing settings.",
  },
  {
    title: "Refunds and digital delivery",
    body: "Because MarketVibe provides digital access and report content, purchases may not be refundable once access is delivered, unless required by law or agreed in writing. If something does not work as expected, contact support so we can review it.",
  },
  {
    title: "Account and admin access",
    body: "Admin areas, operator tools, dashboard controls, automation settings, and internal configuration pages are private. Customers should only use public product pages, checkout pages, lead-search tools, and the access links provided after purchase.",
  },
  {
    title: "Service availability",
    body: "MarketVibe may depend on third-party services such as hosting, payments, email delivery, analytics, databases, and public data sources. The service may occasionally be delayed, unavailable, incomplete, or changed without notice.",
  },
  {
    title: "Limitation of liability",
    body: "MarketVibe is provided as a business prospecting and audit-support tool. To the maximum extent allowed by law, we are not liable for lost revenue, lost opportunities, account restrictions, third-party platform decisions, or actions you take based on MarketVibe outputs.",
  },
  {
    title: "Contact",
    body: "For questions about these terms, contact MarketVibe through the Contact page or email hello@marketvibe1.com.",
  },
];

export default function TermsPage() {
  return (
    <main className="bg-[radial-gradient(circle_at_top,#d1fae5_0,transparent_30rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f8fafc_100%)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-900">
          <ShieldCheck className="h-4 w-4" /> MarketVibe Lead Engine
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: June 2026</p>
        <p className="mt-6 leading-7 text-slate-700">
          These terms explain how MarketVibe may be used. By using the website, lead-search tools, audit previews,
          paid reports, or subscription access, you agree to use the service responsibly and lawfully.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/faq" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Read Buyer Q&amp;A
          </Link>
          <Link href="/pricing" className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white">
            Back to Pricing
          </Link>
        </div>
      </div>

      <section className="mx-auto mt-6 grid max-w-3xl gap-4">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5">
            <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
            <p className="mt-2 leading-7 text-slate-700">{section.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
