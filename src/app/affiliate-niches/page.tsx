import type { Metadata } from "next";
import Link from "next/link";
import { ToolIndex } from "@/components/ToolIndex";
import { businessGuides } from "@/lib/business-tools";

export const metadata: Metadata = {
  title: "Affiliate Niche Research Tools | MarketVibe",
  description: "Find affiliate niche ideas, Amazon affiliate opportunities, and beginner-friendly affiliate programs with free MarketVibe research tools.",
};

export default function AffiliateNichesPage() {
  const guides = businessGuides.filter((guide) => guide.href.startsWith("/affiliate-niches"));

  return (
    <>
      <ToolIndex
        title="Affiliate Niche Research"
        description="Find affiliate niches and program ideas with clear buyer intent, useful content angles, and realistic beginner paths."
        filter={(category) => category === "Affiliate Niches"}
      />
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-stone-950">Affiliate niche guides</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <Link key={guide.slug} href={guide.href} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md">
              <h3 className="font-semibold text-stone-950">{guide.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{guide.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
