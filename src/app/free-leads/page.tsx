"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";
import { track } from "@vercel/analytics";

const serviceTypes = ["Web Design", "SEO", "Social Media", "Booking Systems", "Reviews"];
const checklist = [
  "Get 3 free business opportunity previews",
  "Review website, contact, booking, and trust signals",
  "See opportunity scores and outreach angles",
  "Find prospects faster without manual research",
];

export default function FreeLeadsPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    track("free_leads_submit", { source: "free_leads_form" });
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to subscribe right now.");
      return;
    }
    track("free_leads_success", { source: "free_leads_form" });
    setSuccess("Your free previews are ready. Opening lead search...");
    window.setTimeout(() => {
      window.location.href = "/lead-search";
    }, 800);
  }

  return (
    <main className="bg-[radial-gradient(circle_at_top_left,#d1fae5_0,transparent_30rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_440px] lg:items-start lg:px-8 lg:py-16">
        <div className="min-w-0">
          <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-900 shadow-sm">
            <Sparkles className="h-4 w-4" /> Free lead search
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Find your first business opportunities free.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Enter your email, choose the service you sell, and start discovering businesses that may need your help.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {checklist.map((item) => (
              <div key={item} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-950/5">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-700" />
                <span className="break-words">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [SearchCheck, "Lead Search", "Review opportunities after signup"],
                [ShieldCheck, "Business signals", "Website and trust gaps"],
                [Mail, "Outreach context", "Clearer angles before contact"],
              ].map(([Icon, title, body]) => (
                <div key={title as string} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Icon className="h-5 w-5 text-emerald-300" />
                  <p className="mt-3 font-semibold">{title as string}</p>
                  <p className="mt-1 text-sm text-slate-300">{body as string}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/10">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">Start free</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Get my free lead previews</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">We’ll take you straight to Lead Search after signup so you can review your first opportunities.</p>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input required name="email" type="email" className="rounded-xl border border-slate-300 px-3 py-3 font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              First name
              <input name="firstName" className="rounded-xl border border-slate-300 px-3 py-3 font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Service type
              <select name="serviceType" className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue="Web Design">
                {serviceTypes.map((serviceType) => <option key={serviceType}>{serviceType}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              City
              <input name="city" className="rounded-xl border border-slate-300 px-3 py-3 font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>
          </div>
          <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Get my free lead previews
          </button>
          {success && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{success}</p>}
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </form>
      </section>
    </main>
  );
}
