"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { glassInputClass } from "@/lib/ui";
import type { PremiumProductCode } from "@/lib/premium-products";

export function PremiumOnboardingForm({
  productCode,
  sessionId,
  email,
}: {
  productCode: PremiumProductCode;
  sessionId?: string;
  email?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Onboarding could not be submitted.");
      router.push(result.dashboardUrl || "/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Onboarding could not be submitted.");
      setLoading(false);
    }
  }

  const productSpecific =
    productCode === "proof_pack"
      ? [
          ["exclusions", "Exclusions", "Competitors, regions, company types, or leads you do not want included."],
        ]
      : productCode === "radar"
        ? [
            ["opportunityPreferences", "Opportunity preferences", "Signals, company types, and opportunity patterns you want prioritized."],
            ["dashboardChecklist", "Dashboard checklist", "What your first recurring dashboard should help you review."],
            ["exportPreferences", "Export preferences", "CSV fields, delivery frequency, or workflow preferences."],
          ]
        : [
            ["dealValue", "Typical deal value", "Approximate deal value or account size you want MarketVibe to prioritize."],
            ["exclusions", "Exclusions", "Competitors, regions, company types, or leads you do not want included."],
            ["deliveryRecipients", "Delivery recipients", "Who should receive delivery emails or reports."],
            ["reportingPreference", "Reporting preference", "Weekly summary, CSV-first delivery, dashboard review, or other preference."],
          ];

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4">
      <input type="hidden" name="productCode" value={productCode} />
      <input type="hidden" name="sessionId" value={sessionId || ""} />
      <label className="grid gap-1 text-sm font-semibold text-violet-100">
        Email
        <input required name="email" type="email" defaultValue={email} className={glassInputClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-violet-100">
          Name
          <input name="name" className={glassInputClass} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-violet-100">
          Company
          <input name="company" className={glassInputClass} />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-semibold text-violet-100">
        Website
        <input name="website" className={glassInputClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-sm font-semibold text-violet-100">
          Niche
          <input required name="niche" className={glassInputClass} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-violet-100">
          Country
          <input required name="country" className={glassInputClass} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-violet-100">
          City
          <input name="city" className={glassInputClass} />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-violet-100">
          Territory
          <input name="territory" className={glassInputClass} />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-semibold text-violet-100">
        Service or offer
        <textarea required name="serviceOffer" rows={3} className={glassInputClass} />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-violet-100">
        Ideal buyer
        <textarea required name="idealBuyer" rows={3} className={glassInputClass} />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-violet-100">
        Optional notes
        <textarea name="notes" rows={3} className={glassInputClass} />
      </label>
      <div className="grid gap-4">
        {productSpecific.map(([name, label, placeholder]) => (
          <label key={name} className="grid gap-1 text-sm font-semibold text-violet-100">
            {label}
            <textarea name={name} rows={3} placeholder={placeholder} className={glassInputClass} />
          </label>
        ))}
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-6 text-violet-100">
        <input required name="acknowledgement" value="yes" type="checkbox" className="mt-1" />
        <span>
          I understand MarketVibe uses verified public/source-backed information where available, does not guarantee replies, clients, sales, or revenue, and will not fabricate missing opportunities.
        </span>
      </label>
      <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-70">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Submit onboarding
      </button>
      {error && <p className="rounded-lg border border-red-300/30 bg-red-950/40 p-3 text-sm font-semibold text-red-100">{error}</p>}
    </form>
  );
}
