import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toolCards } from "@/lib/business-tools";

type ToolIndexProps = {
  title: string;
  description: string;
  filter?: (category: string) => boolean;
};

export function ToolIndex({ title, description, filter }: ToolIndexProps) {
  const tools = filter ? toolCards.filter((tool) => filter(tool.category)) : toolCards;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-950">{title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-600">{description}</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.slug} href={tool.href} className="group rounded-lg border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-stone-950 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-5 text-sm font-semibold text-emerald-800">{tool.keyword}</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">{tool.name}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{tool.description}</p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-950">
                Open tool <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

