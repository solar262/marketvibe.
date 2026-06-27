"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { track } from "@vercel/analytics";

const serviceTypes = ["Web Design", "SEO", "Social Media", "Booking Systems", "Reviews"];

export default function FreeLeadsPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
    window.location.href = "/lead-packs";
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
        <section>
          <p className="text-sm font-semibold text-emerald-700">Free lead previews</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Get 3 free local business opportunity previews from MarketVibe.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
            See how MarketVibe helps freelancers, agencies, and service sellers find businesses with website, SEO, booking, review, and conversion opportunities.
          </p>
          <div className="mt-7 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {["Weak website signals", "Missing booking/contact routes", "SEO and conversion gaps", "Review and trust opportunities"].map((item) => (
              <div key={item} className="rounded-md border border-slate-200 bg-white p-4 font-medium">{item}</div>
            ))}
          </div>
        </section>

        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Send my previews</h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input required name="email" type="email" className="rounded-md border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              First name
              <input name="firstName" className="rounded-md border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Service type
              <select name="serviceType" className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal" defaultValue="Web Design">
                {serviceTypes.map((serviceType) => <option key={serviceType}>{serviceType}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              City
              <input name="city" className="rounded-md border border-slate-300 px-3 py-2 font-normal" />
            </label>
          </div>
          <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Get free previews
          </button>
          {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </form>
      </div>
    </main>
  );
}

