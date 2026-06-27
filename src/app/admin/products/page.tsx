import Link from "next/link";
import { Edit, Plus } from "lucide-react";
import { margin, money, products } from "@/lib/data";

export default function AdminProductsPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-semibold text-stone-950">Products</h1><p className="mt-1 text-sm text-stone-600">Search, edit, activate, and feature products.</p></div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add product</Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500"><tr><th className="px-4 py-3">Product</th><th>Price</th><th>Cost</th><th>Margin</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>{products.map((product) => <tr key={product.id} className="border-t border-stone-100"><td className="px-4 py-3 font-medium">{product.title}</td><td>{money(product.price)}</td><td>{money(product.supplierCost)}</td><td>{margin(product)}%</td><td>{product.stock}</td><td>{product.active ? "Active" : "Inactive"}{product.featured ? " / Featured" : ""}</td><td><Link aria-label={`Edit ${product.title}`} href={`/admin/products/${product.id}/edit`}><Edit className="h-4 w-4" /></Link></td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
