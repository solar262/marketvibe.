import Link from "next/link";
import { CheckCircle2, FileSearch, Search } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" />
        <h1 className="mt-5 text-3xl font-semibold text-slate-950">Next steps</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Thanks for choosing MarketVibe. If your Stripe payment completed successfully, use the links below to continue. Payment verification depends on Stripe webhook configuration.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Open dashboard
          </Link>
          <Link href="/lead-packs" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">
            <FileSearch className="h-4 w-4" /> View lead packs
          </Link>
          <Link href="/lead-search" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">
            <Search className="h-4 w-4" /> Run lead search
          </Link>
        </div>
        <Link href="/contact" className="mt-5 inline-flex text-sm font-semibold text-slate-950 hover:underline">Need upgrade or account support?</Link>
      </div>
    </main>
  );
}
