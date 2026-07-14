import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Security and Responsible Disclosure</h1>
      <div className="mt-6 grid gap-4 leading-7 text-slate-600">
        <p>MarketVibe1 keeps sensitive credentials and admin access controls out of public browser pages.</p>
        <p>Paid dashboard links use secure access checks before customer data is shown.</p>
        <p>If you believe you found a security issue, do not access customer data or disrupt the service. Send a concise report with steps to reproduce through the contact form.</p>
      </div>
      <Link href="/contact?offer=security-report" className="mt-6 inline-flex font-semibold text-slate-950 underline">Submit a security report</Link>
    </main>
  );
}
