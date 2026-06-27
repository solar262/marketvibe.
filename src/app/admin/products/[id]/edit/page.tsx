import { notFound } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { products } from "@/lib/data";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((item) => item.id === id);
  if (!product) notFound();
  return <main className="p-4 sm:p-6 lg:p-8"><h1 className="mb-6 text-3xl font-semibold text-stone-950">Edit product</h1><ProductForm product={product} /></main>;
}
