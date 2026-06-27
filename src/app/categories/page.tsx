import Image from "next/image";
import Link from "next/link";
import { categories, products } from "@/lib/data";

export default function CategoriesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-stone-950">Categories</h1>
      <p className="mt-2 text-stone-600">Open a filtered product list by category.</p>
      <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/products?category=${category.id}`} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3]">
              <Image src={category.image} alt={category.name} fill sizes="25vw" className="object-cover" />
            </div>
            <div className="p-4">
              <p className="font-semibold text-stone-950">{category.name}</p>
              <p className="mt-1 text-sm text-stone-600">{category.description}</p>
              <p className="mt-3 text-sm font-semibold text-stone-950">{products.filter((product) => product.category === category.id).length} products</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
