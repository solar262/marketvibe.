import Link from "next/link";
import { ArrowRight, Clock, LockKeyhole, Sparkles } from "lucide-react";
import { buildLeadPacks } from "@/lib/autopilot";
import { CheckoutButton } from "@/components/CheckoutButton";

export default async function LeadPacksPage() {
  const packs = await buildLeadPacks();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-900">
            <Sparkles className="h-4 w-4" /> Fresh Lead Packs
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Lead packs for service sellers</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
            MarketVibe turns local business scans into ranked opportunities for web designers, SEO freelancers, social media managers, and agencies.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-950">
            <Clock className="h-5 w-5 text-emerald-700" /> Autopilot schedule
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The scheduled lead hunt route is now built. It checks configured markets, scores opportunities, and saves results when Supabase is connected.
          </p>
          <code className="mt-3 block rounded-md bg-slate-50 p-3 text-xs text-slate-700">/api/cron/lead-hunt</code>
        </div>
      </div>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        {packs.map((pack) => (
          <article key={pack.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{pack.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{pack.description}</p>
              </div>
              <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{pack.sourceLabel}</span>
            </div>

            <div className="mt-5 grid gap-3">
              {pack.leads.map((lead) => (
                <div key={lead.slug} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-950">{lead.businessName}</h3>
                      <p className="mt-1 text-sm text-slate-600">{lead.city}, {lead.country} · {lead.businessCategory}</p>
                    </div>
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-slate-950 text-sm font-semibold text-white">{lead.audit.score}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{lead.audit.summary}</p>
                  <Link href={`/audit/${lead.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 hover:underline">
                    View preview <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-slate-950 p-6 text-white">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <LockKeyhole className="h-7 w-7 text-emerald-300" />
            <h2 className="mt-4 text-2xl font-semibold">Turn these packs into a weekly prospecting system.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Starter gives 50 opportunities per month. Pro gives 250 opportunities per month for regular campaigns.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CheckoutButton product="starter" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">
              Start Starter
            </CheckoutButton>
            <CheckoutButton product="pro" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Start Pro
            </CheckoutButton>
          </div>
        </div>
      </section>
    </main>
  );
}
