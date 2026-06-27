import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getGuideBySlug, toolCards } from "@/lib/business-tools";

type GuideLandingProps = {
  slug: string;
};

export function GuideLanding({ slug }: GuideLandingProps) {
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return null;
  }

  const relatedTools = guide.relatedTools
    .map((href) => toolCards.find((tool) => tool.href === href))
    .filter((tool) => Boolean(tool));

  return (
    <main>
      <section className="border-b border-stone-200 bg-[#f7f3ea]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-emerald-800">Business Idea Guides</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">{guide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-700">{guide.description}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-stone-950">Use these tools with this guide</p>
          <div className="mt-4 grid gap-3">
            {relatedTools.map((tool) => tool && (
              <Link key={tool.slug} href={tool.href} className="rounded-md border border-stone-200 px-3 py-3 text-sm font-semibold text-stone-950 hover:bg-stone-50">
                {tool.name}
              </Link>
            ))}
          </div>
        </aside>
        <article className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-950">How to use this guide</h2>
          <p className="mt-4 leading-7 text-stone-600">
            Start by listing a few ideas, then compare each one against demand, competition, startup cost, difficulty, and monetization. The goal is not to find a perfect idea. It is to avoid spending money before the basics look reasonable.
          </p>
          <h3 className="mt-8 text-xl font-semibold text-stone-950">Beginner research checklist</h3>
          <div className="mt-4 grid gap-3">
            {[
              "Write the audience and problem in one sentence.",
              "Check whether people already search for this topic or product.",
              "Look for signs of paying intent, not just curiosity.",
              "Estimate costs, fees, and the minimum price needed to make the idea worthwhile.",
              "Choose one low-risk test before building a full brand, store, or content plan.",
            ].map((item) => (
              <p key={item} className="rounded-md bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">{item}</p>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/tools" className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800">
              Compare with free tools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

