"use client";

import { useMemo } from "react";
import { orders } from "@/lib/data";

export default function AdminFulfillmentPage() {
  const paidUnfulfilled = orders.filter((order) => order.status === "paid" && order.fulfillmentStatus !== "shipped");
  const csv = useMemo(() => {
    const rows = [["order", "customer", "product", "quantity", "supplier_url", "supplier_cost", "selling_price"]];
    paidUnfulfilled.forEach((order) => order.items.forEach((item) => rows.push([order.number, order.customerName, item.title, String(item.quantity), item.supplierUrl, String(item.supplierCost), String(item.sellingPrice)])));
    return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  }, [paidUnfulfilled]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-semibold text-stone-950">Fulfillment</h1><p className="mt-1 text-sm text-stone-600">Paid orders waiting on supplier action.</p></div>
        <a download="marketvibe-fulfillment.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white">Export CSV</a>
      </div>
      <div className="mt-6 grid gap-4">
        {paidUnfulfilled.map((order) => (
          <article key={order.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <p className="font-semibold text-stone-950">{order.number} / {order.customerName}</p>
            <ol className="mt-4 grid gap-3 text-sm">
              {order.items.map((item) => (
                <li key={item.productId} className="rounded-md bg-stone-50 p-3">
                  Order {item.quantity} x {item.title} from <a href={item.supplierUrl} className="font-semibold underline">supplier</a>.
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold">Mark ordered from supplier</button>
              <button className="rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold">Mark shipped</button>
              <input className="rounded-md border border-stone-200 px-3 py-2 text-sm" placeholder="Tracking number" />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
