"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { categories, products } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { inputClass } from "@/lib/ui";

export function ProductsClient({ initialCategory }: { initialCategory?: string }) {
  const maxCatalogPrice = Math.ceil(Math.max(...products.map((product) => product.price)));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory || "all");
  const [maxPrice, setMaxPrice] = useState(String(maxCatalogPrice));

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = `${product.title} ${product.description} ${product.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || product.category === category;
      const matchesPrice = product.price <= Number(maxPrice);
      return product.active && matchesQuery && matchesCategory && matchesPrice;
    });
  }, [category, maxPrice, query]);

  return (
    <div>
      <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px]">
        <label className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input className={`${inputClass} pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
        </label>
        <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <label className="grid gap-1 text-xs font-medium text-stone-500">
          Max price: ${maxPrice}
          <input type="range" min="10" max={maxCatalogPrice} value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
        </label>
      </div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      {filtered.length === 0 && (
        <div className="mt-7 rounded-lg border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-semibold text-stone-950">No products found</p>
          <p className="mt-2 text-sm text-stone-600">Try a broader search or a higher max price.</p>
        </div>
      )}
    </div>
  );
}
