import Link from "next/link";
import { Download, HelpCircle, LockKeyhole } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { findLeadBySlug } from "@/lib/lead-engine";
import { getAuditBySlugFromSupabase } from "@/lib/lead-persistence";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mainIssue(issue?: string) {
  return (issue || "website visibility gaps").split(":")[0].toLowerCase();
}

function businessAudience(value: string) {
  const normalized = value.toLowerCase().trim();
  const map: Record<string, string> = {
    roofers: "roofing businesses",
    plumbers: "plumbing businesses",
    cleaners: "cleaning businesses",
    dentists: "dental clinics",
    gyms: "fitness businesses",
    cafes: "cafes",
    restaurants: "restaurants",
    salons: "salons",
    barbers: "barbershops",
    "local shops": "local shops",
    "ecommerce stores": "ecommerce stores",
  };
  return map[normalized] || normalized || "local businesses";
}

function isUsefulContactPageUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();
    if (/\.(css|js|json|xml|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|map|pdf)$/i.test(pathname)) return false;
    if (/\/wp-content\/(plugins|themes|uploads)\//i.test(pathname)) return false;
    if (/\/(assets|static|dist|build|chunks)\//i.test(pathname)) return false;
    return /contact|kontakt|book|booking|appointment|get-in-touch|quote|enquiry|inquiry/i.test(value);
  } catch {
    return false;
  }
}

function contactPageDisplay(value?: string) {
  return isUsefulContactPageUrl(value) ? value : "Not detected";
}

function reportSummary(name: string, score: number, issue: string) {
  const opportunityLevel = score >= 70 ? "strong" : score >= 40 ? "clear" : "basic";
  return `${name} is a verified public business lead with a ${opportunityLevel} website-improvement angle. The scan found ${issue}, giving a service provider a practical reason to start a local visibility, contact-flow, or trust-signal conversation.`;
}

function polishedOutreachMessage(input: { name: string; businessCategory: string; city: string; issue: string }) {
  return `Hi ${input.name} team,\n\nI was reviewing ${businessAudience(input.businessCategory)} in ${input.city} and noticed a couple of simple website items that may be worth improving.\n\nThe main thing I spotted was ${input.issue}. Small improvements here can make it easier for potential customers to understand the offer, trust the business, and make contact.\n\nI put together a short plain-English website audit with the main fixes. Would you like me to send it over?\n\nBest,\n[Your name / agency name]\n\nYou are receiving this because your business contact details appear publicly listed. Reply "unsubscribe" and I will not contact you again.`;
}

function suggestedOffer() {
  return "Offer a fixed-price local visibility tune-up covering contact/quote clarity, mobile usability, local SEO basics, and trust proof.";
}

function serviceAngleGuidance(input: { businessCategory: string; city: string; issue: string }) {
  const audience = businessAudience(input.businessCategory);
  return [
    {
      title: "Best first offer",
      text: "Start with a fixed-price local visibility tune-up instead of a full redesign pitch. Keep it practical: clearer quote/contact actions, mobile usability, local SEO basics, and trust proof.",
    },
    {
      title: "Why this business may care",
      text: `People comparing ${audience} in ${input.city} often want a fast way to understand the offer and request a quote. Because the scan found ${input.issue}, there is a clear reason to discuss improving the customer contact path.`,
    },
    {
      title: "How to approach",
      text: "Lead with one simple observation from the report, then offer to send the plain-English audit. Avoid a hard pitch in the first message.",
    },
    {
      title: "What not to promise",
      text: "Do not promise more customers, guaranteed sales, or guaranteed rankings. Position the work as a practical improvement opportunity based on public website signals.",
    },
  ];
}

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
  const firstIssue = mainIssue(lead.audit.issues[0]);
  const city = titleCase(lead.city);
  const cleanSummary = reportSummary(lead.businessName, lead.audit.score, firstIssue);
  const outreachMessage = polishedOutreachMessage({
    name: lead.businessName,
    businessCategory: lead.businessCategory,
    city,
    issue: firstIssue,
  });
  const serviceAngle = serviceAngleGuidance({
    businessCategory: lead.businessCategory,
    city,
    issue: firstIssue,
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className={`text-sm font-semibold ${lead.sourceStatus === "live" ? "text-emerald-700" : "text-amber-700"}`}>
              {lead.sourceStatus === "live" ? "LIVE public audit preview" : "Sample audit preview"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{lead.businessName}</h1>
            <p className="mt-2 text-slate-600">{city}, {lead.country} · {lead.businessCategory}</p>
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
          <p className="mt-2 text-sm leading-6 text-emerald-900">{cleanSummary}</p>
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
                <span>Contact page: {contactPageDisplay(lead.contactPageUrl)}</span>
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
              <p className="mt-3 whitespace-pre-line rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{outreachMessage}</p>
              <p className="mt-3 text-xs leading-5 text-slate-500">Replace [Your name / agency name] before sending this message.</p>
              <p className="mt-4 text-sm text-slate-700"><strong>Subject:</strong> Quick website visibility note for {lead.businessName}</p>
              <p className="mt-2 text-sm text-slate-700"><strong>Suggested offer:</strong> {suggestedOffer()}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="font-semibold text-emerald-950">Service angle for this business</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {serviceAngle.map((item) => (
                  <div key={item.title} className="rounded-md border border-emerald-100 bg-white p-4 text-sm leading-6 text-slate-700">
                    <strong className="block text-slate-950">{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
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
