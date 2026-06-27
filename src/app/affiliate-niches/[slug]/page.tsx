import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideLanding } from "@/components/GuideLanding";
import { ToolLanding } from "@/components/ToolLanding";
import { businessGuides, getGuideBySlug, getToolBySlug, toolCards } from "@/lib/business-tools";

export function generateStaticParams() {
  return [
    ...toolCards.filter((tool) => tool.category === "Affiliate Niches").map((tool) => ({ slug: tool.slug })),
    ...businessGuides.filter((guide) => guide.href.startsWith("/affiliate-niches")).map((guide) => ({ slug: guide.slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  const guide = getGuideBySlug(slug);

  if (tool && tool.href.startsWith("/affiliate-niches/")) {
    return { title: `${tool.name} | Free ${tool.keyword} | MarketVibe`, description: tool.description };
  }

  if (guide) {
    return { title: `${guide.title} | MarketVibe`, description: guide.description };
  }

  return {};
}

export default async function AffiliateNichePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tool = getToolBySlug(slug);

  if (tool && tool.href.startsWith("/affiliate-niches/")) {
    return <ToolLanding slug={slug} />;
  }

  if (getGuideBySlug(slug)) {
    return <GuideLanding slug={slug} />;
  }

  notFound();
}
