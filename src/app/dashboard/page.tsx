import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BriefcaseBusiness, Download, FileCheck2, LockKeyhole, Radar, ShieldCheck } from "lucide-react";
import { getPremiumEntitlements, getProofPackItems } from "@/lib/premium-persistence";
import { premiumProductLabel, type PremiumProductCode } from "@/lib/premium-products";
import { getDeliveredProspectsForCustomer, type DeliveredProspect } from "@/lib/sales-navigator-persistence";
import { resolveCustomerAccess } from "@/lib/customer-access";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { OpportunityFeedbackForm } from "@/components/OpportunityFeedbackForm";
import { customerFeedbackStatusFromMatchReason, getCustomerOpportunityDeliveries } from "@/lib/opportunity-engine";

const products: PremiumProductCode[] = ["proof_pack", "radar", "growth_desk"];

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

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
  const opportunityItems = canLoadPaidWorkspace ? await getCustomerOpportunityDeliveries(email).catch(() => []) : [];
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
              Access is based on your paid MarketVibe purchase and secure customer link.
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
              Paid workspaces require the secure link from checkout or your MarketVibe access email. Email alone is not enough to open customer data.
            </p>
            <Link href="/contact?offer=access-help" className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white hover:brightness-110">
              Get access help
            </Link>
          </form>
        )}

        {canLoadPaidWorkspace && !hasAccess && (
          <section className="mt-8 rounded-lg border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
            <LockKeyhole className="h-7 w-7" />
            <h2 className="mt-4 text-2xl font-semibold">No active paid access found</h2>
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
                            ? "Recurring buyer-intent workspace access"
                            : "Managed niche and territory delivery"}
                      </p>
                    </div>
                  );
                })}
              </section>
            )}

            <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              {hasAccess && <div className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-xl lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Verified opportunity delivery</h2>
                    <p className="mt-1 text-sm text-violet-100/65">Source-backed opportunities matched to your onboarding profile.</p>
                  </div>
                  {opportunityItems.length > 0 && (
                    <Link href={`/api/opportunities/csv?${proofCsvParams.toString()}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                      <Download className="h-4 w-4" /> Opportunity CSV
                    </Link>
                  )}
                </div>
                <div className="mt-5 grid gap-3">
                  {opportunityItems.length === 0 ? (
                    <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-violet-100/70">
                      No opportunity deliveries are ready yet. MarketVibe publishes only when there is enough relevant context for your profile.
                    </p>
                  ) : (
                    opportunityItems.slice(0, 30).map((assignment: Record<string, unknown>) => {
                      const item = (assignment.opportunities || {}) as Record<string, unknown>;
                      const scoreReasons = item.score_reasons && typeof item.score_reasons === "object" ? item.score_reasons as Record<string, unknown> : {};
                      const feedbackStatus = customerFeedbackStatusFromMatchReason(assignment.match_reason);
                      return (
                        <div key={String(assignment.id)} className="rounded-lg border border-white/10 bg-black/20 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-semibold">{String(item.company_name || "")}</h3>
                            <span className="rounded-lg bg-violet-500/20 px-2.5 py-1 text-sm font-semibold text-violet-100">Overall {String(item.overall_score || 0)}</span>
                          </div>
                          <p className="mt-1 text-sm text-violet-100/70">{[item.contact_full_name, item.contact_job_title].filter(Boolean).map(String).join(" · ") || "No verified decision-maker supplied"}</p>
                          <p className="mt-2 text-sm leading-6 text-violet-100/65">{String(item.customer_summary || item.source_text || "")}</p>
                          <div className="mt-3 grid gap-2 text-sm text-violet-100/70 md:grid-cols-4">
                            <p><span className="font-semibold text-violet-100">Fit:</span> {String(item.fit_score || 0)}</p>
                            <p><span className="font-semibold text-violet-100">Intent:</span> {String(item.intent_score || 0)}</p>
                            <p><span className="font-semibold text-violet-100">Evidence:</span> {String(item.evidence_score || 0)}</p>
                            <p><span className="font-semibold text-violet-100">Freshness:</span> {String(item.freshness_score || 0)}</p>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-violet-100/65">
                            {Array.isArray(scoreReasons.intent) ? scoreReasons.intent.join(" ") : String(item.intent_category || "")}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-violet-200">{String(item.recommended_action || "")}</p>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm">
                            {item.company_website ? <Link href={String(item.company_website)} className="text-violet-200 hover:text-white">Website</Link> : null}
                            {item.source_url ? <Link href={String(item.source_url)} className="text-violet-200 hover:text-white">Source evidence</Link> : null}
                          </div>
                          <p className="mt-3 text-xs text-violet-100/50">Found {String(item.captured_at || "").slice(0, 10)} · verified {String(item.last_verified_at || "pending").slice(0, 10)} · delivered {String(assignment.delivered_at || "").slice(0, 10)}</p>
                          <OpportunityFeedbackForm assignmentId={String(assignment.id)} email={email} accessToken={accessToken} sessionId={sessionId} initialStatus={feedbackStatus} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>}

              {hasAccess && <div className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Proof Pack delivery</h2>
                    <p className="mt-1 text-sm text-violet-100/65">Rows are created from source-backed live signals when available.</p>
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
                      No proof-pack rows are ready yet. If you just submitted onboarding, delivery will complete once relevant source-backed signals are available.
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
                <h2 className="mt-4 text-xl font-semibold">Access check</h2>
                <p className="mt-2 text-sm leading-6 text-violet-100/65">
                  This workspace is protected by your secure customer access link for {email}.
                </p>
                <div className="mt-5 grid gap-2 text-sm text-violet-100/80">
                  {entitlements.map((item: { id: string; product_code: string; status: string }) => (
                    <p key={item.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      {premiumProductLabel(asProductCode(item.product_code) || "proof_pack")} · {item.status}
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
