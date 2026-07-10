"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { Loader2 } from "lucide-react";
import { glassInputClass } from "@/lib/ui";

export function SampleCheckoutForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const name = String(form.get("name") || "");
    track("proof_pack_form_submit", { product: "proof_pack" });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: "proof_pack",
          customer: { email, name },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Proof Pack checkout could not be started.");
      if (!data.url) throw new Error("Stripe did not return a checkout URL.");
      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Proof Pack checkout could not be started.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div>
        <p className="text-sm font-semibold text-violet-200">Proof Pack</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Start checkout</h2>
        <p className="mt-2 text-sm leading-6 text-violet-100/65">
          Pay €99 by card, then complete onboarding so your pack can be built from verified saved signals.
        </p>
      </div>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-violet-100">
          Email
          <input required name="email" type="email" className={glassInputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-violet-100">
          Name
          <input name="name" className={glassInputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-violet-100">
          Niche you want to validate
          <input name="niche" className={glassInputClass} placeholder="Example: B2B SaaS agencies in Germany" />
        </label>
      </div>
      <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-70">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Get proof pack
      </button>
      {error && <p className="mt-4 rounded-lg border border-red-300/30 bg-red-950/40 p-3 text-sm font-semibold text-red-100">{error}</p>}
    </form>
  );
}
