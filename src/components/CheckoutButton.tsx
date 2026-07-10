"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import type { CheckoutProductCode } from "@/lib/premium-products";

export function CheckoutButton({
  product,
  leadSlug,
  children,
  className,
}: {
  product: CheckoutProductCode;
  leadSlug?: string;
  children: React.ReactNode;
  className: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    if (loading) return;
    setLoading(true);
    setError("");
    track("checkout_click", { product, leadSlug: leadSlug || "" });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, leadSlug: leadSlug || "" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Checkout could not be started.");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Stripe did not return a checkout URL.");
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setLoading(false);
    }
  }

  return (
    <span className="block">
      <button onClick={checkout} disabled={loading} className={className}>
        {loading ? "Opening Stripe..." : children}
      </button>
      {error && (
        <span className="mt-2 block rounded-lg border border-red-300/40 bg-red-950/30 px-3 py-2 text-sm font-semibold text-red-100">
          {error}
        </span>
      )}
    </span>
  );
}
