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
  const [captureOpen, setCaptureOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      setCaptureOpen(true);
      setError("Enter a valid email address to continue.");
      return;
    }

    setLoading(true);
    setError("");
    track("checkout_submit", { product, leadSlug: leadSlug || "" });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          leadSlug: leadSlug || "",
          customer: { email: normalizedEmail, name },
        }),
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
      {captureOpen ? (
        <form onSubmit={checkout} className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <label className="grid gap-1 text-left text-xs font-semibold uppercase tracking-wide text-violet-100/70">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-fuchsia-300"
              placeholder="you@example.com"
            />
          </label>
          <label className="grid gap-1 text-left text-xs font-semibold uppercase tracking-wide text-violet-100/70">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-fuchsia-300"
              placeholder="Your name"
            />
          </label>
          <button type="submit" disabled={loading} className={className}>
            {loading ? "Opening Stripe..." : children}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            track("checkout_click", { product, leadSlug: leadSlug || "" });
            setCaptureOpen(true);
            setError("");
          }}
          disabled={loading}
          className={className}
        >
          {loading ? "Opening Stripe..." : children}
        </button>
      )}
      {error && (
        <span className="mt-2 block rounded-lg border border-red-300/40 bg-red-950/30 px-3 py-2 text-sm font-semibold text-red-100">
          {error}
        </span>
      )}
    </span>
  );
}
