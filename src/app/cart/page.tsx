"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { hydrateCart } from "@/lib/checkout";
import { money } from "@/lib/data";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const cart = useCart();
  const items = hydrateCart(cart.items);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-stone-950">Cart</h1>
      {items.length === 0 ? (
        <div className="mt-7 rounded-lg border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-semibold text-stone-950">Your cart is empty</p>
          <Link href="/products" className="mt-4 inline-flex rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white">View products</Link>
        </div>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4">
            {items.map((item) => (
              <div key={item.productId} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto]">
                <div className="relative aspect-square overflow-hidden rounded-md bg-stone-100">
                  <Image src={item.product.images[0]} alt={item.product.title} fill sizes="120px" className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-stone-950">{item.product.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{money(item.product.price)} each</p>
                  <div className="mt-4 inline-flex items-center rounded-md border border-stone-200">
                    <button className="px-3 py-2" onClick={() => cart.updateItem(item.productId, item.quantity - 1)}>-</button>
                    <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                    <button className="px-3 py-2" onClick={() => cart.updateItem(item.productId, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 sm:block sm:text-right">
                  <p className="font-semibold text-stone-950">{money(item.lineTotal)}</p>
                  <button aria-label="Remove item" className="mt-3 rounded-md border border-stone-200 p-2 text-stone-500 hover:bg-stone-50" onClick={() => cart.removeItem(item.productId)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between text-sm text-stone-600"><span>Subtotal</span><span className="font-semibold text-stone-950">{money(cart.subtotal)}</span></div>
            <p className="mt-3 text-sm text-stone-600">Taxes and shipping are confirmed in Stripe Checkout.</p>
            <Link href="/checkout" className="mt-5 inline-flex w-full justify-center rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800">Checkout</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
