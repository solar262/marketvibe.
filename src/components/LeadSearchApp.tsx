"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";
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
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Lead Search</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Choose a local market and the service you want to sell.</p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Country
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal" value={input.country} onChange={(event) => setInput({ ...input, country: event.target.value })}>
              {countries.map((country) => <option key={country}>{country}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            City
            <input className="rounded-md border border-slate-300 px-3 py-2 font-normal" value={input.city} onChange={(event) => setInput({ ...input, city: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Business type
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal" value={input.businessType} onChange={(event) => setInput({ ...input, businessType: event.target.value })}>
              {businessTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Service category
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal" value={input.serviceCategory} onChange={(event) => setInput({ ...input, serviceCategory: event.target.value })}>
              {serviceCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
        </div>

        <button onClick={runSearch} disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Find Leads
        </button>
        {sourceNote && (
          <div className={`mt-4 rounded-md p-3 text-xs font-semibold leading-5 ${sourceStatus === "live" ? "bg-emerald-50 text-emerald-900" : "bg-slate-50 text-slate-700"}`}>
            {sourceNote}
          </div>
        )}
      </section>

      <section className="min-w-0">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Lead Results</h2>
            <p className="mt-1 text-sm text-slate-600">{leads.length ? `${leads.length} businesses ranked by sales opportunity score.` : "Run a search to generate leads."}</p>
          </div>
          {sourceStatus !== "idle" && (
            <span className={`rounded-md px-3 py-1 text-xs font-semibold ${sourceStatus === "live" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
              {sourceStatus === "live" ? "LIVE PUBLIC DATA" : "SAMPLE PREVIEW"}
            </span>
          )}
          <Link href="/pricing" className="hidden text-sm font-semibold text-slate-950 hover:underline sm:block">Upgrade limits</Link>
        </div>

        <div className="grid gap-4">
          {leads.map((lead) => (
            <article key={lead.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950">{lead.businessName}</h3>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">{lead.audit.priority} priority</span>
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${lead.sourceStatus === "live" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                      {lead.sourceStatus === "live" ? "LIVE" : "SAMPLE"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{lead.city}, {lead.country} · {lead.businessCategory}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{lead.audit.summary}</p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <span>Website: <a className="font-medium text-slate-950 underline" href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a></span>
                    <span>Contact: {lead.contactPageUrl ? <a className="font-medium text-slate-950 underline" href={lead.contactPageUrl} target="_blank" rel="noreferrer">{lead.contactPageUrl}</a> : "Not detected"}</span>
                    <span>Email: {lead.publicEmail || "Not visible"}</span>
                    <span>Phone: {lead.phone || "Not visible"}</span>
                  </div>
                </div>
                <div className="flex md:flex-col md:items-end">
                  <div className="grid h-16 w-16 place-items-center rounded-md bg-slate-950 text-xl font-semibold text-white">{lead.audit.score}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link href={`/audit/${lead.slug}`} onClick={() => track("view_audit_click", { leadSlug: lead.slug, sourceStatus: lead.sourceStatus })} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
                  View Audit <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={lead.googleProfileUrl || "#"} className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-50">
                  Business Profile
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
