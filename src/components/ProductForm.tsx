"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { categories, margin } from "@/lib/data";
import { buttonClass, inputClass, secondaryButtonClass } from "@/lib/ui";

export function ProductForm({ product }: { product?: Product }) {
  const [cost, setCost] = useState(product?.supplierCost ?? 0);
  const [price, setPrice] = useState(product?.price ?? 0);
  const profitMargin = useMemo(() => margin({ supplierCost: cost, price }), [cost, price]);

  return (
    <form className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Product title<input className={inputClass} defaultValue={product?.title} /></label>
        <label className="grid gap-1 text-sm font-medium">Slug<input className={inputClass} defaultValue={product?.slug} /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium">Description<textarea rows={4} className={inputClass} defaultValue={product?.description} /></label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">Category<select className={inputClass} defaultValue={product?.category}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Supplier name<input className={inputClass} defaultValue={product?.supplierName} /></label>
        <label className="grid gap-1 text-sm font-medium">Supplier URL<input className={inputClass} defaultValue={product?.supplierUrl} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="grid gap-1 text-sm font-medium">Supplier cost<input type="number" step="0.01" className={inputClass} value={cost} onChange={(event) => setCost(Number(event.target.value))} /></label>
        <label className="grid gap-1 text-sm font-medium">Selling price<input type="number" step="0.01" className={inputClass} value={price} onChange={(event) => setPrice(Number(event.target.value))} /></label>
        <label className="grid gap-1 text-sm font-medium">Compare-at price<input type="number" step="0.01" className={inputClass} defaultValue={product?.compareAtPrice} /></label>
        <div className="rounded-md bg-emerald-50 p-3 text-sm">
          <p className="font-semibold text-emerald-900">{profitMargin}% margin</p>
          <p className="text-emerald-700">Auto-calculated</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="grid gap-1 text-sm font-medium">SKU<input className={inputClass} defaultValue={product?.sku} /></label>
        <label className="grid gap-1 text-sm font-medium">Stock<input type="number" className={inputClass} defaultValue={product?.stock} /></label>
        <label className="grid gap-1 text-sm font-medium">Shipping time<input className={inputClass} defaultValue={product?.shippingTime} /></label>
        <label className="grid gap-1 text-sm font-medium">Tags<input className={inputClass} defaultValue={product?.tags.join(", ")} /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium">Image URLs<textarea rows={2} className={inputClass} defaultValue={product?.images.join("\n")} /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">SEO title<input className={inputClass} defaultValue={product?.seoTitle} /></label>
        <label className="grid gap-1 text-sm font-medium">SEO description<input className={inputClass} defaultValue={product?.seoDescription} /></label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" defaultChecked={product?.active ?? true} /> Active</label>
        <label className="flex items-center gap-2"><input type="checkbox" defaultChecked={product?.featured ?? false} /> Featured</label>
      </div>
      <div className="flex gap-3">
        <button type="button" className={buttonClass}>Save product</button>
        <button type="reset" className={secondaryButtonClass}>Reset</button>
      </div>
    </form>
  );
}
