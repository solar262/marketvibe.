import { CheckoutButton } from "@/components/CheckoutButton";

export default function PricingPage() {
  const plans = [
    ["Free", "€0", "3 sample leads", "Use the sample lead set and audit preview pages.", null],
    ["Starter", "€19/month", "50 leads/month", "For freelancers starting weekly prospecting.", "starter"],
    ["Pro", "€49/month", "250 leads/month", "For agencies and service sellers running regular campaigns.", "pro"],
  ] as const;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Pricing</h1>
      <p className="mt-2 max-w-2xl text-slate-600">Pay for leads and automated business audits. No guaranteed sales claims, no hidden sender identity, and no private-data scraping.</p>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map(([name, price, limit, body, product]) => (
          <div key={name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">{name}</h2>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{price}</p>
            <p className="mt-2 font-medium text-emerald-700">{limit}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            {product ? (
              <CheckoutButton product={product} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Start {name}
              </CheckoutButton>
            ) : (
              <a href="/lead-search" className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">Try Free</a>
            )}
          </div>
        ))}
      </section>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">One-off full audit report</h2>
        <p className="mt-2 text-slate-600">€19 per business audit report. Unlocks the full audit, lead details, outreach message, fix checklist, and PDF-ready report content.</p>
        <CheckoutButton product="audit" className="mt-5 inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Buy Audit Report
        </CheckoutButton>
      </section>
    </main>
  );
}
