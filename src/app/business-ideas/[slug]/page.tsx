import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideLanding } from "@/components/GuideLanding";
import { businessGuides, getGuideBySlug } from "@/lib/business-tools";

export function generateStaticParams() {
  return businessGuides.filter((guide) => guide.href.startsWith("/business-ideas")).map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {};
  }

  return {
    title: `${guide.title} | MarketVibe Business Idea Guides`,
    description: guide.description,
  };
}

export default async function BusinessIdeaGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!getGuideBySlug(slug)) {
    notFound();
  }

  return <GuideLanding slug={slug} />;
}

