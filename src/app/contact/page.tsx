"use client";

import { useState } from "react";
import { inputClass } from "@/lib/ui";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/contact", { method: "POST", body: JSON.stringify(Object.fromEntries(form.entries())) });
    setSent(true);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Contact</h1>
          <p className="mt-2 text-slate-600">Questions about lead sources, audits, Stripe setup, or compliance controls?</p>
          <form onSubmit={submit} className="mt-7 grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <label className="grid gap-1 text-sm font-medium">Name<input required name="name" className={inputClass} /></label>
            <label className="grid gap-1 text-sm font-medium">Email<input required type="email" name="email" className={inputClass} /></label>
            <label className="grid gap-1 text-sm font-medium">Message<textarea required name="message" rows={5} className={inputClass} /></label>
            <button className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white">Send message</button>
            {sent && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Message saved. The support team can review it in Supabase.</p>}
          </form>
        </div>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">FAQ</h2>
          {[
            ["Where do leads come from?", "The demo uses generated public-source data. Production should connect approved APIs such as Google Places or licensed business data providers."],
            ["Does MarketVibe send emails automatically?", "No. Sending is off by default and should only be enabled after compliance settings are reviewed."],
            ["Is Stripe required?", "Stripe is used for real payment collection. Without keys, checkout falls back to a local demo success link."],
          ].map(([q, a]) => (
            <div key={q} className="border-b border-slate-100 py-4 last:border-0">
              <p className="font-semibold text-slate-950">{q}</p>
              <p className="mt-1 text-sm text-slate-600">{a}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
