import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MarketVibe",
  description: "About MarketVibe Lead Engine.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">About MarketVibe</h1>
      <p className="mt-4 leading-7 text-slate-700">
        MarketVibe Lead Engine helps freelancers, agencies, consultants, and service providers review visible business website signals and prepare clearer audit reports.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        MarketVibe does not guarantee replies, clients, income, rankings, revenue, or sales. It provides research and audit support only.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        Contact: hello@marketvibe1.com
      </p>
    </main>
  );
}
