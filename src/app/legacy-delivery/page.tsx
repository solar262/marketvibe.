import Link from "next/link";
import type { Metadata } from "next";
import { Archive, Download, LockKeyhole } from "lucide-react";
import { resolveCustomerAccess } from "@/lib/customer-access";
import { getProofPackItems } from "@/lib/premium-persistence";
import { getDeliveredProspectsForCustomer, type DeliveredProspect } from "@/lib/sales-navigator-persistence";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LegacyDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; access_token?: string; session_id?: string; delivery_token?: string }>;
}) {
  const { email: rawEmail, access_token: accessToken, session_id: sessionId, delivery_token: deliveryToken } = await searchParams;
  const requestedEmail = (rawEmail || "").trim().toLowerCase();
  const access = await resolveCustomerAccess({ email: requestedEmail, accessToken, sessionId }).catch(() => ({ ok: false, email: requestedEmail }));
  const email = access.ok ? access.email : requestedEmail;
  const proofItems = access.ok ? await getProofPackItems(email).catch(() => []) : [];
  const importedItems: DeliveredProspect[] = email && deliveryToken
    ? await getDeliveredProspectsForCustomer(email, deliveryToken).catch(() => [])
    : [];
  const hasHistoricalDelivery = proofItems.length > 0 || importedItems.length > 0;
  const accessParams = new URLSearchParams();
  if (email) accessParams.set("email", email);
  if (accessToken) accessParams.set("access_token", accessToken);
  if (sessionId) accessParams.set("session_id", sessionId);

  return (
    <main className="min-h-screen bg-[#08030f] px-4 py-10 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <Archive className="h-7 w-7 text-violet-300" />
        <h1 className="mt-4 font-serif text-4xl font-semibold">Historical MarketVibe delivery</h1>
        <p className="mt-3 max-w-3xl leading-7 text-violet-100/70">
          This archive preserves deliveries created by the retired lead-list and imported-prospect workflows. Current Proof Pack, Radar, and Growth Desk deliveries appear only in the verified opportunity workspace.
        </p>

        {!hasHistoricalDelivery && (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-6">
            <LockKeyhole className="h-6 w-6 text-violet-300" />
            <p className="mt-4 text-sm leading-6 text-violet-100/70">No historical delivery was found for this secure link.</p>
          </div>
        )}

        {proofItems.length > 0 && (
          <section className="mt-8 rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Legacy Proof Pack rows</h2>
              <Link href={`/api/proof-pack/csv?${accessParams.toString()}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold">
                <Download className="h-4 w-4" /> Historical CSV
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {proofItems.map((item: { id: string; business_name: string; intent_score: number; pain_point: string; source_url?: string | null }) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <h3 className="font-semibold">{item.business_name}</h3>
                  <p className="mt-2 text-sm text-violet-100/70">Legacy score: {item.intent_score}</p>
                  <p className="mt-2 text-sm leading-6 text-violet-100/65">{item.pain_point}</p>
                  {item.source_url && <Link href={item.source_url} className="mt-3 inline-flex text-sm text-violet-200">Open archived source</Link>}
                </div>
              ))}
            </div>
          </section>
        )}

        {importedItems.length > 0 && (
          <section className="mt-8 rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Legacy imported delivery</h2>
              <Link href={`/api/proof-pack/csv?email=${encodeURIComponent(email)}&delivery_token=${encodeURIComponent(deliveryToken || "")}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold">
                <Download className="h-4 w-4" /> Historical CSV
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {importedItems.map((item) => (
                <div key={`${item.id}-${item.delivered_at}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <h3 className="font-semibold">{item.company_name}</h3>
                  <p className="mt-1 text-sm text-violet-100/70">{[item.full_name, item.job_title].filter(Boolean).join(" · ")}</p>
                  <p className="mt-2 text-sm leading-6 text-violet-100/65">{item.evidence_summary}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Link href={`/dashboard?${accessParams.toString()}`} className="mt-8 inline-flex rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold">Open current opportunity workspace</Link>
      </section>
    </main>
  );
}
