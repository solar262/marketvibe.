"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export function BillingPortalButton({
  email,
  accessToken,
  sessionId,
}: {
  email: string;
  accessToken?: string;
  sessionId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, accessToken: accessToken || "", sessionId: sessionId || "" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Billing management is unavailable.");
      if (!data.url) throw new Error("Stripe did not return a billing portal URL.");
      window.location.href = data.url;
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Billing management is unavailable.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Manage billing
      </button>
      {error && <p className="mt-2 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">{error}</p>}
    </div>
  );
}
