"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Radar, ShieldCheck, Target } from "lucide-react";
import type { PremiumProductCode } from "@/lib/premium-products";

type FormState = {
  name: string;
  email: string;
  companyName: string;
  website: string;
  customerJourney: "proof_pack" | "subscriber";
  serviceOffered: string;
  averageClientValue: string;
  targetIndustry: string;
  targetCountries: string;
  companySize: string;
  weeklyOutreachCapacity: string;
  currentLeadGenerationMethod: string;
  region: "US" | "UK" | "EU" | "OTHER";
  country: string;
  consentMarketing: boolean;
};

type QualificationResult = {
  score: number;
  fit: "high" | "medium" | "low";
};

const initialForm: FormState = {
  name: "",
  email: "",
  companyName: "",
  website: "",
  customerJourney: "proof_pack",
  serviceOffered: "",
  averageClientValue: "",
  targetIndustry: "",
  targetCountries: "",
  companySize: "2-10",
  weeklyOutreachCapacity: "",
  currentLeadGenerationMethod: "",
  region: "UK",
  country: "",
  consentMarketing: false,
};

const inputClass = "rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none placeholder:text-violet-100/35 focus:border-fuchsia-300";
const labelClass = "grid gap-1.5 text-sm font-semibold text-violet-50";

export function SalesQualificationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QualificationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setCheckoutError("");
    setErrors({});
    setResult(null);

    try {
      const response = await fetch("/api/sales/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "qualification_page", consentSource: "qualification_page" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.error || "We could not complete the fit check.");
      }
      setResult(data);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "We could not complete the fit check.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startCheckout(product: PremiumProductCode) {
    setCheckoutLoading(product);
    setCheckoutError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          niche: form.targetIndustry,
          customer: {
            email: form.email.trim().toLowerCase(),
            name: form.name,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout could not be started.");
      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout could not be started.");
      setCheckoutLoading("");
    }
  }

  const recommendedProduct: PremiumProductCode = form.customerJourney === "subscriber" ? "radar" : "proof_pack";
  const fitLabel = result?.fit === "high" ? "High fit" : result?.fit === "medium" ? "Medium fit" : "Low fit";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
        <div className="flex items-start gap-3">
          <Target className="mt-1 h-5 w-5 shrink-0 text-fuchsia-300" />
          <div>
            <h2 className="text-2xl font-semibold text-white">Find the right starting point</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Proof Pack is the one-off market test. Radar is for ongoing buyer-intent delivery. This check helps you choose the better first step.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 text-sm text-violet-50">
          {[
            "Match MarketVibe to your offer, target market, and average customer value.",
            "Choose a one-off Proof Pack when you want to test one market first.",
            "Choose Radar when you want recurring buyer-intent opportunities.",
          ].map((item) => (
            <p key={item} className="flex gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" />
              <span>{item}</span>
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Name
              <input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Your name" />
            </label>
            <label className={labelClass}>
              Email
              <input required type="email" className={inputClass} value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" />
              {errors.email && <span className="text-xs text-red-200">{errors.email}</span>}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Company
              <input className={inputClass} value={form.companyName} onChange={(event) => update("companyName", event.target.value)} placeholder="Company name" />
            </label>
            <label className={labelClass}>
              Website
              <input className={inputClass} value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="https://example.com" />
            </label>
          </div>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold text-violet-50">How would you like to start?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["proof_pack", "EUR 99 Proof Pack", "One-off market validation before subscribing."],
                ["subscriber", "Recurring MarketVibe", "Ongoing Radar or Growth Desk delivery."],
              ].map(([value, title, body]) => (
                <label key={value} className={`rounded-lg border p-4 text-sm ${form.customerJourney === value ? "border-fuchsia-300 bg-fuchsia-300/10" : "border-white/10 bg-black/15"}`}>
                  <input
                    type="radio"
                    name="customerJourney"
                    value={value}
                    checked={form.customerJourney === value}
                    onChange={() => update("customerJourney", value as FormState["customerJourney"])}
                    className="sr-only"
                  />
                  <span className="font-semibold text-white">{title}</span>
                  <span className="mt-1 block text-violet-100/65">{body}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className={labelClass}>
            Service offered
            <input required className={inputClass} value={form.serviceOffered} onChange={(event) => update("serviceOffered", event.target.value)} placeholder="Example: web design for trade businesses" />
            {errors.serviceOffered && <span className="text-xs text-red-200">{errors.serviceOffered}</span>}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Average client value
              <input required inputMode="numeric" className={inputClass} value={form.averageClientValue} onChange={(event) => update("averageClientValue", event.target.value)} placeholder="2500" />
              {errors.averageClientValue && <span className="text-xs text-red-200">{errors.averageClientValue}</span>}
            </label>
            <label className={labelClass}>
              Prospects you can review each week
              <input required inputMode="numeric" className={inputClass} value={form.weeklyOutreachCapacity} onChange={(event) => update("weeklyOutreachCapacity", event.target.value)} placeholder="50" />
              {errors.weeklyOutreachCapacity && <span className="text-xs text-red-200">{errors.weeklyOutreachCapacity}</span>}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Target industry
              <input required className={inputClass} value={form.targetIndustry} onChange={(event) => update("targetIndustry", event.target.value)} placeholder="Construction companies" />
              {errors.targetIndustry && <span className="text-xs text-red-200">{errors.targetIndustry}</span>}
            </label>
            <label className={labelClass}>
              Target countries
              <input required className={inputClass} value={form.targetCountries} onChange={(event) => update("targetCountries", event.target.value)} placeholder="UK, Ireland, Germany" />
              {errors.targetCountries && <span className="text-xs text-red-200">{errors.targetCountries}</span>}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Company size
              <select className={inputClass} value={form.companySize} onChange={(event) => update("companySize", event.target.value)}>
                {["Solo", "2-10", "11-50", "51-200", "201-500", "500+"].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              How do you find prospects today?
              <input required className={inputClass} value={form.currentLeadGenerationMethod} onChange={(event) => update("currentLeadGenerationMethod", event.target.value)} placeholder="Google, LinkedIn, referrals, ads" />
              {errors.currentLeadGenerationMethod && <span className="text-xs text-red-200">{errors.currentLeadGenerationMethod}</span>}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
            <label className={labelClass}>
              Region
              <select className={inputClass} value={form.region} onChange={(event) => update("region", event.target.value as FormState["region"])}>
                <option value="US">US</option>
                <option value="UK">UK</option>
                <option value="EU">EU</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className={labelClass}>
              Country
              <input className={inputClass} value={form.country} onChange={(event) => update("country", event.target.value)} placeholder="United Kingdom" />
            </label>
          </div>

          <label className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-violet-100/80">
            <input type="checkbox" checked={form.consentMarketing} onChange={(event) => update("consentMarketing", event.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
            <span>I agree that MarketVibe can use these details to process my request and send product or onboarding emails. I can unsubscribe at any time.</span>
          </label>
          {errors.consentMarketing && <span className="text-xs text-red-200">{errors.consentMarketing}</span>}

          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
            Score my fit
          </button>
        </form>

        {result && (
          <div className="mt-5 rounded-lg border border-fuchsia-300/30 bg-fuchsia-300/10 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-fuchsia-100">MarketVibe fit</p>
                <p className="mt-1 text-3xl font-semibold text-white">{result.score}/100</p>
                <p className="mt-1 text-sm text-violet-100/70">{fitLabel}</p>
              </div>
              <ShieldCheck className="h-9 w-9 text-fuchsia-200" />
            </div>
            <p className="mt-4 text-sm leading-6 text-violet-50/80">
              {recommendedProduct === "proof_pack"
                ? "Recommended next step: start with a Proof Pack to test one market before paying monthly."
                : "Recommended next step: start Radar for recurring buyer-intent opportunities."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => startCheckout(recommendedProduct)} disabled={Boolean(checkoutLoading)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-violet-50 disabled:opacity-60">
                {checkoutLoading === recommendedProduct && <Loader2 className="h-4 w-4 animate-spin" />}
                {recommendedProduct === "proof_pack" ? "Buy Proof Pack" : "Start Radar"}
              </button>
              {recommendedProduct === "radar" && (
                <button type="button" onClick={() => startCheckout("proof_pack")} disabled={Boolean(checkoutLoading)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-60">
                  Try Proof Pack first
                </button>
              )}
            </div>
          </div>
        )}

        {checkoutError && (
          <p className="mt-4 rounded-lg border border-red-300/40 bg-red-950/30 px-4 py-3 text-sm font-semibold text-red-100">
            {checkoutError}
          </p>
        )}
      </section>
    </div>
  );
}
