import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | MarketVibe",
  description: "Refund and cancellation information for MarketVibe.",
};

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Refund Policy</h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: July 2026</p>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Digital access</h2>
        <p className="mt-2 leading-7 text-slate-700">MarketVibe provides digital access and report content. Once access is delivered, purchases may not be refundable unless required by law or agreed in writing.</p>
      </section>
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Subscriptions</h2>
        <p className="mt-2 leading-7 text-slate-700">Radar and Growth Desk are monthly subscriptions handled through Stripe. Contact support for billing or cancellation questions.</p>
      </section>
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Support</h2>
        <p className="mt-2 leading-7 text-slate-700">If payment succeeds but access does not work, contact hello@marketvibe1.com so the issue can be reviewed.</p>
      </section>
    </main>
  );
}
