import Link from "next/link";

export default function AcceptableUsePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Acceptable Use Policy</h1>
      <div className="mt-6 grid gap-4 leading-7 text-slate-600">
        <p>Use MarketVibe1 outputs for lawful research, market review, and prioritization. Review source context before contacting anyone.</p>
        <p>Do not use MarketVibe1 to send deceptive, abusive, unlawful, or spam-like messages. Do not claim guaranteed revenue, buying urgency, budget, authority, or private facts unless your own verified source supports it.</p>
        <p>Do not upload credentials, cookies, private profiles, scraped LinkedIn pages, or data you are not allowed to process. Sales Navigator CSV imports are CSV imports only; they are not LinkedIn automation or scraping tools.</p>
        <p>Honor opt-outs, correction requests, and removal requests. You are responsible for your own compliance with marketing, privacy, and anti-spam laws.</p>
      </div>
      <Link href="/contact?offer=policy-question" className="mt-6 inline-flex font-semibold text-slate-950 underline">Ask a policy question</Link>
    </main>
  );
}
