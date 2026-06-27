import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-slate-600 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <p className="font-semibold text-slate-950">MarketVibe Lead Engine</p>
          <p className="mt-3 max-w-md">Find public business leads, scan visible website signals, and create practical audit reports without deceptive outreach or private-data scraping.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-950">App</p>
          <div className="mt-3 grid gap-2">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/lead-search">Lead Search</Link>
            <Link href="/lead-results">Lead Results</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-950">Company</p>
          <div className="mt-3 grid gap-2">
            <Link href="/contact">Contact</Link>
            <Link href="/compliance">Compliance</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
