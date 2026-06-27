import Link from "next/link";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="rounded-lg border border-stone-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">Payment received</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">Thank you for your order</h1>
        <p className="mt-4 text-stone-600">Order number: <strong>{params.order || "pending Stripe confirmation"}</strong></p>
        <p className="mt-3 text-stone-600">You will receive an email confirmation and tracking details once the supplier order is placed.</p>
        <Link href="/products" className="mt-6 inline-flex rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white">Continue shopping</Link>
      </div>
    </main>
  );
}
