import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolLanding } from "@/components/ToolLanding";
import { getToolBySlug, toolCards } from "@/lib/business-tools";

export function generateStaticParams() {
  return toolCards.filter((tool) => tool.href.startsWith("/tools/")).map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool || !tool.href.startsWith("/tools/")) {
    return {};
  }

  return {
    title: `${tool.name} | Free ${tool.keyword} | MarketVibe`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool || !tool.href.startsWith("/tools/")) {
    notFound();
  }

  return <ToolLanding slug={slug} />;
}
