import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, ShieldCheck, TrendingUp } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";

export default function LeadPacksPage() {
  const plans = [
    {
      name: "Free Preview",
      price: "€0",
      limit: "3 sample previews",
      body: "Preview how MarketVibe ranks opportunities before upgrading.",
      action: <Link href="/lead-search" className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">Preview opportunities</Link>,
    },
    {
      name: "Starter",
      price: "€19/month",
      limit: "50 leads/month",
      body: "For freelancers and solo service sellers building a focused weekly prospect list.",
      action: <CheckoutButton product="starter" className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Buy Starter</CheckoutButton>,
    },
    {
      name: "Pro",
      price: "€49/month",
      limit: "250 leads/month",
      body: "For agencies, consultants, and growth teams running regular lead research.",
      action: <CheckoutButton product="pro" className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Buy Pro</CheckoutButton>,
    },
  ];

  return (
    <main>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-900">
            <TrendingUp className="h-4 w-4" /> Ranked local business opportunities
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Lead packs for people who sell local business services.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            MarketVibe finds businesses with weak websites, weak SEO, missing booking or contact routes, poor conversion signals, and weak trust signals, then turns those checks into ranked opportunities and audit summaries.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/lead-search" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Search leads <ArrowRight className="h-4 w-4" />
            </Link>
            <CheckoutButton product="starter" className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">
              Start Starter
            </CheckoutButton>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          ["Who buys these", "Freelancers, web designers, SEO people, social media managers, agencies, consultants, and local service sellers."],
          ["What gets checked", "Website calls-to-action, SEO metadata, speed signals, mobile basics, contact visibility, booking routes, reviews, and social links."],
          ["How to use them", "Review the ranked opportunities, open the audit, copy the outreach angle, and pitch a practical service offer manually."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-950">Choose a lead pack</h2>
          <p className="mt-2 max-w-2xl text-slate-600">Free users can preview a small number of opportunities. Paid users get monthly access to more ranked leads and audit details.</p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-950">{plan.name}</h3>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{plan.price}</p>
                <p className="mt-2 font-medium text-emerald-700">{plan.limit}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{plan.body}</p>
                {plan.action}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <Search className="h-7 w-7 text-emerald-700" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">Built around real public signals.</h2>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <p className="text-sm leading-6 text-slate-600">
              MarketVibe uses public business listing data and publicly visible website signals. It does not promise sales, does not hide sender identity, and does not send automatic cold emails.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

