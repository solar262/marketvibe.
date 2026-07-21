import { resolveMx } from "node:dns/promises";
import type { getSupabaseAdmin } from "@/lib/supabase";
import {
  assertSafePublicUrl,
  domainFromUrl,
  normalizeDomain,
  normalizeHttpUrl,
  scanPublicWebsite,
  type WebsiteScan,
} from "@/lib/sales-navigator-import";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type BuyerCompany = {
  id: string;
  company_name?: string | null;
  website?: string | null;
  canonical_domain?: string | null;
  country?: string | null;
  city?: string | null;
  sector?: string | null;
  buyer_status?: string | null;
  overall_buyer_score?: number | null;
  source_imported_prospect_id?: string | null;
  public_evidence_urls?: string[] | null;
};

type ContactCandidate = {
  personName: string;
  role: string;
  email: string;
  phone: string;
  source: string;
  sourceUrl: string;
  providerReference?: string;
};

type ProviderContact = Partial<{
  full_name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  email: string;
  phone: string;
  source_url: string;
  provider_reference: string;
}>;

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com", "outlook.com",
  "live.com", "icloud.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com",
]);

function clean(value: unknown, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function normalizeBusinessEmail(value: unknown) {
  return clean(value, 254).toLowerCase();
}

export function basicBusinessEmailAssessment(emailValue: unknown, companyDomainValue?: unknown) {
  const email = normalizeBusinessEmail(emailValue);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { valid: false, email, domain: "", reason: "invalid_format" };
  }
  const domain = normalizeDomain(email.split("@")[1]);
  if (!domain || FREE_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, email, domain, reason: "personal_or_free_mail_domain" };
  }
  const companyDomain = normalizeDomain(clean(companyDomainValue, 300));
  if (companyDomain && domain !== companyDomain && !domain.endsWith(`.${companyDomain}`) && !companyDomain.endsWith(`.${domain}`)) {
    return { valid: false, email, domain, reason: "email_domain_does_not_match_company" };
  }
  return { valid: true, email, domain, reason: "format_and_company_domain_match" };
}

export async function verifyBusinessEmail(emailValue: unknown, companyDomainValue?: unknown) {
  const basic = basicBusinessEmailAssessment(emailValue, companyDomainValue);
  if (!basic.valid) return { ...basic, mx: false, status: "invalid" as const };
  try {
    const records = await resolveMx(basic.domain);
    const mx = records.some((record) => clean(record.exchange).length > 0);
    return {
      ...basic,
      valid: mx,
      mx,
      status: mx ? "verified" as const : "invalid" as const,
      reason: mx ? "business_domain_and_mx_verified" : "mail_domain_has_no_mx",
    };
  } catch {
    return { ...basic, valid: false, mx: false, status: "unknown" as const, reason: "mx_lookup_failed" };
  }
}

async function scanCompanyWebsite(websiteValue: unknown) {
  const website = normalizeHttpUrl(clean(websiteValue, 1_000));
  if (!website) return { scans: [] as WebsiteScan[], error: "company_has_no_public_website" };
  const scans: WebsiteScan[] = [];
  try {
    const primary = await scanPublicWebsite(website);
    scans.push(primary);
    if (primary.contactPageUrl && normalizeHttpUrl(primary.contactPageUrl) !== normalizeHttpUrl(primary.finalUrl)) {
      try {
        scans.push(await scanPublicWebsite(primary.contactPageUrl));
      } catch {
        // The root page remains useful when a contact page is unavailable.
      }
    }
    return { scans, error: "" };
  } catch (error) {
    return { scans, error: error instanceof Error ? error.message : "website_scan_failed" };
  }
}

async function importedProspectCandidate(supabase: SupabaseClient, company: BuyerCompany) {
  if (!company.source_imported_prospect_id) return [] as ContactCandidate[];
  const { data, error } = await supabase
    .from("premium_imported_prospects")
    .select("full_name,first_name,last_name,job_title,public_email,public_phone,linkedin_profile_url,public_signal_url")
    .eq("id", company.source_imported_prospect_id)
    .maybeSingle();
  if (error || !data) return [];
  const personName = clean(data.full_name || [data.first_name, data.last_name].filter(Boolean).join(" "));
  const email = normalizeBusinessEmail(data.public_email);
  const phone = clean(data.public_phone, 80);
  if (!personName && !email && !phone) return [];
  return [{
    personName: personName || "Public business contact",
    role: clean(data.job_title) || "Business contact",
    email,
    phone,
    source: "owner_supplied_import",
    sourceUrl: clean(data.public_signal_url || data.linkedin_profile_url, 1000),
    providerReference: String(company.source_imported_prospect_id),
  }];
}

function websiteCandidates(scans: WebsiteScan[]) {
  const candidates: ContactCandidate[] = [];
  for (const scan of scans) {
    if (!scan.publicEmail && !scan.publicPhone) continue;
    candidates.push({
      personName: "Public business contact",
      role: "Business contact",
      email: normalizeBusinessEmail(scan.publicEmail),
      phone: clean(scan.publicPhone, 80),
      source: "public_company_website",
      sourceUrl: scan.contactPageUrl || scan.finalUrl,
    });
  }
  return candidates;
}

