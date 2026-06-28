"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, Globe2, Loader2, MapPin, Search, ShieldCheck } from "lucide-react";
import { track } from "@vercel/analytics";
import { businessTypes, countries, serviceCategories } from "@/lib/lead-engine";
import type { BusinessLead, LeadSearchInput } from "@/lib/types";

const defaultInput: LeadSearchInput = {
  country: "United Kingdom",
  city: "Manchester",
  businessType: "salons",
  serviceCategory: "Web design",
};

export function LeadSearchApp({ initialLeads = [] }: { initialLeads?: BusinessLead[] }) {
  const [input, setInput] = useState(defaultInput);
  const [leads, setLeads] = useState<BusinessLead[]>(initialLeads);
  const [loading, setLoading] = useState(false);
  const [sourceNote, setSourceNote] = useState(initialLeads.length ? "Sample previews are shown until you run a live public data search." : "");
  const [sourceStatus, setSourceStatus] = useState<"live" | "demo" | "idle">(initialLeads.length ? "demo" : "idle");

  async function runSearch() {
    setLoading(true);
    track("lead_search_submit", input);
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    setLeads(data.leads || []);
    setSourceNote(data.sourceNote || "");
    setSourceStatus(data.sourceStatus || "idle");
    setLoading(false);
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl bg-slate-950 p-4 text-white">
          <p className="text-sm font-semibold text-emerald-300">Lead Search</p>
          <h1 className="mt-2 text-2xl font-semibold">Find public business opportunities</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Choose a market and the service you want to sell.</p>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Country
            <select className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" value={input.country} onChange={(event) => setInput({ ...input, country: event.target.value })}>
              {countries.map((country) => <option key={country}>{country}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            City
            <input className="rounded-xl border border-slate-300 px-3 py-3 font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" value={input.city} onChange={(event) => setInput({ ...input, city: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Business type
            <select className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" value={input.businessType} onChange={(event) => setInput({ ...input, businessType: event.target.value })}>
              {businessTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Service category
            <select className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" value={input.serviceCategory} onChange={(event) => setInput({ ...input, serviceCategory: event.target.value })}>
              {serviceCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
        </div>

        <button onClick={runSearch} disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Find Leads
        </button>
        {sourceNote && (
          <div className={`mt-4 rounded-2xl p-3 text-xs font-semibold leading-5 ${sourceStatus === "live" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
            {sourceNote}
          </div>
        )}
      </section>

      <section className="min-w-0">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">Dashboard results</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Lead opportunities</h2>
            <p className="mt-1 text-sm text-slate-600">{leads.length ? `${leads.length} businesses ranked by sales opportunity score.` : "Run a search to generate leads."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sourceStatus !== "idle" && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sourceStatus === "live" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                {sourceStatus === "live" ? "LIVE PUBLIC DATA" : "SAMPLE PREVIEW"}
              </span>
            )}
            <Link href="/pricing" className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-slate-50">Upgrade limits</Link>
          </div>
        </div>

        <div className="grid min-w-0 gap-4">
          {leads.map((lead) => (
            <article key={lead.id} className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
              <div className="grid gap-0 lg:grid-cols-[1fr_150px]">
                <div className="min-w-0 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 break-words text-lg font-semibold text-slate-950">{lead.businessName}</h3>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">{lead.audit.priority} priority</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${lead.sourceStatus === "live" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                      {lead.sourceStatus === "live" ? "LIVE" : "SAMPLE"}
                    </span>
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-emerald-700" /> {lead.city}, {lead.country}
                    <Building2 className="h-4 w-4 text-emerald-700" /> {lead.businessCategory}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{lead.audit.summary}</p>
                  <div className="mt-4 grid min-w-0 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <span className="min-w-0 break-words">Website: <a className="font-medium text-slate-950 underline" href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a></span>
                    <span className="min-w-0 break-words">Contact: {lead.contactPageUrl ? <a className="font-medium text-slate-950 underline" href={lead.contactPageUrl} target="_blank" rel="noreferrer">{lead.contactPageUrl}</a> : "Not detected"}</span>
                    <span className="min-w-0 break-words">Email: {lead.publicEmail || "Not visible"}</span>
                    <span className="min-w-0 break-words">Phone: {lead.phone || "Not visible"}</span>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link href={`/audit/${lead.slug}`} onClick={() => track("view_audit_click", { leadSlug: lead.slug, sourceStatus: lead.sourceStatus })} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800">
                      View Audit <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href={lead.googleProfileUrl || "#"} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-50">
                      <Globe2 className="h-4 w-4" /> Business Profile
                    </Link>
                  </div>
                </div>
                <div className="grid place-items-center border-t border-slate-200 bg-slate-950 p-5 text-white lg:border-l lg:border-t-0">
                  <div className="text-center">
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-emerald-400 text-3xl font-semibold text-slate-950">{lead.audit.score}</div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-300">Opportunity score</p>
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Visible signals
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
