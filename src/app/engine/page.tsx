import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, FileCheck2, Gauge, MailCheck, Radar, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "MarketVibe Engine | Buyer-Intent Signal Workflow",
  description: "See how MarketVibe turns public buyer-intent signals into scored opportunities, proof packs, dashboards, and e-mail delivery.",
};

const steps = [
  [Database, "Collect", "MarketVibe stores live public signals and saved lead context from configured sources."],
  [Gauge, "Score", "Each opportunity is ranked by intent, urgency, relevance, pain clarity, and source quality."],
  [FileCheck2, "Package", "Proof Pack delivery uses verified saved opportunities and never pads with fabricated companies."],
  [MailCheck, "Deliver", "Stripe webhooks unlock access while Brevo sends onboarding and delivery e-mails."],
] as const;

export default function EnginePage() {
  return (
    <main className="min-h-screen bg-[#08030f] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.34),transparent_34rem)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-violet-200 backdrop-blur-xl">
              <Radar className="h-4 w-4 text-[#a855f7]" />
              Engine
            </p>
            <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight sm:text-6xl">
              Signal intake, scoring, proof delivery, and Radar feeds.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-violet-100/70">
              The production funnel is built around three product codes: Proof Pack, Radar, and Growth Desk. Checkout, webhook classification, entitlements, onboarding, and e-mail delivery all use those server-side codes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sample" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110">
                Get proof pack <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl hover:bg-white/10">
                Compare plans
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map(([Icon, title, body]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
                <Icon className="h-7 w-7 text-[#a855f7]" />
                <h2 className="mt-5 text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-violet-100/70">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        {[
          ["Central products", "proof_pack, radar, and growth_desk are the only products sold publicly."],
          ["Server entitlements", "Dashboard access is based on stored paid entitlements, not query-string plan claims."],
          ["Verified delivery", "Proof Pack rows come from live saved leads with real source context where available."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <ShieldCheck className="h-5 w-5 text-[#a855f7]" />
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/65">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
