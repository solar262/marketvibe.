import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Download, FileCheck2, LockKeyhole, Radar, ShieldCheck } from "lucide-react";
import { getPremiumEntitlements, getProofPackItems } from "@/lib/premium-persistence";
import { premiumProductLabel, type PremiumProductCode } from "@/lib/premium-products";
import { getDeliveredProspectsForCustomer, type DeliveredProspect } from "@/lib/sales-navigator-persistence";
import { resolveCustomerAccess } from "@/lib/customer-access";
import { BillingPortalButton } from "@/components/BillingPortalButton";

const products: PremiumProductCode[] = ["proof_pack", "radar", "growth_desk"];

function asProductCode(value: unknown): PremiumProductCode | null {
  return value === "proof_pack" || value === "radar" || value === "growth_desk" ? value : null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; access_token?: string; session_id?: string; delivery_token?: string }>;
}) {
  const { email: rawEmail, access_token: accessToken, session_id: sessionId, delivery_token: deliveryToken } = await searchParams;
  const requestedEmail = (rawEmail || "").trim().toLowerCase();
  const customerAccess = await resolveCustomerAccess({ email: requestedEmail, accessToken, sessionId }).catch(() => ({ ok: false, email: requestedEmail, source: "none" as const, productCode: null }));
  const email = customerAccess.ok ? customerAccess.email : requestedEmail;
  const canLoadPaidWorkspace = Boolean(customerAccess.ok && customerAccess.email);
  const entitlements = canLoadPaidWorkspace ? await getPremiumEntitlements(email).catch(() => []) : [];
  const proofItems = canLoadPaidWorkspace ? await getProofPackItems(email).catch(() => []) : [];
  const importedItems: DeliveredProspect[] = email && deliveryToken ? await getDeliveredProspectsForCustomer(email, deliveryToken).catch(() => []) : [];
  const activeProducts = new Set(
    entitlements
      .map((item: { product_code?: unknown }) => asProductCode(item.product_code))
      .filter((value): value is PremiumProductCode => Boolean(value)),
  );
  const hasAccess = canLoadPaidWorkspace && activeProducts.size > 0;
  const proofCsvParams = new URLSearchParams();
  if (email) proofCsvParams.set("email", email);
  if (accessToken) proofCsvParams.set("access_token", accessToken);
  if (sessionId) proofCsvParams.set("session_id", sessionId);

  return (
    <main className="min-h-screen bg-[#08030f] px-4 py-10 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#a855f7]">Dashboard</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">MarketVibe Workspace</h1>
            <p className="mt-2 max-w-2xl text-violet-100/70">
              Access is based on active paid entitlements tied to your billing email.
            </p>
          </div>
          <Link href="/pricing" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110">
            Upgrade access <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!canLoadPaidWorkspace && importedItems.length === 0 && (
          <form action="/dashboard" className="mt-8 max-w-xl rounded-lg border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <LockKeyhole className="h-6 w-6 text-[#a855f7]" />
            <h2 className="mt-4 text-xl font-semibold">Use your secure access link</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/65">
              Paid dashboards require the secure link from checkout or your MarketVibe access email. Email alone is not enough to open customer data.
            </p>
            <Link href="/contact?offer=access-help" className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white hover:brightness-110">
              Get access help
            </Link>
          </form>
        )}

        {canLoadPaidWorkspace && !hasAccess && (
          <section className="mt-8 rounded-lg border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
            <LockKeyhole className="h-7 w-7" />
            <h2 className="mt-4 text-2xl font-semibold">No active paid entitlement found</h2>
            <p className="mt-2 max-w-2xl leading-7">
              We checked {email}, but did not find active Proof Pack, Radar, or Growth Desk access. Use the same email from checkout or return to pricing.
            </p>
            <Link href="/pricing" className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#16051f]">
              View pricing
            </Link>
          </section>
        )}

        {(hasAccess || importedItems.length > 0) && (
          <>
            {hasAccess && (
              <section className="mt-8 grid gap-4 md:grid-cols-3">
                {products.map((product) => {
                  const active = activeProducts.has(product);
                  return (
                    <div key={product} className={`rounded-lg border p-5 shadow-xl shadow-black/10 backdrop-blur-xl ${active ? "border-violet-300/30 bg-white/8" : "border-white/10 bg-white/5 opacity-60"}`}>
                      {product === "proof_pack" ? <FileCheck2 className="h-6 w-6 text-[#a855f7]" /> : product === "radar" ? <Radar className="h-6 w-6 text-[#a855f7]" /> : <BriefcaseBusiness className="h-6 w-6 text-[#a855f7]" />}
                      <p className="mt-4 text-sm font-semibold text-violet-200">{premiumProductLabel(product)}</p>
                      <p className="mt-2 text-2xl font-semibold">{active ? "Active" : "Not active"}</p>
                      <p className="mt-2 text-sm leading-6 text-violet-100/65">
                        {product === "proof_pack"
                          ? `${proofItems.length} delivered proof-pack rows`
                          : product === "radar"
                            ? "Recurring buyer-intent dashboard access"
                            : "Managed niche and territory delivery"}
                      </p>
                    </div>
                  );
                })}
              </section>
            )}

            <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              {hasAccess && <div className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Proof Pack delivery</h2>
                    <p className="mt-1 text-sm text-violet-100/65">Rows are created from verified saved live signals when available.</p>
                  </div>
                  {proofItems.length > 0 && proofCsvParams.toString() && (
                    <Link href={`/api/proof-pack/csv?${proofCsvParams.toString()}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                      <Download className="h-4 w-4" /> CSV
                    </Link>
                  )}
                </div>
                <div className="mt-5 grid gap-3">
                  {proofItems.length === 0 ? (
                    <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-violet-100/70">
                      No proof-pack rows are ready yet. If you just submitted onboarding, delivery will complete once verified saved signals are available.
                    </p>
                  ) : (
                    proofItems.slice(0, 10).map((item: { id: string; business_name: string; intent_score: number; pain_point: string; source_url?: string | null }) => (
                      <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-semibold">{item.business_name}</h3>
                          <span className="rounded-lg bg-violet-500/20 px-2.5 py-1 text-sm font-semibold text-violet-100">{item.intent_score}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-violet-100/65">{item.pain_point}</p>
                        {item.source_url && <Link href={item.source_url} className="mt-3 inline-flex text-sm font-semibold text-violet-200 hover:text-white">Open source</Link>}
                      </div>
                    ))
                  )}
                </div>
              </div>}

              <div className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <h2 className="text-xl font-semibold">Imported customer delivery</h2>
                <p className="mt-1 text-sm text-violet-100/65">
                  Imported records require the secure delivery link from the MarketVibe email.
                </p>
                <div className="mt-5 grid gap-3">
                  {importedItems.length === 0 ? (
                    <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-violet-100/70">
                      No imported delivery records are visible for this secure link.
                    </p>
                  ) : (
                    importedItems.slice(0, 20).map((item) => (
                      <div key={`${item.id}-${item.delivered_at}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-semibold">{item.company_name}</h3>
                          <span className="rounded-lg bg-violet-500/20 px-2.5 py-1 text-sm font-semibold text-violet-100">Fit {item.fit_score}</span>
                        </div>
                        <p className="mt-1 text-sm text-violet-100/70">{[item.full_name, item.job_title].filter(Boolean).join(" · ")}</p>
                        <p className="mt-2 text-sm leading-6 text-violet-100/65">{item.evidence_summary}</p>
                        <p className="mt-2 text-sm font-semibold text-violet-200">Intent: {item.intent_score ?? "Intent not evidenced"}</p>
                        <p className="mt-2 text-sm leading-6 text-violet-100/65">{item.suggested_outreach_angle}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm">
                          {item.company_website && <Link href={item.company_website} className="text-violet-200 hover:text-white">Website</Link>}
                          {item.linkedin_profile_url && <Link href={item.linkedin_profile_url} className="text-violet-200 hover:text-white">LinkedIn source reference</Link>}
                          {item.public_signal_url && <Link href={item.public_signal_url} className="text-violet-200 hover:text-white">Public signal</Link>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {hasAccess && <div className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <ShieldCheck className="h-6 w-6 text-[#a855f7]" />
                <h2 className="mt-4 text-xl font-semibold">Entitlement check</h2>
                <p className="mt-2 text-sm leading-6 text-violet-100/65">
                  This workspace did not grant access from an email-only query or plan parameter. It loaded active product rows for {email} after secure access verification.
                </p>
                <div className="mt-5 grid gap-2 text-sm text-violet-100/80">
                  {entitlements.map((item: { id: string; product_code: string; status: string }) => (
                    <p key={item.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      {item.product_code} · {item.status}
                    </p>
                  ))}
                </div>
                <div className="mt-5">
                  <BillingPortalButton email={email} accessToken={accessToken} sessionId={sessionId} />
                </div>
              </div>}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
