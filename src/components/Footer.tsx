import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-slate-600 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <p className="font-semibold text-white">MarketVibe Lead Engine</p>
          <p className="mt-3 max-w-md leading-6 text-slate-300">Find better business prospects, review visible website opportunities, and create practical audit reports for service outreach.</p>
        </div>
        <div>
          <p className="font-semibold text-white">App</p>
          <div className="mt-3 grid gap-2 text-slate-300">
            <Link href="/lead-search">Find Leads</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/faq">Buyer Q&amp;A</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white">Company</p>
          <div className="mt-3 grid gap-2 text-slate-300">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/impressum">Legal Notice</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
