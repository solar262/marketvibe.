"use client";

import { stripePaymentLinks } from "@/lib/checkout-links";

declare global {
  interface Window {
    va?: (event: string, properties?: Record<string, string>) => void;
  }
}

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
  function checkout() {
    window.va?.("checkout_click", { product, leadSlug: leadSlug || "" });
    window.location.href = stripePaymentLinks[product];
  }

  return (
    <button onClick={checkout} className={className}>
      {children}
    </button>
  );
}
