import Link from "next/link";
import { ArrowRight, Gauge, PackageOpen, Search, Settings, type LucideIcon } from "lucide-react";
import { leadSettings, sampleLeads } from "@/lib/lead-engine";

export default function DashboardPage() {
  const highPriority = sampleLeads.filter((lead) => lead.audit.priority === "high").length;
  const workflowCards: Array<[LucideIcon, string, string, string]> = [
    [Search, "Search setup", "Country, city, business type, and service category selectors are ready.", "/lead-search"],
    [Gauge, "Audit scoring", "Scores use the requested CTA, booking, speed, SEO, review, social, mobile, and outdated-signal weights.", "/lead-results"],
    [PackageOpen, "Lead packs", "Compare Free, Starter, and Pro access for ranked monthly opportunities.", "/lead-packs"],
    [Settings, "Admin controls", "Daily send limit, prices, free limits, allowed countries, and categories are configurable.", "/admin/settings"],
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Lead Engine Workspace</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Search markets, review audit scores, open public audit pages, and control outreach compliance before sending anything.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/lead-packs" className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            Lead Packs <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/lead-search" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            Lead Search <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Free", `${leadSettings.freeLeadLimit}`, "Sample previews"],
          ["Starter", "50", "Leads/month"],
          ["Pro", "250", "Leads/month"],
          ["High priority", `${highPriority}`, "Current sample matches"],
        ].map(([label, value, body]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {workflowCards.map(([Icon, title, body, href]) => (
          <Link key={title} href={href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md">
            <Icon className="h-6 w-6 text-emerald-700" />
            <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </Link>
        ))}
      </section>

    </main>
  );
}
