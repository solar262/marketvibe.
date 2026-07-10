import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MarketVibe",
  description: "About MarketVibe buyer-intent intelligence.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">About MarketVibe</h1>
      <p className="mt-4 leading-7 text-slate-700">
        MarketVibe helps agencies, consultants, and growth teams review public buyer-intent signals, prioritize opportunities, and prepare clearer outreach.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        MarketVibe does not guarantee replies, clients, income, rankings, revenue, or sales. It provides research and decision support only.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        Contact: hello@marketvibe1.com
      </p>
    </main>
  );
}
