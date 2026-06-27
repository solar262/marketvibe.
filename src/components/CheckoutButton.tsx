"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { stripePaymentLinks } from "@/lib/checkout-links";

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

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, leadSlug: leadSlug || "" }),
      });
      const data = await response.json();
      window.location.href = data.url || stripePaymentLinks[product];
    } catch {
      window.location.href = stripePaymentLinks[product];
    }
  }

  return (
    <button onClick={checkout} disabled={loading} className={className}>
      {loading ? "Opening checkout..." : children}
    </button>
  );
}
