import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Notice / Impressum | MarketVibe",
  description: "Legal notice and contact information for MarketVibe.",
};

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Legal Notice / Impressum</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-semibold text-slate-950">MarketVibe</p>
        <p className="mt-3 text-slate-700">Website: https://www.marketvibe1.com</p>
        <p className="mt-2 text-slate-700">Contact email: hello@marketvibe1.com</p>
        <p className="mt-2 text-slate-700">Region: EU / Austria-based online service</p>
      </div>
    </main>
  );
}
