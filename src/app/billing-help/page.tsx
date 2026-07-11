import Link from "next/link";

export default function BillingHelpPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Billing Help</h1>
      <div className="mt-6 grid gap-4 leading-7 text-slate-600">
        <p>MarketVibe1 card payments, invoices, payment method updates, and subscription cancellations are handled by Stripe.</p>
        <p>Use the secure billing button in your dashboard to open Stripe Customer Portal. The portal requires a verified customer access link and an active Stripe customer record.</p>
        <p>Proof Pack is a one-off digital purchase. Radar and Growth Desk are monthly subscriptions. Cancellation stops future renewals according to Stripe subscription status and the paid access period recorded by the webhook.</p>
        <p>If your payment fails, update your payment method in Stripe Customer Portal. Access may become unavailable while the subscription is past due or cancelled.</p>
      </div>
      <Link href="/contact?offer=billing-help" className="mt-6 inline-flex font-semibold text-slate-950 underline">Get billing support</Link>
    </main>
  );
}
