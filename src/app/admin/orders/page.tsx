import { money, orders } from "@/lib/data";

export default function AdminOrdersPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-semibold text-stone-950">Orders</h1>
      <div className="mt-6 grid gap-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-semibold text-stone-950">{order.number}</p>
                <p className="text-sm text-stone-600">{order.customerName} / {order.customerEmail}</p>
                <p className="mt-1 text-sm text-stone-600">{order.address}</p>
              </div>
              <div className="text-sm sm:text-right">
                <p className="font-semibold text-stone-950">{money(order.total)}</p>
                <p className="text-emerald-700">Profit {money(order.profit)}</p>
                <p className="text-stone-600">{order.status} / {order.fulfillmentStatus}</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm"><thead className="text-stone-500"><tr><th>Product</th><th>Supplier URL</th><th>Cost</th><th>Price</th><th>Qty</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.productId} className="border-t border-stone-100"><td className="py-2">{item.title}</td><td><a className="font-medium underline" href={item.supplierUrl}>Supplier</a></td><td>{money(item.supplierCost)}</td><td>{money(item.sellingPrice)}</td><td>{item.quantity}</td></tr>)}</tbody></table>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
