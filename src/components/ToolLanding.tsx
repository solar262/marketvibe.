import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { businessGuides, getToolBySlug, toolCards } from "@/lib/business-tools";

type ToolLandingProps = {
  slug: string;
};

export function ToolLanding({ slug }: ToolLandingProps) {
  const tool = getToolBySlug(slug);

  if (!tool) {
    return null;
  }

  const relatedGuide = businessGuides.find((guide) => guide.href === tool.relatedGuide);
  const relatedTools = toolCards.filter((item) => item.slug !== tool.slug && item.category === tool.category).slice(0, 3);
  const Icon = tool.icon;

  return (
    <main>
      <section className="border-b border-stone-200 bg-[#f7f3ea]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_0.85fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-emerald-800">{tool.keyword}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">{tool.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">{tool.description}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-stone-950 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-stone-950">Quick score preview</p>
                <p className="text-sm text-stone-600">Use this page to compare an idea before you commit.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              {["Demand signal", "Competition level", "Startup cost", "Difficulty", "Monetization fit"].map((label) => (
                <div key={label} className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-2">
                  <span className="text-stone-700">{label}</span>
                  <span className="font-semibold text-stone-950">Score</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">What this tool checks</h2>
            <p className="mt-3 leading-7 text-stone-600">
              This free MarketVibe tool is designed for beginners who want a realistic first read on an online business idea without hype or complicated spreadsheets.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Search demand", "Buyer intent", "Profit potential", "Content angles", "Launch difficulty", "Next best step"].map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-stone-200 bg-white p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="font-semibold text-stone-950">{item}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">A simple checkpoint to help decide whether the idea deserves more research.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-stone-950">Related research</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {relatedGuide && (
              <Link href={relatedGuide.href} className="rounded-lg border border-stone-200 bg-[#fbfaf7] p-5 hover:bg-white">
                <p className="text-sm font-semibold text-emerald-800">Business Idea Guide</p>
                <h3 className="mt-2 font-semibold text-stone-950">{relatedGuide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{relatedGuide.description}</p>
              </Link>
            )}
            <Link href="/reports" className="rounded-lg border border-stone-200 bg-[#fbfaf7] p-5 hover:bg-white">
              <p className="text-sm font-semibold text-emerald-800">Next step</p>
              <h3 className="mt-2 font-semibold text-stone-950">Full opportunity report</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">Turn a promising idea into a clearer research brief, launch path, and first validation checklist.</p>
            </Link>
          </div>
          {relatedTools.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-stone-950">Related tools</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {relatedTools.map((item) => (
                  <Link key={item.slug} href={item.href} className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-950 hover:bg-stone-50">
                    {item.name} <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

