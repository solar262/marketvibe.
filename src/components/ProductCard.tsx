"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/data";
import { useCart } from "./CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <article className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          <Image src={product.images[0]} alt={product.title} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-500 hover:scale-105" />
          {product.badge && <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-xs font-semibold text-stone-900 shadow-sm">{product.badge}</span>}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/products/${product.slug}`} className="font-semibold text-stone-950 hover:underline">
            {product.title}
          </Link>
          <div className="text-right">
            <p className="font-semibold text-stone-950">{money(product.price)}</p>
            {product.compareAtPrice && <p className="text-xs text-stone-400 line-through">{money(product.compareAtPrice)}</p>}
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-stone-600">{product.description}</p>
        {product.affiliateUrl ? (
          <a href={product.affiliateUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold hover:bg-stone-50">
            <ExternalLink className="h-4 w-4" /> View Deal
          </a>
        ) : (
          <button onClick={() => addItem(product.id)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800">
            <ShoppingCart className="h-4 w-4" /> Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
