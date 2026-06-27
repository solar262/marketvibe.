import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { businessGuides, toolCards } from "@/lib/business-tools";

export const metadata: Metadata = {
  title: "Digital Product Ideas & Profit Tools | MarketVibe",
  description: "Find digital product ideas for Etsy, Pinterest, templates, printables, and downloads, then calculate profit with free beginner-friendly tools.",
};

export default function DigitalProductsPage() {
  const guides = businessGuides.filter((guide) => guide.href.startsWith("/digital-products"));
  const tools = toolCards.filter((tool) => tool.category === "Digital Products" || tool.slug === "digital-product-profit-calculator");

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-tight text-stone-950">Digital Product Ideas</h1>
      <p className="mt-4 max-w-2xl leading-7 text-stone-600">Research printables, templates, Etsy products, Pinterest-led ideas, and downloadable products before you build.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.slug} href={tool.href} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md">
            <p className="text-sm font-semibold text-emerald-800">{tool.keyword}</p>
            <h2 className="mt-2 font-semibold text-stone-950">{tool.name}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{tool.description}</p>
          </Link>
        ))}
      </div>
      <h2 className="mt-12 text-2xl font-semibold text-stone-950">Business Idea Guides</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {guides.map((guide) => (
          <Link key={guide.slug} href={guide.href} className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-950 hover:bg-stone-50">
            {guide.title} <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </main>
  );
}

