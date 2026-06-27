export default function CompliancePage() {
  const rules = [
    "Do not send deceptive emails or fake claims.",
    "Identify the sender clearly in every message.",
    "Include unsubscribe or opt-out language.",
    "Keep a suppression list and honor opt-outs.",
    "Do not repeatedly contact the same business.",
    "Rate limit sending and keep automated sending off until reviewed.",
    "Prefer generic business emails such as info@ or contact@ where legally allowed.",
    "Avoid personal emails unless the user has proper lawful basis or consent.",
    "Do not scrape private data or promise guaranteed sales.",
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Compliance</h1>
      <p className="mt-2 text-slate-600">MarketVibe is built for practical public-business auditing, not spam automation.</p>
      <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">Warning before automated sending</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">Review local email marketing, privacy, and anti-spam rules before sending any campaign. Automated sending should remain off until sender identity, opt-out, suppression, and rate-limit settings are configured.</p>
      </section>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">Required outreach rules</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
          {rules.map((rule) => <li key={rule} className="rounded-md bg-slate-50 p-3">{rule}</li>)}
        </ul>
      </section>
    </main>
  );
}
