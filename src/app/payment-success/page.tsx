import Link from "next/link";
import Stripe from "stripe";
import { CheckCircle2, FileSearch, Search } from "lucide-react";
import { deliverStripeSession } from "@/lib/buyer-delivery";
import { TrackEvent } from "@/components/TrackEvent";

async function verifyAndDeliver(sessionId?: string) {
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) return { status: "unknown", message: "Payment received. Delivery will also run through Stripe webhook if configured." };

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid" || session.mode === "subscription") {
      const result = await deliverStripeSession(session);
      if (result.ok) return { status: "sent", message: `Access email sent to ${result.email}.` };
      return { status: "pending", message: result.error || "Payment verified. Email delivery is pending." };
    }
    return { status: "pending", message: "Checkout opened, but Stripe has not marked the payment as paid yet." };
  } catch (error) {
    return { status: "pending", message: error instanceof Error ? error.message : "Unable to verify Stripe session yet." };
  }
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const delivery = await verifyAndDeliver(sessionId);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <TrackEvent name="payment_success" />
      <div className="rounded-lg border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" />
        <h1 className="mt-5 text-3xl font-semibold text-slate-950">Payment complete</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          MarketVibe is set to deliver access automatically after Stripe confirms payment.
        </p>
        <p className={`mx-auto mt-4 max-w-2xl rounded-md p-3 text-sm font-semibold ${delivery.status === "sent" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
          {delivery.message}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Open dashboard
          </Link>
          <Link href="/lead-packs" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">
            <FileSearch className="h-4 w-4" /> View lead packs
          </Link>
          <Link href="/lead-search" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">
            <Search className="h-4 w-4" /> Run lead search
          </Link>
        </div>
        <Link href="/contact" className="mt-5 inline-flex text-sm font-semibold text-slate-950 hover:underline">Need upgrade or account support?</Link>
      </div>
    </main>
  );
}
