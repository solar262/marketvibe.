"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

export function CheckoutButton({
  product,
  leadSlug,
  children,
  className,
}: {
  product: "audit" | "starter" | "pro";
  leadSlug?: string;
  children: React.ReactNode;
  className: string;
}) {
  const [loading, setLoading] = useState(false);

  async function checkout() {
    if (loading) return;
    setLoading(true);
    track("checkout_click", { product, leadSlug: leadSlug || "" });

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, leadSlug: leadSlug || "" }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setLoading(false);
  }

  return (
    <button onClick={checkout} disabled={loading} className={className}>
      {loading ? "Opening Stripe..." : children}
    </button>
  );
}
