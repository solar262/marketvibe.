import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Opportunity Reports & Launch Kits | MarketVibe",
  description: "Go beyond free business idea tools with opportunity reports, launch kits, digital product templates, and recommended business tools.",
};

export default function ReportsPage() {
  const offers = [
    ["Full opportunity report", "A clearer view of demand, competition, monetization, launch channels, and first validation steps."],
    ["Launch kit", "A simple checklist for your offer, landing page, first content pieces, and low-risk launch test."],
    ["Digital product templates", "Starter templates for guides, printables, content calendars, research sheets, and simple downloadable products."],
    ["Recommended business tools", "A curated list of beginner-friendly tools for research, selling, analytics, email, and content planning."],
  ];

  return (
    <main>
      <section className="border-b border-stone-200 bg-[#f7f3ea]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-emerald-800">Reports</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">Go deeper after the free idea check</h1>
          <p className="mt-5 text-lg leading-8 text-stone-700">Use MarketVibe reports and launch resources when an idea looks promising and you want a more organized next step.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map(([title, body]) => (
            <div key={title} id={title === "Launch kit" ? "launch-kit" : undefined} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              <h2 className="mt-4 font-semibold text-stone-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/tools" className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800">
            Start with the free tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

