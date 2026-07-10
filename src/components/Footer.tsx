import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#08030f] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-slate-600 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <p className="font-semibold text-white">MarketVibe</p>
          <p className="mt-3 max-w-md leading-6 text-slate-300">Buyer-intent intelligence for agencies, consultants, and growth teams that need clearer opportunities before outreach.</p>
        </div>
        <div>
          <p className="font-semibold text-white">App</p>
          <div className="mt-3 grid gap-2 text-slate-300">
            <Link href="/engine">Engine</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/sample">Proof Pack</Link>
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
            <Link href="/billing-help">Billing Help</Link>
            <Link href="/acceptable-use">Acceptable Use</Link>
            <Link href="/data-requests">Data Requests</Link>
            <Link href="/security">Security</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/impressum">Legal Notice</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
