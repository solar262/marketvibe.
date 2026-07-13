import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import { SampleCheckoutForm } from "./SampleCheckoutForm";

export const metadata: Metadata = {
  title: "MarketVibe Proof Pack | €99 Buyer-Intent Sample",
  description: "Buy a one-off MarketVibe Proof Pack for a focused market sample with context and source links where available.",
};

export default function SamplePage() {
  return (
    <main className="min-h-screen bg-[#08030f] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.36),transparent_34rem)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-start lg:px-8 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-violet-200 backdrop-blur-xl">
              <FileSearch className="h-4 w-4 text-[#a855f7]" />
              Proof Pack
            </p>
            <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight sm:text-6xl">
              Test one market before you subscribe.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-violet-100/70">
              The €99 Proof Pack gives you a focused market sample with context
              and source links where available. Use it to decide whether
              MarketVibe is useful before choosing a monthly plan.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "No subscription required",
                "Built around one niche",
                "Context for each opportunity",
                "Delivered by secure workspace and email",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-semibold text-violet-50 backdrop-blur-xl">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-[#a855f7]" />
                  {item}
                </div>
              ))}
            </div>

            <section className="mt-8 grid gap-3">
              {[
                ["Focused, not generic", "You get a sample shaped around your niche, territory, offer, and ideal buyer."],
                ["Less manual review", "Instead of opening dozens of tabs, you receive a focused set of opportunities with context already organized."],
                ["Built for decision-making", "Each opportunity is meant to help you decide what to review and whether Radar is worth it."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                  <h2 className="text-sm font-semibold text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-violet-100/70">{body}</p>
                </div>
              ))}
            </section>

            <div className="mt-8 rounded-lg border border-violet-300/20 bg-white/5 p-5 backdrop-blur-xl">
              <ShieldCheck className="h-6 w-6 text-[#a855f7]" />
              <p className="mt-3 text-sm leading-6 text-violet-100/70">
                MarketVibe does not claim guaranteed replies, clients, or
                revenue. The pack is decision support for market review, so you
                can judge the signal before paying monthly.
              </p>
              <Link href="/terms" className="mt-4 inline-flex text-sm font-semibold text-violet-200 hover:text-white">
                Read terms
              </Link>
            </div>
          </div>

          <SampleCheckoutForm />
        </div>
      </section>
    </main>
  );
}
