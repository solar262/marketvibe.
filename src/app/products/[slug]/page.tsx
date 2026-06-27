"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { getProductBySlug, money, products, settings } from "@/lib/data";
import { useCart } from "@/components/CartProvider";
import { ProductCard } from "@/components/ProductCard";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const product = getProductBySlug(params.slug);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem } = useCart();

  if (!product) notFound();
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-white">
            <Image src={product.images[activeImage]} alt={product.title} fill sizes="50vw" className="object-cover" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {product.images.map((image, index) => (
              <button key={image} className="relative aspect-square overflow-hidden rounded-md border border-stone-200 bg-white" onClick={() => setActiveImage(index)}>
                <Image src={image} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          {product.badge && <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">{product.badge}</span>}
          <h1 className="mt-4 text-3xl font-semibold text-stone-950">{product.title}</h1>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-3xl font-semibold text-stone-950">{money(product.price)}</p>
            {product.compareAtPrice && <p className="text-lg text-stone-400 line-through">{money(product.compareAtPrice)}</p>}
          </div>
          <p className="mt-5 leading-7 text-stone-700">{product.description}</p>
          <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-700">
            <p><strong>Shipping estimate:</strong> {product.shippingTime}</p>
            <p className="mt-2">{settings.defaultShippingMessage}</p>
            <div className="mt-3 flex gap-4 font-semibold">
              <Link href="/shipping">Shipping policy</Link>
              <Link href="/refund">Refund policy</Link>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-md border border-stone-200 bg-white">
              <button aria-label="Decrease quantity" className="p-3" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button aria-label="Increase quantity" className="p-3" onClick={() => setQuantity(quantity + 1)}><Plus className="h-4 w-4" /></button>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800" onClick={() => addItem(product.id, quantity)}>
              <ShoppingCart className="h-4 w-4" /> Add to cart
            </button>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-stone-950">Related products</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div>
        </section>
      )}
    </main>
  );
}
