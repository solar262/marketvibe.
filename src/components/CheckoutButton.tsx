"use client";

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
  function checkout() {
    track("checkout_click", { product, leadSlug: leadSlug || "" });
    window.location.href = stripePaymentLinks[product];
  }

  return (
    <button onClick={checkout} className={className}>
      {children}
    </button>
  );
}
