"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { Loader2 } from "lucide-react";

const paymentLinks: Record<"audit" | "starter" | "pro", string> = {
  audit: "https://buy.stripe.com/bJebJ11CTeBIdmafmW3ks0h",
  starter: "https://buy.stripe.com/6oUaEX2GX1OWfui6Qq3ks0i",
  pro: "https://buy.stripe.com/fZucN5ftJdxEbe2caK3ks0g",
};

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
    setLoading(true);
    track("checkout_clicked", { product, lead_slug: leadSlug || "" });

    const directLink = paymentLinks[product];
    if (directLink) {
      window.location.href = directLink;
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, leadSlug }),
    });
    const data = await response.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  return (
    <button onClick={checkout} disabled={loading} className={className}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
