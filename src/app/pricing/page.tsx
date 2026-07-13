import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Database,
  Radar,
  Sparkles,
} from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";

export const metadata: Metadata = {
  title: "MarketVibe Pricing | Buyer-Intent Intelligence",
  description:
    "Choose a MarketVibe buyer-intent intelligence plan for focused market review, source context, and recurring delivery.",
};

const buyButton =
  "mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110";

const contactButton =
  "mt-6 inline-flex w-full items-center justify-center rounded-xl border border-violet-300/30 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#08030f] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.32),transparent_34rem)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200">
              <Sparkles className="h-4 w-4" />
              Buyer-intent intelligence
            </p>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Find buyers already showing a reason to act.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-violet-100/75">
              MarketVibe converts public business pain signals into scored,
              organized opportunities with source context and plain-language fit notes.
            </p>
          </div>

          <section className="mt-14 grid gap-6 lg:grid-cols-3">
            <article className="relative rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/30 backdrop-blur">
              <span className="absolute right-5 top-5 rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 text-xs font-black text-fuchsia-100">
                TRY FIRST
              </span>
              <BriefcaseBusiness className="h-8 w-8 text-fuchsia-300" />
              <p className="mt-5 text-sm font-bold uppercase tracking-wider text-fuchsia-300">
                Proof Pack
              </p>
              <h2 className="mt-2 text-4xl font-bold">€99</h2>
              <p className="mt-1 text-sm text-violet-100/60">One-off niche test · no subscription</p>
              <p className="mt-5 min-h-20 leading-7 text-violet-100/75">
                Get a focused review for one market so you can judge whether the
                MarketVibe format is useful before subscribing.
              </p>
              <div className="mt-6 space-y-3 text-sm text-violet-50">
                {[
                  "One focused niche",
                  "Context for each opportunity",
                  "Source links where available",
                  "Plain-language fit notes",
                  "Secure workspace and email delivery",
                ].map((item) => (
                  <p key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" />
                    {item}
                  </p>
                ))}
              </div>
              <CheckoutButton product="proof_pack" className={buyButton}>
                Get my Proof Pack
              </CheckoutButton>
            </article>

            <article className="relative rounded-3xl border border-fuchsia-400/50 bg-gradient-to-b from-violet-900/70 to-white/[0.06] p-7 shadow-2xl shadow-violet-950/50">
              <span className="absolute right-5 top-5 rounded-full bg-fuchsia-400 px-3 py-1 text-xs font-black text-[#16051f]">
                CORE PLAN
              </span>
              <Radar className="h-8 w-8 text-fuchsia-300" />
              <p className="mt-5 text-sm font-bold uppercase tracking-wider text-fuchsia-300">
                Radar
              </p>
              <h2 className="mt-2 text-4xl font-bold">€299</h2>
              <p className="mt-1 text-sm text-violet-100/60">Per month</p>
              <p className="mt-5 min-h-20 leading-7 text-violet-100/75">
                Recurring access to scored buyer-intent opportunities for an
                ongoing market review workflow.
              </p>
              <div className="mt-6 space-y-3 text-sm text-violet-50">
                {[
                  "Recurring signal review",
                  "Context and priority notes",
                  "Opportunity filtering",
                  "Plain-language recommendations",
                  "Workspace access",
                ].map((item) => (
                  <p key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" />
                    {item}
                  </p>
                ))}
              </div>
              <CheckoutButton product="radar" className={buyButton}>
                Start Radar
              </CheckoutButton>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/30 backdrop-blur">
              <Building2 className="h-8 w-8 text-fuchsia-300" />
              <p className="mt-5 text-sm font-bold uppercase tracking-wider text-fuchsia-300">
                Growth Desk
              </p>
              <h2 className="mt-2 text-4xl font-bold">€750</h2>
              <p className="mt-1 text-sm text-violet-100/60">
                Per month · onboarding applies
              </p>
              <p className="mt-5 min-h-20 leading-7 text-violet-100/75">
                Managed market review for businesses that need help narrowing
                niche, territory, and reporting focus.
              </p>
              <div className="mt-6 space-y-3 text-sm text-violet-50">
                {[
                  "Custom niche and territory focus",
                  "Weekly opportunity review",
                  "Priority filtering and reporting",
                  "Report exports",
                  "Priority support",
                ].map((item) => (
                  <p key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" />
                    {item}
                  </p>
                ))}
              </div>
              <CheckoutButton product="growth_desk" className={buyButton}>
                Start Growth Desk
              </CheckoutButton>
            </article>
          </section>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <Building2 className="h-8 w-8 text-violet-300" />
            <p className="mt-5 text-sm font-bold uppercase tracking-wider text-violet-300">
              Agency Partner
            </p>
            <h2 className="mt-2 text-3xl font-bold">€2,500/month</h2>
            <p className="mt-4 leading-7 text-violet-100/70">
              Multi-client opportunity intelligence, broader market coverage, partner
              delivery, and priority account support.
            </p>
            <Link href="/contact?offer=agency-partner" className={contactButton}>
              Discuss Agency Partner
            </Link>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <Database className="h-8 w-8 text-violet-300" />
            <p className="mt-5 text-sm font-bold uppercase tracking-wider text-violet-300">
              Data Licence
            </p>
            <h2 className="mt-2 text-3xl font-bold">€25,000–€60,000/year</h2>
            <p className="mt-4 leading-7 text-violet-100/70">
              Structured buyer-intent data delivery for larger sales organizations,
              platforms, and specialist market operators.
            </p>
            <Link href="/contact?offer=data-licence" className={contactButton}>
              Request Licence Discussion
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
