import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import { SampleCheckoutForm } from "./SampleCheckoutForm";

export const metadata: Metadata = {
  title: "MarketVibe Proof Pack | €99 Buyer-Intent Sample",
  description: "Buy a one-off MarketVibe Proof Pack and receive a focused buyer-intent opportunity pack built from verified saved signals.",
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
              Validate the MarketVibe signal quality before subscribing.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-violet-100/70">
              The €99 Proof Pack is a one-off buyer-intent sample with source context, pain summaries, and outreach angles. After Stripe checkout, onboarding captures your niche and territory.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Distinct product code: proof_pack",
                "One-time €99 card payment",
                "Built from live saved signals",
                "Delivered by dashboard and e-mail",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-semibold text-violet-50 backdrop-blur-xl">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-[#a855f7]" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-lg border border-violet-300/20 bg-white/5 p-5 backdrop-blur-xl">
              <ShieldCheck className="h-6 w-6 text-[#a855f7]" />
              <p className="mt-3 text-sm leading-6 text-violet-100/70">
                MarketVibe does not claim guaranteed replies, clients, or revenue. The pack is decision support for prospect research and outreach planning.
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
