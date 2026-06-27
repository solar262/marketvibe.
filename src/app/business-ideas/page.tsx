import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { businessGuides, toolCards } from "@/lib/business-tools";

export const metadata: Metadata = {
  title: "Business Idea Guides for Beginners | MarketVibe",
  description: "Read beginner-friendly guides for side hustle ideas, AI business ideas, dropshipping ideas, YouTube niches, TikTok niches, and online business research.",
};

export default function BusinessIdeasPage() {
  const guides = businessGuides.filter((guide) => guide.href.startsWith("/business-ideas"));
  const tools = toolCards.filter((tool) => tool.category === "Business Ideas");

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-tight text-stone-950">Business Idea Guides</h1>
      <p className="mt-4 max-w-2xl leading-7 text-stone-600">Beginner guides for comparing online business ideas with demand, competition, cost, difficulty, and monetization in mind.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <Link key={guide.slug} href={guide.href} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md">
            <h2 className="font-semibold text-stone-950">{guide.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{guide.description}</p>
          </Link>
        ))}
      </div>
      <h2 className="mt-12 text-2xl font-semibold text-stone-950">Related tools</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {tools.map((tool) => (
          <Link key={tool.slug} href={tool.href} className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-950 hover:bg-stone-50">
            {tool.name} <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </main>
  );
}

