"use client";

import { useState } from "react";
import { hydrateCart } from "@/lib/checkout";
import { money } from "@/lib/data";
import { inputClass } from "@/lib/ui";
import { useCart } from "@/components/CartProvider";

export default function CheckoutPage() {
  const cart = useCart();
  const items = hydrateCart(cart.items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cart: cart.items,
        customer: Object.fromEntries(form.entries()),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Checkout failed");
      setLoading(false);
      return;
    }
    cart.clearCart();
    window.location.href = payload.url;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-stone-950">Checkout</h1>
      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={checkout} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <label className="grid gap-1 text-sm font-medium">Name<input required name="name" className={inputClass} /></label>
          <label className="grid gap-1 text-sm font-medium">Email<input required type="email" name="email" className={inputClass} /></label>
          <label className="grid gap-1 text-sm font-medium">Shipping address<textarea required name="address" rows={4} className={inputClass} /></label>
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading || items.length === 0} className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Opening Stripe..." : "Continue to Stripe"}
          </button>
        </form>
        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-stone-950">Order summary</p>
          <div className="mt-4 grid gap-3 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-4">
                <span>{item.product.title} x {item.quantity}</span>
                <span>{money(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-stone-200 pt-4 font-semibold"><div className="flex justify-between"><span>Total</span><span>{money(cart.subtotal)}</span></div></div>
        </aside>
      </div>
    </main>
  );
}