async function licensedProviderCandidates(company: BuyerCompany) {
  const endpoint = clean(process.env.ENRICHMENT_PROVIDER_URL, 1000);
  if (!endpoint) return { candidates: [] as ContactCandidate[], configured: false, error: "" };
  try {
    const safeEndpoint = await assertSafePublicUrl(endpoint);
    const response = await fetch(safeEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.ENRICHMENT_PROVIDER_API_KEY
          ? { authorization: `Bearer ${process.env.ENRICHMENT_PROVIDER_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        company_name: company.company_name,
        company_domain: company.canonical_domain || domainFromUrl(company.website || ""),
        company_website: company.website,
        country: company.country,
        city: company.city,
        industry: company.sector,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`enrichment_provider_http_${response.status}`);
    const payload = await response.json() as { contacts?: ProviderContact[] } | ProviderContact[];
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload.contacts) ? payload.contacts : [];
    const candidates = rows.slice(0, 10).map((row) => ({
      personName: clean(row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" ")) || "Public business contact",
      role: clean(row.job_title) || "Business contact",
      email: normalizeBusinessEmail(row.email),
      phone: clean(row.phone, 80),
      source: "licensed_enrichment_provider",
      sourceUrl: clean(row.source_url || company.website, 1000),
      providerReference: clean(row.provider_reference, 200),
    })).filter((row) => row.email || row.phone || row.personName !== "Public business contact");
    return { candidates, configured: true, error: "" };
  } catch (error) {
    return {
      candidates: [] as ContactCandidate[],
      configured: true,
      error: error instanceof Error ? error.message : "enrichment_provider_failed",
    };
  }
}

function contactKey(candidate: ContactCandidate) {
  return `${normalizeBusinessEmail(candidate.email)}|${clean(candidate.personName).toLowerCase()}|${clean(candidate.role).toLowerCase()}`;
}

export async function enrichBuyerCompanyRecord({
  supabase,
  company,
}: {
  supabase: SupabaseClient;
  company: BuyerCompany;
}) {
  const websiteResult = await scanCompanyWebsite(company.website || (company.canonical_domain ? `https://${company.canonical_domain}` : ""));
  const provider = await licensedProviderCandidates(company);
  const imported = await importedProspectCandidate(supabase, company);
  const candidates = Array.from(new Map([
    ...imported,
    ...websiteCandidates(websiteResult.scans),
    ...provider.candidates,
  ].map((candidate) => [contactKey(candidate), candidate])).values());

  const companyDomain = normalizeDomain(company.canonical_domain || domainFromUrl(websiteResult.scans[0]?.finalUrl || company.website || ""));
  const { data: existing, error: existingError } = await supabase
    .from("marketvibe_buyer_contacts")
    .select("person_name,business_email,source")
    .eq("buyer_company_id", company.id);
  if (existingError) throw existingError;
  const existingKeys = new Set((existing || []).map((row) => `${normalizeBusinessEmail(row.business_email)}|${clean(row.person_name).toLowerCase()}|${clean(row.source).toLowerCase()}`));

  let inserted = 0;
  let verifiedEmails = 0;
  let namedContacts = 0;
  for (const candidate of candidates) {
    const assessment = candidate.email
      ? await verifyBusinessEmail(candidate.email, companyDomain)
      : { email: "", status: "not_available" as const, valid: false, reason: "email_not_available", mx: false };
    const sourceKey = `${assessment.email}|${clean(candidate.personName).toLowerCase()}|${clean(candidate.source).toLowerCase()}`;
    if (existingKeys.has(sourceKey)) {
      if (assessment.status === "verified") verifiedEmails += 1;
      if (candidate.personName !== "Public business contact") namedContacts += 1;
      continue;
    }

    const { data: contact, error } = await supabase.from("marketvibe_buyer_contacts").insert({
      buyer_company_id: company.id,
      person_name: candidate.personName,
      role: candidate.role || null,
      source: candidate.source,
      source_url: candidate.sourceUrl || null,
      provider_reference: candidate.providerReference || null,
      verification_date: new Date().toISOString(),
      business_email: assessment.email || null,
      business_email_status: assessment.status,
      phone: candidate.phone || null,
      phone_status: candidate.phone ? "unknown" : "not_available",
      confidence: assessment.status === "verified" ? 90 : candidate.personName !== "Public business contact" ? 65 : 35,
      lawful_use_classification: candidate.source === "licensed_enrichment_provider" ? "licensed_business_data" : "public_business_context",
    }).select("id").single();
    if (error || !contact) throw error || new Error("contact_insert_failed");
    inserted += 1;
    if (assessment.status === "verified") verifiedEmails += 1;
    if (candidate.personName !== "Public business contact") namedContacts += 1;

    const provenanceRows = [
      candidate.personName ? { field_name: "person_name", value: candidate.personName } : null,
      candidate.role ? { field_name: "role", value: candidate.role } : null,
      assessment.email ? { field_name: "business_email", value: assessment.email } : null,
      candidate.phone ? { field_name: "phone", value: candidate.phone } : null,
    ].filter(Boolean).map((item) => ({
      contact_id: contact.id,
      field_name: item!.field_name,
      source: candidate.source,
      source_url: candidate.sourceUrl || null,
      provider_reference: candidate.providerReference || assessment.reason,
    }));
    if (provenanceRows.length) {
      const { error: provenanceError } = await supabase.from("marketvibe_contact_provenance").insert(provenanceRows);
      if (provenanceError) throw provenanceError;
    }
  }

  const primaryScan = websiteResult.scans[0];
  const evidenceRows = websiteResult.scans.map((scan) => ({
    buyer_company_id: company.id,
    evidence_type: "public_website_verification",
    source_url: scan.finalUrl,
    evidence_summary: [scan.pageTitle, scan.metaDescription, scan.textEvidence].filter(Boolean).join(" — ").slice(0, 1500) || "Public company website verified.",
    evidence_excerpt: scan.textEvidence || null,
    verified_at: new Date().toISOString(),
    raw_payload: {
      responseTimeMs: scan.responseTimeMs,
      contactPageUrl: scan.contactPageUrl,
      publicEmailDetected: Boolean(scan.publicEmail),
      publicPhoneDetected: Boolean(scan.publicPhone),
    },
  }));
  if (evidenceRows.length) {
    const { error } = await supabase.from("marketvibe_company_evidence").insert(evidenceRows);
    if (error) throw error;
  }

  const resolved = verifiedEmails > 0 || namedContacts > 0;
  const scoreQualified = Number(company.overall_buyer_score || 0) >= 55;
  const destinationState = resolved && scoreQualified ? "active" : scoreQualified ? "contact_unresolved" : "rejected";
  const websiteStatus = primaryScan ? "verified" : company.website || company.canonical_domain ? "failed" : "skipped";
  const publicEvidenceUrls = Array.from(new Set([
    ...(Array.isArray(company.public_evidence_urls) ? company.public_evidence_urls : []),
    ...websiteResult.scans.map((scan) => scan.finalUrl),
  ].filter(Boolean)));
  const { error: updateError } = await supabase.from("marketvibe_buyer_companies").update({
    website: primaryScan?.finalUrl || company.website || null,
    canonical_domain: companyDomain || company.canonical_domain || null,
    public_evidence_urls: publicEvidenceUrls,
    last_verified_date: new Date().toISOString(),
    website_status: websiteStatus,
    contact_status: resolved ? "resolved" : "unresolved",
    buyer_status: destinationState,
    updated_at: new Date().toISOString(),
  }).eq("id", company.id);
  if (updateError) throw updateError;

  return {
    destinationState,
    websiteStatus,
    scans: websiteResult.scans.length,
    insertedContacts: inserted,
    verifiedEmails,
    namedContacts,
    providerConfigured: provider.configured,
    providerError: provider.error,
    websiteError: websiteResult.error,
  };
}

export async function enrichOpportunityBacklog({ supabase, limit = 20 }: { supabase: SupabaseClient; limit?: number }) {
  const { data, error } = await supabase
    .from("opportunities")
    .select("id,company_website,company_domain,public_email,public_phone,evidence_status,last_verified_at")
    .eq("is_test_data", false)
    .in("verification_status", ["DISCOVERED", "VALIDATING", "QUALIFIED"])
    .not("company_website", "is", null)
    .order("last_verified_at", { ascending: true, nullsFirst: true })
    .limit(Math.min(Math.max(limit, 1), 50));
  if (error) throw error;
  let examined = 0;
  let enriched = 0;
  let failed = 0;
  for (const row of data || []) {
    examined += 1;
    try {
      const result = await scanCompanyWebsite(row.company_website);
      const scan = result.scans.find((item) => item.publicEmail || item.publicPhone) || result.scans[0];
      if (!scan) {
        failed += 1;
        continue;
      }
      const domain = normalizeDomain(row.company_domain || domainFromUrl(scan.finalUrl));
      const assessment = scan.publicEmail ? await verifyBusinessEmail(scan.publicEmail, domain) : null;
      const { error: updateError } = await supabase.from("opportunities").update({
        company_website: scan.finalUrl,
        company_domain: domain || row.company_domain || null,
        public_email: assessment?.status === "verified" ? assessment.email : row.public_email || null,
        public_phone: scan.publicPhone || row.public_phone || null,
        evidence_status: assessment?.status === "verified" ? "decision_maker_verified" : row.evidence_status,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
      if (updateError) throw updateError;
      enriched += 1;
    } catch {
      failed += 1;
    }
  }
  return { examined, enriched, failed };
}
