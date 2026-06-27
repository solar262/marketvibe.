import { ProductsClient } from "./ProductsClient";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold text-stone-950">Products</h1>
        <p className="mt-2 text-stone-600">Search the catalog, filter by category, and add checkout-ready items to cart.</p>
      </div>
      <ProductsClient initialCategory={params.category} />
    </main>
  );
}
