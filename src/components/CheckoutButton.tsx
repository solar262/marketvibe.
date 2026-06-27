"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

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
