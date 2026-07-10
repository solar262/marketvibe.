import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  MessageSquareText,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "MarketVibe | Opportunity Intelligence for Modern Prospecting",
  description:
    "Uncover high-intent opportunities faster with buyer-intent scoring, source context, outreach angles, and proof-pack delivery.",
};

const features = [
  [Gauge, "Opportunity scoring", "Rank public buyer-intent signals before your team spends time on outreach."],
  [MessageSquareText, "Outreach angles", "See the pain point, timing, and first-message angle connected to each signal."],
  [ClipboardCheck, "Proof packs", "Buy a one-off pack to validate fit before moving into recurring Radar delivery."],
  [Radar, "Radar feeds", "Ongoing delivery for agencies and growth teams that need fresher opportunity flow."],
] as const;

const testimonials = [
  ["Agency founder", "The proof pack made it clear which niches were worth pursuing before we added another sales tool."],
  ["SEO consultant", "The signals gave us a cleaner reason to contact prospects instead of opening with a generic audit."],
  ["Growth operator", "Radar turned scattered public pain into a weekly list the team could actually work from."],
] as const;

const metrics = [
  ["Signals delivered", "12.4k"],
  ["Agencies onboard", "37"],
  ["Pipeline value", "€2.1m"],
] as const;

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#08030f] text-white">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(168,85,247,0.42),transparent_24rem),radial-gradient(circle_at_80%_5%,rgba(217,70,239,0.24),transparent_28rem),linear-gradient(135deg,#08030f_0%,#1a0730_52%,#05010a_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#08030f] to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:px-8 lg:py-20">
          <div className="min-w-0">
            <p className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-violet-100 shadow-lg shadow-violet-950/20 backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-[#a855f7]" /> MarketVibe buyer-intent intelligence
            </p>
            <h1 className="mt-5 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.7rem] lg:leading-[1.02]">
              Stop Chasing Cold Leads
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-violet-100/75 sm:text-lg">
              MarketVibe turns public business pain signals into scored opportunities, source context, and practical outreach angles for agencies, consultants, and growth teams.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/sample" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-950/30 transition hover:brightness-110">
                Get proof pack <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/engine" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 backdrop-blur-xl transition hover:bg-white/10">
                See engine
              </Link>
            </div>

            <div className="mt-7 grid gap-2 text-xs font-semibold text-violet-100/80 sm:grid-cols-2">
              {["Verified source context", "No fabricated pack padding", "Stripe checkout", "Brevo delivery"].map((item) => (
                <span key={item} className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#a855f7]" /> <span className="truncate">{item}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 md:justify-self-end">
            <div className="relative mx-auto max-w-[600px]">
              <div className="absolute -inset-6 rounded-lg bg-gradient-to-br from-violet-500/25 via-fuchsia-400/15 to-indigo-500/18 blur-2xl" />
              <div className="relative rounded-lg border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <div className="rounded-lg border border-white/10 bg-[#10071c]/85 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">Live signal board</p>
                      <h2 className="mt-2 text-lg font-semibold">Growth Services Pipeline</h2>
                      <p className="mt-1 text-xs text-violet-100/55">Buyer-intent preview</p>
                    </div>
                    <div className="rounded-lg border border-violet-300/30 bg-violet-300/10 p-3 text-center shadow-lg shadow-violet-950/20">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-200">Intent</p>
                      <p className="mt-1 text-3xl font-semibold text-[#a855f7]">91</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {[
                      ["Signal", "Founder asks how to improve qualified sales meetings this quarter."],
                      ["Pain", "Pipeline quality is low and internal team is burning time on manual research."],
                      ["Angle", "Lead with a short buyer-intent brief, then offer a focused prospecting sprint."],
                    ].map(([label, body]) => (
                      <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">{label}</p>
                        <p className="mt-2 text-sm leading-6 text-violet-50/85">{body}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {["Source saved", "Fit checked", "CSV ready"].map((item) => (
                      <div key={item} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-white">
                        <ShieldCheck className="mb-2 h-4 w-4 text-[#a855f7]" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#08030f]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#a855f7]">Engine</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-white">
              Opportunity intelligence without the old lead-pack clutter.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([Icon, title, body]) => (
              <div key={title} className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
                <Icon className="h-6 w-6 text-[#a855f7]" />
                <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-violet-100/65">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[linear-gradient(180deg,#10071c_0%,#08030f_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map(([name, quote]) => (
              <figure key={name} className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <blockquote className="text-sm leading-6 text-violet-50/80">&ldquo;{quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm font-semibold text-violet-200">{name}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-sm font-semibold text-violet-200">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-violet-300/20 bg-white/5 p-6 shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <Target className="mb-4 h-7 w-7 text-[#a855f7]" />
              <h2 className="font-serif text-2xl font-semibold text-white">Validate the market before subscribing.</h2>
              <p className="mt-2 max-w-2xl leading-7 text-violet-100/70">
                Start with a Proof Pack, then move into Radar or Growth Desk when the signal quality is right.
              </p>
            </div>
            <Link href="/sample" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-950/20 transition hover:brightness-110">
              Get proof pack <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
