import Link from "next/link";
import { Download, HelpCircle, LockKeyhole } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { findLeadBySlug } from "@/lib/lead-engine";
import { getAuditBySlugFromSupabase } from "@/lib/lead-persistence";

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ unlocked?: string }>;
}) {
  const { slug } = await params;
  const { unlocked } = await searchParams;
  const lead = (await getAuditBySlugFromSupabase(slug)) || findLeadBySlug(slug);
  const isUnlocked = unlocked === "1";
  const visibleIssues = lead.audit.issues.slice(0, 3);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className={`text-sm font-semibold ${lead.sourceStatus === "live" ? "text-emerald-700" : "text-amber-700"}`}>
              {lead.sourceStatus === "live" ? "LIVE public audit preview" : "Sample audit preview"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{lead.businessName}</h1>
            <p className="mt-2 text-slate-600">{lead.city}, {lead.country} · {lead.businessCategory}</p>
          </div>
          <div className="grid h-24 w-24 place-items-center rounded-md bg-slate-950 text-3xl font-semibold text-white">
            {lead.audit.score}
          </div>
        </div>

        <section className="mt-8">
          {lead.sourceStatus !== "live" && (
            <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
              Sample preview. Run Lead Search to create live public-data audit results.
            </div>
          )}
          <h2 className="text-xl font-semibold text-slate-950">Visible Issues</h2>
          <div className="mt-4 grid gap-3">
            {visibleIssues.map((issue) => (
              <div key={issue} className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{issue}</div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="font-semibold text-emerald-950">Short problem summary</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900">{lead.audit.summary}</p>
        </section>

        {!isUnlocked ? (
          <section className="mt-8 rounded-lg border border-slate-200 bg-slate-950 p-6 text-white">
            <LockKeyhole className="h-7 w-7 text-emerald-300" />
            <h2 className="mt-4 text-2xl font-semibold">Unlock Full Report for this business</h2>
            <p className="mt-2 max-w-2xl text-slate-300">
              The €19 Full Audit Report unlocks this selected business audit. You get full lead details, all scanner findings, outreach message, fix checklist, suggested service angle, and report-ready content.
            </p>
            <div className="mt-5 rounded-md border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
              <strong className="text-white">How buyers can use it:</strong> prepare a stronger pitch, proposal, consultation, or service offer for this business owner. MarketVibe does not guarantee replies, clients, income, or sales.
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CheckoutButton product="audit" leadSlug={lead.slug} className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">
                Pay €19 with Stripe
              </CheckoutButton>
              <Link href="/faq" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                <HelpCircle className="h-4 w-4" /> Read Buyer Q&amp;A
              </Link>
              <Link href="/terms" className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                Terms
              </Link>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">By continuing to Stripe, the buyer agrees to the MarketVibe Terms of Service.</p>
          </section>
        ) : (
          <section className="mt-8 grid gap-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h2 className="font-semibold text-slate-950">Full Lead Details</h2>
              <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <span>Website: {lead.website}</span>
                <span>Contact page: {lead.contactPageUrl || "Not detected"}</span>
                <span>Email: {lead.publicEmail || "Not visible"}</span>
                <span>Phone: {lead.phone || "Not visible"}</span>
                <span>Google profile: {lead.googleProfileUrl}</span>
                <span>Social links: {lead.socialLinks.length ? lead.socialLinks.join(", ") : "Not visible"}</span>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-950">Specific Issues Found</h2>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                  {lead.audit.issues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-950">Fix Checklist</h2>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                  {lead.audit.fixChecklist.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">Outreach Message</h2>
              <p className="mt-3 whitespace-pre-line rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{lead.audit.outreachMessage}</p>
              <p className="mt-4 text-sm text-slate-700"><strong>Subject:</strong> {lead.audit.subjectLine}</p>
              <p className="mt-2 text-sm text-slate-700"><strong>Suggested offer:</strong> {lead.audit.suggestedOffer}</p>
            </div>
            <button className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-950">
              <Download className="h-4 w-4" /> PDF-ready export
            </button>
          </section>
        )}
      </div>

      <Link href="/lead-results" className="mt-6 inline-flex text-sm font-semibold text-slate-950 hover:underline">Back to lead results</Link>
    </main>
  );
}
