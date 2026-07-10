import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { productFromOnboardingSlug, verifyPremiumAccess } from "@/lib/premium-access";
import { premiumProductLabel } from "@/lib/premium-products";
import { PremiumOnboardingForm } from "@/components/PremiumOnboardingForm";

export default async function PremiumOnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ product: string }>;
  searchParams: Promise<{ session_id?: string; email?: string }>;
}) {
  const { product } = await params;
  const productCode = productFromOnboardingSlug(product);
  if (!productCode) redirect("/pricing");

  const { session_id: sessionId, email } = await searchParams;
  const access = await verifyPremiumAccess({ productCode, sessionId, email });

  if (!access.ok) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
          <h1 className="text-3xl font-semibold">Access verification needed</h1>
          <p className="mt-3 leading-7">
            We could not verify a paid {premiumProductLabel(productCode)} session or active entitlement.
          </p>
          <Link href="/pricing" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Return to pricing
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08030f] px-4 py-12 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200">
          <CheckCircle2 className="h-4 w-4" />
          Paid access verified
        </p>
        <h1 className="mt-5 text-4xl font-bold">{premiumProductLabel(productCode)} onboarding</h1>
        <p className="mt-4 max-w-2xl leading-7 text-violet-100/75">
          Tell us the niche, territory, offer, and buyer profile. MarketVibe will use verified saved
          signals where available and will not pad packs with fabricated companies.
        </p>

        <PremiumOnboardingForm productCode={productCode} sessionId={sessionId} email={access.email || email} />
      </section>
    </main>
  );
}
