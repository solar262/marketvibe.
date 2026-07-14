import Link from "next/link";
import Stripe from "stripe";
import { CheckCircle2, FileCheck2, Radar } from "lucide-react";
import { classifyStripeSession, deliverStripeSession } from "@/lib/buyer-delivery";
import { normalizeCheckoutProduct, onboardingPathForProduct, premiumProductLabel, type PremiumProductCode } from "@/lib/premium-products";
import { TrackEvent } from "@/components/TrackEvent";

type DeliveryState = {
  status: "sent" | "pending" | "unknown";
  message: string;
  product: PremiumProductCode;
  email?: string;
};

async function verifyAndDeliver(sessionId?: string, fallbackProduct?: string): Promise<DeliveryState> {
  const fallback = normalizeCheckoutProduct(fallbackProduct);
  if (!sessionId || sessionId === "demo" || !process.env.STRIPE_SECRET_KEY) {
    return {
      status: "unknown",
      product: fallback,
      message: "Payment has returned to MarketVibe. Your access email will be sent when payment confirmation is available.",
    };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const product = classifyStripeSession(session);
    if (session.payment_status === "paid" || session.mode === "subscription") {
      const result = await deliverStripeSession(session);
      if (result.ok) {
        return { status: "sent", product: result.product || product, email: result.email, message: `Access email sent to ${result.email}.` };
      }
      return { status: "pending", product, message: result.error || "Payment verified. Email delivery is pending." };
    }
    return { status: "pending", product, message: "Checkout opened, but Stripe has not marked the payment as paid yet." };
  } catch (error) {
    return {
      status: "pending",
      product: fallback,
      message: error instanceof Error ? error.message : "Unable to verify Stripe session yet.",
    };
  }
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; product?: string }>;
}) {
  const { session_id: sessionId, product } = await searchParams;
  const delivery = await verifyAndDeliver(sessionId, product);
  const continueHref = onboardingPathForProduct(delivery.product, sessionId, delivery.email);

  return (
    <main className="min-h-screen bg-[#08030f] px-4 py-16 text-white sm:px-6 lg:px-8">
      <TrackEvent name="payment_success" />
      <div className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-violet-950/30 backdrop-blur-xl">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#a855f7]" />
        <h1 className="mt-5 font-serif text-4xl font-semibold">Payment complete</h1>
        <p className="mx-auto mt-3 max-w-2xl text-violet-100/70">
          {premiumProductLabel(delivery.product)} is now being delivered through the premium product flow.
        </p>
        <p className={`mx-auto mt-4 max-w-2xl rounded-lg border p-3 text-sm font-semibold ${delivery.status === "sent" ? "border-violet-300/30 bg-violet-400/10 text-violet-100" : "border-amber-300/25 bg-amber-300/10 text-amber-100"}`}>
          {delivery.message}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={continueHref} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110">
            {delivery.product === "radar" ? <Radar className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4" />}
            Continue
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Open dashboard
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Support
          </Link>
        </div>
      </div>
    </main>
  );
}
