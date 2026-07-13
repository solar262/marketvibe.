import type { Metadata } from "next";
import { SalesQualificationForm } from "@/components/SalesQualificationForm";

export const metadata: Metadata = {
  title: "Find Your MarketVibe Fit",
  description: "Answer a short fit check to choose between a one-time Proof Pack and recurring buyer-intent delivery.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function QualifyPage() {
  return (
    <main className="min-h-screen bg-[#08030f] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.32),transparent_34rem)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-fuchsia-200">MarketVibe fit check</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              See whether Proof Pack or recurring Radar fits first.
            </h1>
            <p className="mt-5 text-base leading-7 text-violet-100/75 sm:text-lg">
              Answer a few questions about your offer and target market. MarketVibe will recommend the simplest next step.
            </p>
          </div>

          <div className="mt-8">
            <SalesQualificationForm />
          </div>
        </div>
      </section>
    </main>
  );
}
