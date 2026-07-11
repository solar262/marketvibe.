import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Security and Responsible Disclosure</h1>
      <div className="mt-6 grid gap-4 leading-7 text-slate-600">
        <p>MarketVibe1 keeps service-role database keys, Stripe secrets, Brevo API keys, and admin credentials on the server. They must not be placed in browser JavaScript or committed to the repository.</p>
        <p>Paid dashboard links use server-side entitlement checks and signed access links. Imported delivery CSVs use secure delivery tokens.</p>
        <p>If you believe you found a security issue, do not access customer data or disrupt the service. Send a concise report with steps to reproduce through the contact form.</p>
      </div>
      <Link href="/contact?offer=security-report" className="mt-6 inline-flex font-semibold text-slate-950 underline">Submit a security report</Link>
    </main>
  );
}
