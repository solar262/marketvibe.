import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, HelpCircle, ShieldCheck } from "lucide-react";
import { supportAnswers } from "@/lib/support-content";
import { SupportAssistant } from "@/components/SupportAssistant";

export const metadata: Metadata = {
  title: "MarketVibe FAQ | Proof Pack, Radar, and Growth Desk",
  description: "Answers about MarketVibe Proof Pack, Radar subscriptions, Growth Desk delivery, checkout, and buyer-intent research outputs.",
};

const proofPoints = [
  "One-off €99 Proof Pack",
  "Radar at €299/month",
  "Growth Desk at €750/month",
  "Stripe card checkout",
  "Server-side entitlements",
  "Brevo onboarding and delivery e-mails",
];

export default function FAQPage() {
  return (
    <main className="bg-[#08030f] text-white">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:sticky lg:top-28">
            <p className="inline-flex items-center gap-2 rounded-lg bg-violet-400/10 px-3 py-2 text-sm font-semibold text-violet-200">
              <HelpCircle className="h-4 w-4" /> Buyer questions
            </p>
            <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Know exactly what you are buying.</h1>
            <p className="mt-4 leading-7 text-violet-100/70">
              MarketVibe provides buyer-intent research and delivery workflows. It does not guarantee outcomes.
            </p>
            <div className="mt-6 grid gap-3">
              {proofPoints.map((item) => (
                <span key={item} className="flex min-w-0 items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-violet-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#a855f7]" /> <span className="break-words">{item}</span>
                </span>
              ))}
            </div>
            <Link href="/sample" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110">
              Get proof pack
            </Link>
            <Link href="/contact?offer=support" className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Contact support
            </Link>
          </div>

          <div className="min-w-0">
            <div className="rounded-lg border border-violet-300/20 bg-violet-400/10 p-5 text-violet-50">
              <ShieldCheck className="h-6 w-6" />
              <h2 className="mt-3 text-xl font-semibold">Clear buying terms</h2>
              <p className="mt-2 text-sm leading-6">
                Proof Pack, Radar, and Growth Desk are distinct product codes with separate Stripe modes, entitlements, and onboarding paths.
              </p>
            </div>

            <div className="mt-6">
              <SupportAssistant />
            </div>

            <section className="mt-6 grid gap-4">
              {supportAnswers.map((item) => (
                <article key={item.question} className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 backdrop-blur-xl">
                  <h2 className="font-semibold text-white">{item.question}</h2>
                  <p className="mt-2 text-sm leading-6 text-violet-100/65">{item.answer}</p>
                  {item.href && <Link href={item.href} className="mt-3 inline-flex text-sm font-semibold text-violet-200 hover:text-white">Related page</Link>}
                </article>
              ))}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
