import Link from "next/link";

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Cookie Information</h1>
      <p className="mt-4 leading-7 text-slate-600">
        MarketVibe1 uses cookies or similar browser storage for essential site functions such as admin login, checkout return flows, security, and basic analytics. Payment cookies and fraud checks may also be set by Stripe during checkout.
      </p>
      <div className="mt-6 grid gap-4 text-sm leading-6 text-slate-600">
        <p><strong>Essential cookies:</strong> required for login, security, and checkout continuity.</p>
        <p><strong>Analytics:</strong> used to understand page visits and product interest without promising outcomes.</p>
        <p><strong>Third parties:</strong> Vercel, Stripe, Brevo, and Supabase may process limited data needed to operate the service.</p>
      </div>
      <Link href="/privacy" className="mt-6 inline-flex font-semibold text-slate-950 underline">Read the privacy policy</Link>
    </main>
  );
}
