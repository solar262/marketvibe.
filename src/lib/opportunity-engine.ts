import { formatSupabaseServerEnvError, getSupabaseAdmin, supabaseConnectionStatus } from "@/lib/supabase";
import { sendTransactionalEmail } from "@/lib/brevo";
import { searchLiveLeads } from "@/lib/lead-engine";
import { csvEscape, deliveryToken, scanPublicWebsite, tokenHash } from "@/lib/sales-navigator-import";
import { appendCustomerAccessParams, createCustomerAccessToken } from "@/lib/customer-access";
import {
  buildCustomerSummary,
  buildExclusivityKey,
  buildOpportunityDedupeKey,
  calculateOpportunityScores,
  domainFromUrl,
  hasLowValueOpportunityEvidence,
  normalizeDomain,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  normalizeUrl,
  opportunityDeliveryQualityFlags,
  profileFromOnboarding,
  qualifyOpportunity,
  recommendedAction,
  replacementAutoApprovalReason,
  selectMatchingOpportunities,
  shouldExpireOpportunity,
  type ActiveExclusivity,
  type CustomerSearchProfile,
  type MatchableOpportunity,
  type OpportunityInput,
  type OpportunityScores,
} from "@/lib/opportunity-quality";
import { isPremiumProductCode, type PremiumProductCode } from "@/lib/premium-products";
import type { BusinessLead, LeadSearchInput } from "@/lib/types";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type DiscoveryTrigger = "admin" | "cron" | "test";

type SourceCandidate = OpportunityInput & {
  raw_payload?: Record<string, unknown>;
};

type NavigatorProspectOpportunityRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  job_title?: string | null;
  company_name?: string | null;
  company_domain?: string | null;
  company_website?: string | null;
  linkedin_profile_url?: string | null;
  company_linkedin_url?: string | null;
  location?: string | null;
  country?: string | null;
  city?: string | null;
  industry?: string | null;
  company_size?: string | null;
  public_email?: string | null;
  public_phone?: string | null;
  public_signal_url?: string | null;
  public_signal_text?: string | null;
  source_note?: string | null;
  raw_row?: Record<string, unknown> | null;
  fit_score?: number | null;
  intent_score?: number | null;
  evidence_status?: string | null;
  evidence_summary?: string | null;
  enrichment_status?: string | null;
  review_status?: string | null;
  inventory_status?: string | null;
  is_test_data?: boolean | null;
  website_scan?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const QUICK_PASTE_PROFILE_NAME = "Property Pipeline Buyers";
const QUICK_PASTE_PROFILE_KEYWORDS = [
  "high-end builder",
  "real estate agent",
  "estate agency",
  "property developer",
  "construction company",
  "renovation contractor",
  "luxury home contractor",
  "commercial property broker",
];
const QUICK_PASTE_OPPORTUNITY_SIGNAL_KEYWORDS = [
  "looking for builder",
  "need contractor",
  "home renovation",
  "house extension",
  "planning permission",
  "property seller",
  "property buyer",
  "moving house",
  "land for sale",
  "new build",
  "property investment",
  "luxury renovation",
];
const QUICK_PASTE_BUYER_TYPE = "High-ticket property, construction, and real estate service businesses";
const QUICK_PASTE_MAX_URLS = 500;
const NAVIGATOR_QUALIFYING_SIGNAL_PATTERN = /\b(expanding|expansion|hiring|recruiting|new project|project launch|planning|planning application|permit|opening|launching|funding|raised|growth|pipeline|customers|leads|manual|delay|broken|switching|tender|rfp|request for proposal|procurement|quote request|looking for|need(?:s|ed)?|seeking|help with|outsourc(?:e|ing)|contract awarded|land acquired|site acquired|portfolio growth|new homes?)\b/i;

export type QuickPasteImportInput = {
  urls: string;
  niche?: string;
  location?: string;
  sourceNote?: string;
  publicSignalText?: string;
};

export type QuickPasteImportCandidate = SourceCandidate & {
  pasted_url: string;
};

export type QuickPasteImportResult = {
  importedRows: number;
  duplicateRows: number;
  rejectedRows: number;
  rejected: Array<{ line: number; reason: string; value: string }>;
  profileId?: string;
  inventoryUrl: string;
};

type RunCounters = {
  records_discovered: number;
  records_rejected: number;
  records_qualified: number;
  records_added_to_inventory: number;
  duplicate_count: number;
  stale_records: number;
  customer_shortages: number;
  source_failures: Array<Record<string, unknown>>;
};

export type OpportunityFeedbackStatus = "replied" | "booked" | "not_useful";

type FeedbackAdjustedOpportunity = MatchableOpportunity & {
  customer_feedback_adjustment?: number;
  customer_feedback_reasons?: string[];
};

type CustomerFeedbackPreferences = {
  industries: Map<string, number>;
  locations: Map<string, number>;
  intentCategories: Map<string, number>;
  totalFeedback: number;
};

type OpportunityDiscoveryOptions = {
  trigger?: DiscoveryTrigger;
  profileId?: string;
  includeLiveLeadEngine?: boolean;
};

const RSS_ITEMS_PER_FEED = 15;
const RSS_PROFILE_TOKEN_STOPWORDS = new Set([
  "and",
  "for",
  "the",
  "with",
  "from",
  "high",
  "value",
  "ticket",
  "buyers",
  "buyer",
  "pipeline",
  "services",
  "service",
  "business",
  "businesses",
  "qualified",
  "opportunities",
  "opportunity",
]);
const RSS_PROPERTY_CONTEXT_PATTERN = /\b(property|real estate|construction|building|builder|contractor|developer|development|renovation|planning|permit|land|housing|homes|residential|commercial|architecture|infrastructure|industrial)\b/i;
const RSS_OPPORTUNITY_SIGNAL_PATTERN = /\b(request for proposal|rfp|tender|procurement|invitation to bid|bid opportunity|quote request|(?:vendor|contractor|consultant|supplier) needs? to provide|request(?:ing)? (?:quotes?|proposals?|supplier|vendor|contractor|builder|agency|consultant|support|help)|looking for (?:a |an |new |qualified |local |specialist )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support|help|quotes?|proposals?)|need(?:s|ed)? (?:a |an |new |qualified |local |specialist )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support|help|quotes?|proposals?)|seeking (?:a |an |new |qualified |local |specialist |for )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support|help|quotes?|proposals?)|contract(?:s)? (?:award|awarded|opportunity)|planning application|permit (?:application|approved|issued)|land for sale|site release|site acquired|development proposal|new build|renovation project|construction project|project delivery)\b/i;

function supabaseOrThrow() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error(formatSupabaseServerEnvError() || "Supabase privileged access is not configured for opportunity automation.");
  return supabase;
}

function nowIso() {
  return new Date().toISOString();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function matchReasonObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function relatedOpportunityObject(value: unknown) {
  if (Array.isArray(value)) return relatedOpportunityObject(value[0]);
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function preferenceKey(value: unknown) {
  return normalizeText(value).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

function addPreference(map: Map<string, number>, value: unknown, weight: number) {
  const key = preferenceKey(value);
  if (!key) return;
  map.set(key, (map.get(key) || 0) + weight);
}

function preferenceWeight(map: Map<string, number>, value: unknown) {
  const key = preferenceKey(value);
  return key ? map.get(key) || 0 : 0;
}

function emptyCustomerFeedbackPreferences(): CustomerFeedbackPreferences {
  return {
    industries: new Map(),
    locations: new Map(),
    intentCategories: new Map(),
    totalFeedback: 0,
  };
}

export function normalizeOpportunityFeedbackStatus(value: unknown): OpportunityFeedbackStatus | null {
  const status = String(value || "").trim().toLowerCase();
  return status === "replied" || status === "booked" || status === "not_useful" ? status : null;
}

export function customerFeedbackStatusFromMatchReason(matchReason: unknown): OpportunityFeedbackStatus | null {
  const root = matchReasonObject(matchReason);
  const feedback = root.customer_feedback && typeof root.customer_feedback === "object" ? root.customer_feedback as Record<string, unknown> : {};
  return normalizeOpportunityFeedbackStatus(feedback.status);
}

export function feedbackWeightForStatus(status: OpportunityFeedbackStatus) {
  if (status === "booked") return 12;
  if (status === "replied") return 7;
  return -14;
}

export function buildCustomerFeedbackPreferences(assignments: Array<Record<string, unknown>>): CustomerFeedbackPreferences {
  const preferences = emptyCustomerFeedbackPreferences();
  for (const assignment of assignments) {
    const status = customerFeedbackStatusFromMatchReason(assignment.match_reason);
    if (!status) continue;
    const opportunity = relatedOpportunityObject(assignment.opportunities);
    const weight = feedbackWeightForStatus(status);
    addPreference(preferences.industries, opportunity.company_industry || opportunity.niche, weight);
    addPreference(preferences.locations, opportunity.company_location || opportunity.company_country || opportunity.target_location, Math.trunc(weight / 2));
    addPreference(preferences.intentCategories, opportunity.intent_category, Math.trunc(weight / 2));
    preferences.totalFeedback += 1;
  }
  return preferences;
}

export function applyCustomerFeedbackPreferences<T extends MatchableOpportunity>(opportunities: T[], preferences: CustomerFeedbackPreferences): Array<T & FeedbackAdjustedOpportunity> {
  if (preferences.totalFeedback === 0) return opportunities as Array<T & FeedbackAdjustedOpportunity>;
  return opportunities.map((opportunity) => {
    const industryDelta = preferenceWeight(preferences.industries, opportunity.company_industry || opportunity.niche);
    const locationDelta = preferenceWeight(preferences.locations, opportunity.company_location || opportunity.company_country || opportunity.target_location);
    const intentDelta = preferenceWeight(preferences.intentCategories, opportunity.intent_category);
    const rawAdjustment = Math.round((industryDelta * 0.55) + (locationDelta * 0.25) + (intentDelta * 0.2));
    const adjustment = Math.max(-18, Math.min(18, rawAdjustment));
    if (adjustment === 0) return opportunity as T & FeedbackAdjustedOpportunity;

    const reasons = [
      industryDelta ? `industry ${industryDelta > 0 ? "favored" : "reduced"} by customer outcomes` : "",
      locationDelta ? `location ${locationDelta > 0 ? "favored" : "reduced"} by customer outcomes` : "",
      intentDelta ? `intent ${intentDelta > 0 ? "favored" : "reduced"} by customer outcomes` : "",
    ].filter(Boolean);

    return {
      ...opportunity,
      overall_score: clampScore(opportunity.overall_score + adjustment),
      customer_feedback_adjustment: adjustment,
      customer_feedback_reasons: reasons,
    };
  });
}

function sourceTypeFromPastedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
      return parsed.pathname.includes("/sales/") ? "sales_navigator_url" : "linkedin_profile_or_company_url";
    }
    return "admin_pasted_public_url";
  } catch {
    return "admin_pasted_public_url";
  }
}

function isLinkedInUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "linkedin.com" || host.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}

export function parseQuickPasteUrls(urls: string) {
  const rejected: Array<{ line: number; reason: string; value: string }> = [];
  const seen = new Set<string>();
  const accepted: Array<{ line: number; url: string; original: string }> = [];
  const lines = urls.split(/\r?\n/);

  if (lines.length > QUICK_PASTE_MAX_URLS) {
    rejected.push({
      line: QUICK_PASTE_MAX_URLS + 1,
      reason: `Maximum ${QUICK_PASTE_MAX_URLS} pasted URLs per import.`,
      value: "",
    });
  }

  for (const [index, rawLine] of lines.slice(0, QUICK_PASTE_MAX_URLS).entries()) {
    const original = rawLine.trim();
    if (!original) continue;
    const normalized = normalizeUrl(original);
    if (!normalized) {
      rejected.push({ line: index + 1, reason: "Invalid URL.", value: original });
      continue;
    }
    if (seen.has(normalized)) {
      rejected.push({ line: index + 1, reason: "Duplicate URL in pasted list.", value: original });
      continue;
    }
    seen.add(normalized);
    accepted.push({ line: index + 1, url: normalized, original });
  }

  return { accepted, rejected };
}

function defaultQuickPasteProfileRow() {
  return {
    customer_email: "admin@marketvibe.local",
    product_code: "radar" as const,
    status: "active" as const,
    niche: QUICK_PASTE_PROFILE_NAME,
    target_service: QUICK_PASTE_BUYER_TYPE,
    target_industries: QUICK_PASTE_PROFILE_KEYWORDS,
    target_locations: [],
    company_sizes: [],
    target_job_roles: ["owner", "founder", "ceo", "director", "property developer", "estate agent", "broker", "project manager", "construction manager"],
    minimum_fit_score: 50,
    minimum_intent_score: 80,
    minimum_evidence_score: 65,
    maximum_record_age_days: 60,
    opportunity_quantity: 25,
    delivery_frequency: "weekly" as const,
    exclusivity_mode: "customer_exclusive" as const,
    exclusivity_period_days: 14,
    allow_profile_only: false,
    replacement_policy: "admin_review" as const,
    metadata: {
      name: QUICK_PASTE_PROFILE_NAME,
      keywords: QUICK_PASTE_PROFILE_KEYWORDS,
      buyer_type: QUICK_PASTE_BUYER_TYPE,
      opportunity_signal_keywords: QUICK_PASTE_OPPORTUNITY_SIGNAL_KEYWORDS,
      quality_policy: "named_buyer_current_need_required",
      created_by: "quick_paste_import",
    },
    updated_at: nowIso(),
  };
}

export function quickPasteCandidateFromUrl(input: {
  url: string;
  niche?: string;
  location?: string;
  sourceNote?: string;
  publicSignalText?: string;
  capturedAt?: string;
}): QuickPasteImportCandidate {
  const normalizedUrl = normalizeUrl(input.url);
  const linkedIn = isLinkedInUrl(normalizedUrl);
  const domain = linkedIn ? "" : domainFromUrl(normalizedUrl);
  const note = input.sourceNote?.trim() || "";
  const publicSignalText = input.publicSignalText?.trim() || "";
  const sourceText = publicSignalText || "URL supplied by admin through Quick Paste Import. No page was fetched; company, contact, and evidence fields are unknown until review.";

  return {
    pasted_url: normalizedUrl,
    company_name: "Unknown company",
    company_domain: domain || null,
    company_website: linkedIn ? null : normalizedUrl,
    company_location: input.location?.trim() || "Unknown",
    company_industry: input.niche?.trim() || "Unknown",
    source_type: sourceTypeFromPastedUrl(normalizedUrl),
    source_name: "Quick Paste Import",
    source_url: normalizedUrl,
    source_title: linkedIn ? "Pasted LinkedIn/Sales Navigator URL" : "Pasted public URL",
    source_text: sourceText,
    captured_at: input.capturedAt || nowIso(),
    evidence_status: "profile_only",
    intent_category: publicSignalText ? "weak_research_signal" : "profile_only",
    niche: input.niche?.trim() || QUICK_PASTE_PROFILE_NAME,
    target_location: input.location?.trim() || null,
    raw_payload: {
      pasted_url: normalizedUrl,
      source_note: note,
      public_signal_text: publicSignalText,
      quick_paste_import: true,
      no_scraping: true,
      no_linkedin_fetch: linkedIn,
      missing_fields_marked_unknown: true,
    },
  };
}

function runIdempotencyKey(name: string, trigger: DiscoveryTrigger | "cron" | "admin", scope = "all") {
  const bucket = trigger === "cron" ? new Date().toISOString().slice(0, 13) : `${new Date().toISOString()}:${Math.random().toString(36).slice(2, 8)}`;
  return `${name}:${scope}:${bucket}`;
}

function arrayFromDb(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function isQuickPastePropertyProfile(profile: CustomerSearchProfile) {
  const metadata = profile.metadata || {};
  return profile.niche === QUICK_PASTE_PROFILE_NAME
    || profile.customer_email === "admin@marketvibe.local"
    || metadata.created_by === "quick_paste_import";
}

function hardenPropertyProfile(profile: CustomerSearchProfile): CustomerSearchProfile {
  if (!isQuickPastePropertyProfile(profile)) return profile;
  return {
    ...profile,
    minimum_fit_score: Math.max(profile.minimum_fit_score, 50),
    minimum_intent_score: Math.max(profile.minimum_intent_score, 80),
    minimum_evidence_score: Math.max(profile.minimum_evidence_score, 65),
    maximum_record_age_days: Math.min(profile.maximum_record_age_days || 60, 60),
    allow_profile_only: false,
  };
}

function profileFromRow(row: Record<string, unknown>): CustomerSearchProfile {
  return hardenPropertyProfile({
    id: String(row.id || ""),
    customer_email: normalizeEmail(row.customer_email),
    product_code: String(row.product_code || "proof_pack") as PremiumProductCode,
    status: row.status === "paused" ? "paused" : "active",
    niche: String(row.niche || ""),
    target_service: String(row.target_service || ""),
    target_industries: arrayFromDb(row.target_industries),
    target_locations: arrayFromDb(row.target_locations),
    company_sizes: arrayFromDb(row.company_sizes),
    target_job_roles: arrayFromDb(row.target_job_roles),
    minimum_fit_score: Number(row.minimum_fit_score || 50),
    minimum_intent_score: Number(row.minimum_intent_score || 35),
    minimum_evidence_score: Number(row.minimum_evidence_score || 50),
    maximum_record_age_days: Number(row.maximum_record_age_days || 90),
    opportunity_quantity: Number(row.opportunity_quantity || 10),
    delivery_frequency: row.delivery_frequency === "daily" || row.delivery_frequency === "monthly" || row.delivery_frequency === "once" ? row.delivery_frequency : "weekly",
    exclusivity_mode: row.exclusivity_mode === "non_exclusive" || row.exclusivity_mode === "niche_exclusive" || row.exclusivity_mode === "geographic_exclusive" || row.exclusivity_mode === "time_limited_exclusive" ? row.exclusivity_mode : "customer_exclusive",
    exclusivity_period_days: Number(row.exclusivity_period_days || 14),
    allow_profile_only: Boolean(row.allow_profile_only),
    replacement_policy: row.replacement_policy === "none" || row.replacement_policy === "admin_review" || row.replacement_policy === "automatic" ? row.replacement_policy : "objective_failures",
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {},
  });
}

function opportunityFromRow(row: Record<string, unknown>): MatchableOpportunity {
  const input = dbRowToOpportunityInput(row);
  return {
    ...input,
    id: String(row.id),
    dedupe_key: String(row.dedupe_key || buildOpportunityDedupeKey(input)),
    exclusivity_key: row.exclusivity_key ? String(row.exclusivity_key) : null,
    inventory_status: String(row.inventory_status || "DISCOVERED") as MatchableOpportunity["inventory_status"],
    delivery_status: row.delivery_status ? String(row.delivery_status) : null,
    fit_score: Number(row.fit_score || 0),
    intent_score: Number(row.intent_score || 0),
    evidence_score: Number(row.evidence_score || 0),
    freshness_score: Number(row.freshness_score || 0),
    overall_score: Number(row.overall_score || 0),
    intent_category: String(row.intent_category || "unavailable") as MatchableOpportunity["intent_category"],
    evidence_status: String(row.evidence_status || "unavailable") as MatchableOpportunity["evidence_status"],
    reasons: {
      fit: [],
      intent: [],
      evidence: [],
      freshness: [],
      overall: "",
    },
  };
}

function dbRowToOpportunityInput(row: Record<string, unknown>): OpportunityInput {
  return {
    id: row.id ? String(row.id) : undefined,
    company_name: String(row.company_name || ""),
    company_domain: row.company_domain ? String(row.company_domain) : null,
    company_website: row.company_website ? String(row.company_website) : null,
    company_location: row.company_location ? String(row.company_location) : null,
    company_country: row.company_country ? String(row.company_country) : null,
    company_industry: row.company_industry ? String(row.company_industry) : null,
    company_size: row.company_size ? String(row.company_size) : null,
    company_description: row.company_description ? String(row.company_description) : null,
    contact_full_name: row.contact_full_name ? String(row.contact_full_name) : null,
    contact_first_name: row.contact_first_name ? String(row.contact_first_name) : null,
    contact_last_name: row.contact_last_name ? String(row.contact_last_name) : null,
    contact_job_title: row.contact_job_title ? String(row.contact_job_title) : null,
    public_email: row.public_email ? String(row.public_email) : null,
    public_phone: row.public_phone ? String(row.public_phone) : null,
    source_type: String(row.source_type || ""),
    source_name: String(row.source_name || ""),
    source_url: String(row.source_url || ""),
    source_title: row.source_title ? String(row.source_title) : null,
    source_text: String(row.source_text || ""),
    source_published_at: row.source_published_at ? String(row.source_published_at) : null,
    captured_at: row.captured_at ? String(row.captured_at) : null,
    last_verified_at: row.last_verified_at ? String(row.last_verified_at) : null,
    evidence_status: row.evidence_status ? String(row.evidence_status) as OpportunityInput["evidence_status"] : null,
    intent_category: row.intent_category ? String(row.intent_category) as OpportunityInput["intent_category"] : null,
    inventory_status: row.inventory_status ? String(row.inventory_status) as OpportunityInput["inventory_status"] : null,
    customer_email: row.customer_email ? String(row.customer_email) : null,
    product_code: row.product_code ? String(row.product_code) as PremiumProductCode : null,
    niche: row.niche ? String(row.niche) : null,
    target_location: row.target_location ? String(row.target_location) : null,
    is_test_data: Boolean(row.is_test_data),
  };
}

function leadSearchInputFromProfile(profile: CustomerSearchProfile): LeadSearchInput {
  const location = profile.target_locations[0] || "";
  const city = location.split(",")[0]?.trim() || "Manchester";
  const country = profile.target_locations.find((value) => /\b(united kingdom|ireland|germany|france|spain|united states|usa)\b/i.test(value)) || "United Kingdom";
  return {
    country,
    city,
    businessType: profile.niche || "local shops",
    serviceCategory: profile.target_service || "Web design",
    customSearchTerm: [profile.niche, profile.target_service].filter(Boolean).join(" "),
  };
}

function opportunityFromBusinessLead(lead: BusinessLead, profile: CustomerSearchProfile): SourceCandidate {
  const sourceText = [
    lead.audit.summary,
    ...(lead.audit.issues || []).slice(0, 5),
    lead.audit.serviceAngle,
  ].filter(Boolean).join(" ");
  const website = normalizeUrl(lead.website);
  return {
    company_name: lead.businessName,
    company_domain: normalizeDomain(domainFromUrl(website)),
    company_website: website,
    company_location: [lead.city, lead.country].filter(Boolean).join(", "),
    company_country: lead.country,
    company_industry: lead.businessCategory,
    company_description: lead.audit.summary,
    public_email: normalizeEmail(lead.publicEmail),
    public_phone: normalizePhone(lead.phone),
    source_type: "public_business_website",
    source_name: "MarketVibe live lead engine",
    source_url: website || normalizeUrl(lead.sourceUrl),
    source_title: lead.audit.pageTitle || lead.businessName,
    source_text: sourceText,
    captured_at: nowIso(),
    evidence_status: "website_verified",
    niche: profile.niche,
    target_location: profile.target_locations.join(", "),
    raw_payload: { lead },
  };
}

function rssFeeds() {
  return (process.env.OPPORTUNITY_RSS_FEEDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function decodeXmlEntities(value: string) {
  let decoded = value;
  for (let index = 0; index < 2; index += 1) {
    decoded = decoded
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
      .replace(/&nbsp;/g, " ")
      .replace(/&bull;/g, " ")
      .replace(/&ndash;/g, "-")
      .replace(/&mdash;/g, "-")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'");
  }
  return decoded;
}

function stripXml(value: string) {
  return decodeXmlEntities(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractXmlValue(item: string, tag: string) {
  const escapedTag = escapeRegExp(tag);
  const match = item.match(new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`, "i"));
  return stripXml(match?.[1] || "").trim();
}

function extractXmlValues(item: string, tag: string) {
  const escapedTag = escapeRegExp(tag);
  const matches = item.matchAll(new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`, "gi"));
  return Array.from(matches).map((match) => stripXml(match[1] || "").trim()).filter(Boolean);
}

function extractRssLink(item: string) {
  const inlineLink = normalizeUrl(extractXmlValue(item, "link"));
  if (inlineLink) return inlineLink;
  const href = item.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i)?.[1];
  return normalizeUrl(decodeXmlEntities(href || ""));
}

function safeIsoDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function extractRssPublished(item: string) {
  return extractXmlValue(item, "pubDate") || extractXmlValue(item, "published") || extractXmlValue(item, "updated") || extractXmlValue(item, "dc:date");
}

function rssProfileTerms(profile: CustomerSearchProfile) {
  const phrases = [
    profile.niche,
    profile.target_service,
    ...profile.target_industries,
  ]
    .map((value) => normalizeText(value))
    .filter((value) => value.length >= 4);

  const tokens = phrases
    .flatMap((value) => value.split(/[^a-z0-9]+/i))
    .map((value) => normalizeText(value))
    .filter((value) => value.length >= 4 && !RSS_PROFILE_TOKEN_STOPWORDS.has(value));

  return Array.from(new Set([...phrases, ...tokens]));
}

export function rssItemMatchesProfile(profile: CustomerSearchProfile, text: string) {
  const haystack = normalizeText(text);
  if (!haystack) return false;
  if (hasLowValueOpportunityEvidence(text)) return false;

  const profileTerms = rssProfileTerms(profile);
  if (profileTerms.some((term) => haystack.includes(term)) && RSS_OPPORTUNITY_SIGNAL_PATTERN.test(text)) return true;

  return RSS_PROPERTY_CONTEXT_PATTERN.test(text) && RSS_OPPORTUNITY_SIGNAL_PATTERN.test(text);
}

function inferRssLocation(feed: string, text: string, profile: CustomerSearchProfile) {
  const haystack = normalizeText(text);
  const profileMatches = profile.target_locations.filter((location) => {
    const normalized = normalizeText(location);
    return normalized.length >= 3 && haystack.includes(normalized);
  });
  if (profileMatches.length > 0) return profileMatches.join(", ");

  const usaLocation = text.match(/\bUSA\s*\(([^)]+)\)/i)?.[1]?.trim();
  if (usaLocation) return `${usaLocation}, United States`;
  const canadaLocation = text.match(/\bCanada\s*\(([^)]+)\)/i)?.[1]?.trim();
  if (canadaLocation) return `${canadaLocation}, Canada`;
  const ukLocation = text.match(/\bUK\s*\(([^)]+)\)/i)?.[1]?.trim();
  if (ukLocation) return `${ukLocation}, United Kingdom`;

  try {
    const host = new URL(feed).hostname.replace(/^www\./, "");
    if (host.endsWith("london.gov.uk")) return "London, United Kingdom";
    if (host.endsWith("enr.com") && /\b(dallas|texas|houston|austin|fort worth)\b/i.test(text)) return "Texas, United States";
    if (host.endsWith("enr.com") && /\b(new york|nyc|manhattan|queens|brooklyn)\b/i.test(text)) return "New York, United States";
    if (host.endsWith("enr.com") && /\b(california|los angeles|san francisco|san diego)\b/i.test(text)) return "California, United States";
  } catch {
    return "";
  }

  return "";
}

function countryFromLocation(location: string) {
  if (/\bUnited Kingdom\b/i.test(location)) return "United Kingdom";
  if (/\bUnited States\b/i.test(location)) return "United States";
  if (/\bCanada\b/i.test(location)) return "Canada";
  return null;
}

function companyNameFromRssTitle(title: string) {
  const parts = title.split(/\s+-\s+/).map((value) => value.trim()).filter(Boolean);
  if (/^[A-Z]+-\d+$/i.test(parts[0] || "") && parts.length >= 3) return parts[2];
  return title.split(/[-|:]/)[0]?.trim() || title;
}

function industryFromRssText(text: string) {
  if (/\b(real estate|property developer|property development|housing|affordable housing|land|site acquired|site release)\b/i.test(text)) return "Property and real estate";
  if (/\b(construction|builder|contractor|architecture|architect|engineer|renovation|infrastructure|demolition|design support)\b/i.test(text)) return "Construction and built environment";
  if (/\b(planning application|development proposal|permit application)\b/i.test(text)) return "Planning and development";
  return null;
}

async function fetchRssCandidates(profile: CustomerSearchProfile): Promise<{ candidates: SourceCandidate[]; failures: Array<Record<string, unknown>> }> {
  const feeds = rssFeeds();
  if (feeds.length === 0) return { candidates: [], failures: [] };
  const candidates: SourceCandidate[] = [];
  const failures: Array<Record<string, unknown>> = [];
  for (const feed of feeds) {
    try {
      const response = await fetch(feed, {
        headers: { "user-agent": "MarketVibeOpportunityEngine/1.0 (+https://marketvibe1.com)" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`RSS feed returned ${response.status}`);
      const xml = await response.text();
      const items = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
      const recentItems = items
        .map((item) => ({ item, timestamp: Date.parse(extractRssPublished(item)) }))
        .sort((a, b) => (Number.isFinite(b.timestamp) ? b.timestamp : 0) - (Number.isFinite(a.timestamp) ? a.timestamp : 0))
        .slice(0, RSS_ITEMS_PER_FEED)
        .map((entry) => entry.item);
      for (const item of recentItems) {
        const title = extractXmlValue(item, "title");
        const link = extractRssLink(item);
        const description = extractXmlValue(item, "description") || extractXmlValue(item, "summary") || extractXmlValue(item, "content:encoded");
        const published = extractRssPublished(item);
        const categories = extractXmlValues(item, "category");
        const text = [title, description, ...categories].filter(Boolean).join(" ");
        if (/info only,\s*rfp not included/i.test(text)) continue;
        if (!title || !rssItemMatchesProfile(profile, text)) continue;
        const companyName = companyNameFromRssTitle(title);
        const location = inferRssLocation(feed, text, profile);
        candidates.push({
          company_name: companyName.slice(0, 160),
          company_location: location || null,
          company_country: location ? countryFromLocation(location) : null,
          company_industry: industryFromRssText(text),
          source_type: "public_rss_feed",
          source_name: feed,
          source_url: link || feed,
          source_title: title,
          source_text: text,
          source_published_at: published ? safeIsoDate(published) : null,
          captured_at: nowIso(),
          evidence_status: "public_signal_verified",
          niche: profile.niche,
          target_location: location || null,
          raw_payload: { feed, title, description, categories },
        });
      }
    } catch (error) {
      failures.push({
        source_name: feed,
        source_type: "public_rss_feed",
        source_url: feed,
        error: error instanceof Error ? error.message : "RSS feed failed.",
      });
    }
  }
  return { candidates, failures };
}

async function discoverCandidatesForProfile(profile: CustomerSearchProfile, options: { includeLiveLeadEngine?: boolean } = {}) {
  const candidates: SourceCandidate[] = [];
  const failures: Array<Record<string, unknown>> = [];
  const includeLiveLeadEngine = options.includeLiveLeadEngine !== false;

  if (includeLiveLeadEngine) {
    try {
      const live = await searchLiveLeads(leadSearchInputFromProfile(profile), Math.min(8, profile.opportunity_quantity));
      candidates.push(...live.leads.filter((lead) => lead.sourceStatus === "live").map((lead) => opportunityFromBusinessLead(lead, profile)));
    } catch (error) {
      failures.push({
        source_name: "MarketVibe live lead engine",
        source_type: "public_business_website",
        error: error instanceof Error ? error.message : "Live lead engine failed.",
      });
    }
  }

  const rss = await fetchRssCandidates(profile);
  candidates.push(...rss.candidates);
  failures.push(...rss.failures);

  return { candidates, failures };
}

async function createRun(supabase: SupabaseClient, input: {
  runType: string;
  trigger: DiscoveryTrigger | "cron" | "admin";
  idempotencyKey: string;
  profile?: CustomerSearchProfile;
}) {
  const { data, error } = await supabase
    .from("opportunity_source_runs")
    .insert({
      run_type: input.runType,
      trigger_source: input.trigger,
      idempotency_key: input.idempotencyKey,
      search_profile_id: input.profile?.id || null,
      customer_email: input.profile?.customer_email || null,
      niche: input.profile?.niche || null,
      target_location: input.profile?.target_locations?.join(", ") || null,
    })
    .select("id")
    .single();
  if (error || !data) throw error || new Error("Run could not be created.");
  return String(data.id);
}

async function finishRun(supabase: SupabaseClient, runId: string, status: "completed" | "failed" | "partial" | "skipped", counters: Partial<RunCounters>, errorSummary: Record<string, unknown> = {}) {
  const { error } = await supabase
    .from("opportunity_source_runs")
    .update({
      status,
      finished_at: nowIso(),
      ...counters,
      error_summary: errorSummary,
    })
    .eq("id", runId);
  if (error) throw error;
}

async function automationPaused(supabase: SupabaseClient) {
  const { data } = await supabase.from("opportunity_automation_settings").select("automation_paused").eq("id", "default").maybeSingle();
  return Boolean(data?.automation_paused);
}

function isInternalOpportunityEmail(email: string) {
  return normalizeEmail(email).endsWith("@marketvibe.local");
}

async function hasBillableOpportunityAccess(supabase: SupabaseClient, email: string, productCode: unknown) {
  const customerEmail = normalizeEmail(email);
  if (!customerEmail || isInternalOpportunityEmail(customerEmail) || !isPremiumProductCode(productCode)) return false;

  const now = nowIso();
  const entitlement = await supabase
    .from("premium_entitlements")
    .select("id")
    .eq("customer_email", customerEmail)
    .eq("product_code", productCode)
    .eq("status", "active")
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .limit(1);
  if (entitlement.error) throw entitlement.error;
  if ((entitlement.data || []).length > 0) return true;

  const order = await supabase
    .from("premium_orders")
    .select("id")
    .eq("customer_email", customerEmail)
    .eq("product_code", productCode)
    .eq("status", "completed")
    .limit(1);
  if (order.error) throw order.error;
  return (order.data || []).length > 0;
}

async function loadProfiles(supabase: SupabaseClient, profileId?: string) {
  let query = supabase.from("customer_search_profiles").select("*").eq("status", "active").order("created_at", { ascending: true }).limit(25);
  if (profileId) query = query.eq("id", profileId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => profileFromRow(row as Record<string, unknown>));
}

async function loadBillableProfiles(supabase: SupabaseClient, profileId?: string) {
  const profiles = await loadProfiles(supabase, profileId);
  const billableProfiles: CustomerSearchProfile[] = [];
  let skippedProfiles = 0;

  for (const profile of profiles) {
    if (await hasBillableOpportunityAccess(supabase, profile.customer_email, profile.product_code)) {
      billableProfiles.push(profile);
    } else {
      skippedProfiles += 1;
    }
  }

  return { profiles: billableProfiles, skippedProfiles };
}

async function existingDedupeKeys(supabase: SupabaseClient, keys: string[]) {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  if (unique.length === 0) return new Set<string>();
  const { data, error } = await supabase.from("opportunities").select("dedupe_key").in("dedupe_key", unique);
  if (error) throw error;
  return new Set((data || []).map((row) => String(row.dedupe_key)));
}

async function ensureQuickPasteDefaultSearchProfile(supabase: SupabaseClient) {
  const defaultRow = defaultQuickPasteProfileRow();
  const { data: activeProfiles, error } = await supabase
    .from("customer_search_profiles")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  const quickPasteProfiles = (activeProfiles || []).filter((row) => {
    const record = row as Record<string, unknown>;
    const metadata = record.metadata && typeof record.metadata === "object" ? record.metadata as Record<string, unknown> : {};
    return record.customer_email === defaultRow.customer_email
      || metadata.created_by === "quick_paste_import"
      || record.niche === QUICK_PASTE_PROFILE_NAME;
  });
  const defaultProfile = quickPasteProfiles.find((row) => row.niche === QUICK_PASTE_PROFILE_NAME) || quickPasteProfiles[0];
  if (defaultProfile?.id) {
    const { data, error: updateError } = await supabase
      .from("customer_search_profiles")
      .update(defaultRow)
      .eq("id", String(defaultProfile.id))
      .select("*")
      .single();
    if (updateError || !data) throw updateError || new Error("Default Quick Paste search profile could not be updated.");
    return profileFromRow(data as Record<string, unknown>);
  }

  const { data, error: upsertError } = await supabase
    .from("customer_search_profiles")
    .upsert(defaultRow, { onConflict: "customer_email,product_code,niche" })
    .select("*")
    .single();
  if (upsertError || !data) throw upsertError || new Error("Default Quick Paste search profile could not be created.");
  return profileFromRow(data as Record<string, unknown>);
}

function navigatorOpportunityProfile(): CustomerSearchProfile {
  return {
    ...defaultQuickPasteProfileRow(),
    id: "navigator-visible-card-profile",
    niche: QUICK_PASTE_PROFILE_NAME,
    target_service: QUICK_PASTE_BUYER_TYPE,
    minimum_fit_score: 50,
    minimum_intent_score: 80,
    minimum_evidence_score: 65,
    maximum_record_age_days: 60,
    metadata: {
      created_by: "sales_navigator_visible_card_bridge",
      source_policy: "visible_card_only_no_private_fetch",
    },
  };
}

function navigatorProspectHasQualifiedSignal(prospect: NavigatorProspectOpportunityRow) {
  if (prospect.review_status !== "approved") return false;
  if (prospect.is_test_data || prospect.inventory_status === "rejected") return false;
  if (prospect.evidence_status === "profile_only") return false;
  const signalText = [
    prospect.public_signal_text,
    prospect.evidence_summary,
    prospect.source_note,
  ].filter(Boolean).join(" ");
  return NAVIGATOR_QUALIFYING_SIGNAL_PATTERN.test(signalText);
}

function navigatorProspectSourceUrl(prospect: NavigatorProspectOpportunityRow) {
  return normalizeUrl(prospect.public_signal_url)
    || normalizeUrl(prospect.linkedin_profile_url)
    || normalizeUrl(prospect.company_linkedin_url)
    || normalizeUrl(prospect.company_website);
}

function navigatorProspectToCandidate(prospect: NavigatorProspectOpportunityRow): SourceCandidate | null {
  if (!navigatorProspectHasQualifiedSignal(prospect)) return null;
  const companyName = String(prospect.company_name || "").trim();
  if (!companyName) return null;
  const sourceUrl = navigatorProspectSourceUrl(prospect);
  if (!sourceUrl) return null;

  const location = [prospect.city, prospect.location].filter(Boolean).join(", ") || prospect.location || "";
  const title = [prospect.company_name, prospect.job_title || prospect.full_name, "visible Navigator signal"].filter(Boolean).join(" - ");
  const sourceText = [
    prospect.public_signal_text,
    prospect.evidence_summary,
    prospect.source_note,
  ].filter(Boolean).join(" ");

  return {
    company_name: companyName,
    company_domain: normalizeDomain(prospect.company_domain || domainFromUrl(prospect.company_website)),
    company_website: normalizeUrl(prospect.company_website),
    company_location: location || null,
    company_country: prospect.country || null,
    company_industry: prospect.industry || QUICK_PASTE_PROFILE_NAME,
    company_size: prospect.company_size || null,
    company_description: prospect.evidence_summary || null,
    contact_first_name: prospect.first_name || null,
    contact_last_name: prospect.last_name || null,
    contact_full_name: prospect.full_name || [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") || null,
    contact_job_title: prospect.job_title || null,
    public_email: normalizeEmail(prospect.public_email),
    public_phone: normalizePhone(prospect.public_phone),
    source_type: "sales_navigator_visible_card",
    source_name: "MarketVibe Sales Navigator Companion",
    source_url: sourceUrl,
    source_title: title.slice(0, 220),
    source_text: sourceText,
    captured_at: prospect.created_at || nowIso(),
    last_verified_at: prospect.updated_at || prospect.created_at || nowIso(),
    evidence_status: "public_signal_verified",
    niche: QUICK_PASTE_PROFILE_NAME,
    target_location: [prospect.city, prospect.country].filter(Boolean).join(", ") || prospect.location || null,
    is_test_data: Boolean(prospect.is_test_data),
    raw_payload: {
      imported_prospect_id: prospect.id,
      source: "sales_navigator_visible_card",
      linkedin_profile_url: prospect.linkedin_profile_url || null,
      company_linkedin_url: prospect.company_linkedin_url || null,
      enrichment_status: prospect.enrichment_status || null,
      imported_fit_score: prospect.fit_score ?? null,
      imported_intent_score: prospect.intent_score ?? null,
      raw_row: prospect.raw_row || {},
      no_private_fetch: true,
      visible_card_only: true,
    },
  };
}

function opportunityInsertRow(candidate: SourceCandidate, profile: CustomerSearchProfile, scores: OpportunityScores, qualification: ReturnType<typeof qualifyOpportunity>) {
  const dedupeKey = buildOpportunityDedupeKey(candidate);
  return {
    company_name: candidate.company_name,
    company_domain: normalizeDomain(candidate.company_domain || domainFromUrl(candidate.company_website)),
    company_website: normalizeUrl(candidate.company_website),
    company_location: candidate.company_location || null,
    company_country: candidate.company_country || null,
    company_industry: candidate.company_industry || profile.niche,
    company_size: candidate.company_size || null,
    company_description: candidate.company_description || null,
    contact_first_name: candidate.contact_first_name || null,
    contact_last_name: candidate.contact_last_name || null,
    contact_full_name: candidate.contact_full_name || null,
    contact_job_title: candidate.contact_job_title || null,
    public_email: normalizeEmail(candidate.public_email),
    public_phone: normalizePhone(candidate.public_phone),
    source_type: candidate.source_type,
    source_name: candidate.source_name,
    source_url: normalizeUrl(candidate.source_url),
    source_title: candidate.source_title || null,
    source_text: candidate.source_text,
    source_published_at: candidate.source_published_at || null,
    captured_at: candidate.captured_at || nowIso(),
    last_verified_at: scores.evidence_status === "website_verified" || scores.evidence_status === "public_signal_verified" ? nowIso() : null,
    next_verification_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    fit_score: scores.fit_score,
    intent_score: scores.intent_score,
    evidence_score: scores.evidence_score,
    freshness_score: scores.freshness_score,
    overall_score: scores.overall_score,
    score_reasons: scores.reasons,
    intent_category: scores.intent_category,
    evidence_status: scores.evidence_status,
    verification_status: qualification.verification_status,
    review_status: qualification.review_status,
    inventory_status: qualification.inventory_status,
    niche: profile.niche,
    target_location: profile.target_locations.join(", "),
    dedupe_key: dedupeKey,
    exclusivity_key: buildExclusivityKey(candidate, profile) || null,
    rejection_reason: qualification.rejection_reason || null,
    customer_summary: buildCustomerSummary(candidate, scores),
    recommended_action: recommendedAction(candidate, scores),
    is_test_data: Boolean(candidate.is_test_data),
    raw_payload: candidate.raw_payload || {},
    quality_flags: qualification.quality_flags,
    updated_at: nowIso(),
  };
}

export async function importQuickPasteOpportunities(input: QuickPasteImportInput): Promise<QuickPasteImportResult> {
  const supabase = supabaseOrThrow();
  const { accepted, rejected } = parseQuickPasteUrls(input.urls || "");
  if (accepted.length === 0) {
    return {
      importedRows: 0,
      duplicateRows: 0,
      rejectedRows: rejected.length,
      rejected,
      inventoryUrl: "/admin/inventory?status=DISCOVERED",
    };
  }

  const profile = await ensureQuickPasteDefaultSearchProfile(supabase);
  const candidates = accepted.map((item) => quickPasteCandidateFromUrl({
    url: item.url,
    niche: input.niche,
    location: input.location,
    sourceNote: input.sourceNote,
    publicSignalText: input.publicSignalText,
  }));
  const existing = await existingDedupeKeys(supabase, candidates.map((candidate) => buildOpportunityDedupeKey(candidate)));
  let importedRows = 0;
  let duplicateRows = 0;

  for (const candidate of candidates) {
    const dedupeKey = buildOpportunityDedupeKey(candidate);
    if (!dedupeKey || existing.has(dedupeKey)) {
      duplicateRows += 1;
      continue;
    }

    const calculated = calculateOpportunityScores(candidate, profile);
    const publicSignalText = String(candidate.raw_payload?.public_signal_text || "").trim();
    const intentCategory = publicSignalText ? "weak_research_signal" as const : "profile_only" as const;
    const intentScore = publicSignalText ? Math.min(calculated.intent_score, 60) : 20;
    const evidenceScore = Math.min(calculated.evidence_score, 20);
    const overallScore = Math.round((calculated.fit_score * 0.3) + (intentScore * 0.35) + (evidenceScore * 0.2) + (calculated.freshness_score * 0.15));
    const scores: OpportunityScores = {
      ...calculated,
      intent_score: intentScore,
      evidence_score: evidenceScore,
      overall_score: overallScore,
      intent_category: intentCategory,
      evidence_status: "profile_only",
      reasons: {
        ...calculated.reasons,
        intent: publicSignalText
          ? ["Admin supplied public signal text, but MarketVibe has not fetched or verified the source yet."]
          : ["Only a pasted profile or source URL is available."],
        evidence: ["Quick Paste stores the source URL only. No LinkedIn page, Sales Navigator page, cookie, login session, or unofficial API was used."],
      },
    };
    const qualification = {
      qualified: false,
      inventory_status: "DISCOVERED" as const,
      review_status: "pending" as const,
      verification_status: "DISCOVERED" as const,
      rejection_reason: "",
      quality_flags: ["quick_paste_unverified", "requires_manual_review", "not_ready_for_delivery"],
    };
    const row = {
      ...opportunityInsertRow(candidate, profile, scores, qualification),
      company_industry: input.niche?.trim() || candidate.company_industry || null,
      company_location: input.location?.trim() || candidate.company_location || null,
      internal_notes: input.sourceNote?.trim() || null,
      niche: input.niche?.trim() || profile.niche,
      target_location: input.location?.trim() || null,
      exclusivity_key: null,
    };

    const { error } = await supabase.from("opportunities").insert(row);
    if (error?.code === "23505") {
      duplicateRows += 1;
      existing.add(dedupeKey);
      continue;
    }
    if (error) throw error;
    importedRows += 1;
    existing.add(dedupeKey);
  }

  const params = new URLSearchParams({ status: "DISCOVERED" });
  if (input.niche?.trim()) params.set("niche", input.niche.trim());

  return {
    importedRows,
    duplicateRows,
    rejectedRows: rejected.length,
    rejected,
    profileId: profile.id,
    inventoryUrl: `/admin/inventory?${params.toString()}`,
  };
}

export async function syncApprovedNavigatorProspectsToOpportunities({
  prospectIds,
  trigger = "admin",
  limit = 500,
}: {
  prospectIds?: string[];
  trigger?: DiscoveryTrigger;
  limit?: number;
} = {}) {
  const supabase = supabaseOrThrow();
  const runId = await createRun(supabase, {
    runType: "discovery",
    trigger,
    idempotencyKey: runIdempotencyKey("navigator-import", trigger, prospectIds?.length ? prospectIds.slice().sort().join(",").slice(0, 120) : "approved"),
  });
  const counters: RunCounters = { records_discovered: 0, records_rejected: 0, records_qualified: 0, records_added_to_inventory: 0, duplicate_count: 0, stale_records: 0, customer_shortages: 0, source_failures: [] };

  try {
    let query = supabase
      .from("premium_imported_prospects")
      .select("*")
      .eq("review_status", "approved")
      .eq("is_test_data", false)
      .neq("inventory_status", "rejected")
      .neq("evidence_status", "profile_only")
      .order("updated_at", { ascending: false })
      .limit(Math.max(1, Math.min(1000, Math.floor(limit))));
    if (prospectIds?.length) query = query.in("id", prospectIds);

    const { data, error } = await query;
    if (error) throw error;

    const profile = navigatorOpportunityProfile();
    const candidates = ((data || []) as NavigatorProspectOpportunityRow[])
      .map((prospect) => navigatorProspectToCandidate(prospect))
      .filter(Boolean) as SourceCandidate[];
    counters.records_discovered = candidates.length;

    const existing = await existingDedupeKeys(supabase, candidates.map((candidate) => buildOpportunityDedupeKey(candidate)));
    for (const candidate of candidates) {
      const dedupeKey = buildOpportunityDedupeKey(candidate);
      if (!dedupeKey || existing.has(dedupeKey)) {
        counters.duplicate_count += 1;
        continue;
      }

      const scores = calculateOpportunityScores(candidate, profile);
      const qualification = qualifyOpportunity(candidate, scores, profile);
      if (qualification.qualified) counters.records_qualified += 1;
      else counters.records_rejected += 1;
      if (qualification.inventory_status === "IN_INVENTORY") counters.records_added_to_inventory += 1;

      const { error: insertError } = await supabase.from("opportunities").insert(opportunityInsertRow(candidate, profile, scores, qualification));
      if (insertError?.code === "23505") {
        counters.duplicate_count += 1;
        existing.add(dedupeKey);
        continue;
      }
      if (insertError) throw insertError;
      existing.add(dedupeKey);
    }

    await finishRun(supabase, runId, "completed", counters, {
      source: "sales_navigator_visible_card",
      candidate_filter: "approved_non_test_non_profile_only_with_qualified_signal",
    });
    return { ok: true, runId, ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Navigator opportunity sync failed." });
    throw error;
  }
}

export async function createOrUpdateSearchProfileFromOnboarding(input: {
  onboardingId?: string | null;
  email: string;
  productCode: PremiumProductCode;
  niche: string;
  country: string;
  city?: string;
  territory?: string;
  serviceOffer: string;
  idealBuyer: string;
  notes?: string;
}) {
  const supabase = supabaseOrThrow();
  const profile = profileFromOnboarding(input);
  const { data, error } = await supabase
    .from("customer_search_profiles")
    .upsert({
      ...profile,
      onboarding_id: input.onboardingId || null,
      updated_at: nowIso(),
    }, { onConflict: "customer_email,product_code,niche" })
    .select("id")
    .single();
  if (error) throw error;
  return { profileId: data?.id as string, profile };
}

export async function runOpportunityDiscovery({ trigger = "admin", profileId, includeLiveLeadEngine = true }: OpportunityDiscoveryOptions = {}) {
  const supabase = supabaseOrThrow();
  const counters: RunCounters = {
    records_discovered: 0,
    records_rejected: 0,
    records_qualified: 0,
    records_added_to_inventory: 0,
    duplicate_count: 0,
    stale_records: 0,
    customer_shortages: 0,
    source_failures: [],
  };
  const runId = await createRun(supabase, {
    runType: "discovery",
    trigger,
    idempotencyKey: runIdempotencyKey("discovery", trigger, profileId || "all"),
  });

  try {
    if (await automationPaused(supabase)) {
      await finishRun(supabase, runId, "skipped", counters, { reason: "automation_paused" });
      return { ok: true, skipped: true, runId, ...counters };
    }

    const profiles = await loadProfiles(supabase, profileId);
    for (const profile of profiles) {
      const { candidates, failures } = await discoverCandidatesForProfile(profile, { includeLiveLeadEngine });
      counters.source_failures.push(...failures);
      counters.records_discovered += candidates.length;
      const keys = candidates.map((candidate) => buildOpportunityDedupeKey(candidate));
      const existing = await existingDedupeKeys(supabase, keys);
      for (const candidate of candidates) {
        const dedupeKey = buildOpportunityDedupeKey(candidate);
        if (!dedupeKey || existing.has(dedupeKey)) {
          counters.duplicate_count += 1;
          continue;
        }
        const scores = calculateOpportunityScores(candidate, profile);
        const qualification = qualifyOpportunity(candidate, scores, profile);
        if (qualification.qualified) counters.records_qualified += 1;
        else counters.records_rejected += 1;
        if (qualification.inventory_status === "IN_INVENTORY") counters.records_added_to_inventory += 1;

        const { error } = await supabase.from("opportunities").insert(opportunityInsertRow(candidate, profile, scores, qualification));
        if (error?.code === "23505") counters.duplicate_count += 1;
        else if (error) throw error;
      }
    }

    for (const failure of counters.source_failures) {
      await supabase.from("opportunity_source_errors").insert({
        run_id: runId,
        source_name: String(failure.source_name || "unknown"),
        source_type: String(failure.source_type || "unknown"),
        source_url: failure.source_url ? String(failure.source_url) : null,
        error_message: String(failure.error || "Source failed."),
      });
    }

    const status = counters.source_failures.length ? "partial" : "completed";
    await finishRun(supabase, runId, status, counters);
    return { ok: true, runId, ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Discovery failed." });
    throw error;
  }
}

async function verifyOpportunity(supabase: SupabaseClient, row: Record<string, unknown>) {
  const input = dbRowToOpportunityInput(row);
  const notes: string[] = [];
  let websiteStatus = "not_checked";
  let sourceStatus = "not_checked";
  let evidenceFound = false;
  const update: Record<string, unknown> = { updated_at: nowIso() };

  try {
    const website = normalizeUrl(input.company_website);
    if (website) {
      const scan = await scanPublicWebsite(website);
      websiteStatus = "resolved";
      update.company_website = scan.finalUrl;
      update.company_domain = normalizeDomain(domainFromUrl(scan.finalUrl));
      update.public_email = input.public_email || scan.publicEmail || null;
      update.public_phone = input.public_phone || scan.publicPhone || null;
      evidenceFound = Boolean(scan.textEvidence || input.source_text);
      notes.push(`Website verified at ${scan.finalUrl}.`);
    }
  } catch (error) {
    websiteStatus = "failed";
    notes.push(error instanceof Error ? error.message : "Website verification failed.");
  }

  try {
    const source = normalizeUrl(input.source_url);
    if (source && source !== normalizeUrl(input.company_website)) {
      const scan = await scanPublicWebsite(source);
      sourceStatus = "resolved";
      evidenceFound = normalizeText(scan.textEvidence).length > 0 || normalizeText(input.source_text).length > 0;
      notes.push(`Source verified at ${scan.finalUrl}.`);
    } else if (source) {
      sourceStatus = websiteStatus === "resolved" ? "resolved" : "same_as_website";
      evidenceFound = evidenceFound || normalizeText(input.source_text).length > 0;
    }
  } catch (error) {
    sourceStatus = "failed";
    notes.push(error instanceof Error ? error.message : "Source verification failed.");
  }

  const verifiedInput = { ...input, ...update, last_verified_at: nowIso() };
  const scores = calculateOpportunityScores(verifiedInput);
  const qualification = qualifyOpportunity(verifiedInput, scores);
  Object.assign(update, {
    last_verified_at: nowIso(),
    next_verification_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    fit_score: scores.fit_score,
    intent_score: scores.intent_score,
    evidence_score: scores.evidence_score,
    freshness_score: scores.freshness_score,
    overall_score: scores.overall_score,
    score_reasons: scores.reasons,
    intent_category: scores.intent_category,
    evidence_status: scores.evidence_status,
    verification_status: qualification.verification_status,
    review_status: qualification.review_status,
    inventory_status: qualification.inventory_status,
    rejection_reason: qualification.rejection_reason || null,
    quality_flags: qualification.quality_flags,
    customer_summary: buildCustomerSummary(verifiedInput, scores),
    recommended_action: recommendedAction(verifiedInput, scores),
  });

  const { error } = await supabase.from("opportunities").update(update).eq("id", row.id);
  if (error) throw error;
  await supabase.from("opportunity_verification_events").insert({
    opportunity_id: row.id,
    verification_status: qualification.verification_status,
    website_status: websiteStatus,
    source_status: sourceStatus,
    evidence_found: evidenceFound,
    notes: notes.join(" "),
    raw_result: { scores, qualification },
  });
  return { qualified: qualification.qualified, expired: qualification.inventory_status === "EXPIRED" };
}

export async function runOpportunityVerification({ trigger = "admin", limit = 25 }: { trigger?: DiscoveryTrigger; limit?: number } = {}) {
  const supabase = supabaseOrThrow();
  const runId = await createRun(supabase, { runType: "verification", trigger, idempotencyKey: runIdempotencyKey("verification", trigger) });
  const counters: RunCounters = { records_discovered: 0, records_rejected: 0, records_qualified: 0, records_added_to_inventory: 0, duplicate_count: 0, stale_records: 0, customer_shortages: 0, source_failures: [] };
  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .in("inventory_status", ["DISCOVERED", "VALIDATING", "IN_INVENTORY", "QUALIFIED"])
      .lte("next_verification_at", nowIso())
      .eq("is_test_data", false)
      .limit(limit);
    if (error) throw error;
    for (const row of data || []) {
      try {
        const result = await verifyOpportunity(supabase, row as Record<string, unknown>);
        if (result.qualified) counters.records_qualified += 1;
        else counters.records_rejected += 1;
        if (result.expired) counters.stale_records += 1;
      } catch (error) {
        counters.source_failures.push({ opportunity_id: row.id, error: error instanceof Error ? error.message : "Verification failed." });
      }
    }
    await finishRun(supabase, runId, counters.source_failures.length ? "partial" : "completed", counters);
    return { ok: true, runId, ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Verification failed." });
    throw error;
  }
}

async function loadActiveReservations(supabase: SupabaseClient): Promise<ActiveExclusivity[]> {
  const { data, error } = await supabase
    .from("opportunity_exclusivity_reservations")
    .select("exclusivity_key,customer_email,ends_at,status")
    .eq("status", "active");
  if (error) throw error;
  return (data || []).map((row) => ({
    exclusivity_key: String(row.exclusivity_key),
    customer_email: String(row.customer_email),
    ends_at: row.ends_at ? String(row.ends_at) : null,
    status: "active" as const,
  }));
}

async function deliveredIdsForCustomer(supabase: SupabaseClient, email: string) {
  const { data, error } = await supabase
    .from("opportunity_assignments")
    .select("opportunity_id")
    .eq("customer_email", normalizeEmail(email))
    .in("assignment_status", ["published", "delivered", "replaced"]);
  if (error) throw error;
  return new Set((data || []).map((row) => String(row.opportunity_id)));
}

async function loadCustomerFeedbackPreferences(supabase: SupabaseClient, profile: CustomerSearchProfile) {
  let query = supabase
    .from("opportunity_assignments")
    .select("match_reason, opportunities(company_industry,company_location,company_country,niche,target_location,intent_category)")
    .eq("customer_email", normalizeEmail(profile.customer_email))
    .in("assignment_status", ["delivered", "replaced"])
    .order("updated_at", { ascending: false })
    .limit(200);

  query = profile.id ? query.eq("search_profile_id", profile.id) : query.eq("product_code", profile.product_code);

  const { data, error } = await query;
  if (error) throw error;
  return buildCustomerFeedbackPreferences((data || []) as Array<Record<string, unknown>>);
}

export async function fillCustomerShortages({ trigger = "admin", profileId, quantity }: { trigger?: DiscoveryTrigger; profileId?: string; quantity?: number } = {}) {
  const supabase = supabaseOrThrow();
  const runId = await createRun(supabase, { runType: "matching", trigger, idempotencyKey: runIdempotencyKey("matching", trigger, profileId || "all") });
  const counters: RunCounters = { records_discovered: 0, records_rejected: 0, records_qualified: 0, records_added_to_inventory: 0, duplicate_count: 0, stale_records: 0, customer_shortages: 0, source_failures: [] };
  let skippedProfilesWithoutPaidAccess = 0;
  try {
    const billable = await loadBillableProfiles(supabase, profileId);
    const profiles = billable.profiles;
    skippedProfilesWithoutPaidAccess = billable.skippedProfiles;
    if (profiles.length === 0) {
      const reason = skippedProfilesWithoutPaidAccess > 0 ? "no_billable_customer_profiles" : "no_active_customer_profiles";
      await finishRun(supabase, runId, "skipped", counters, { reason, skipped_profiles_without_paid_access: skippedProfilesWithoutPaidAccess });
      return { ok: true, skipped: true, reason, skippedProfilesWithoutPaidAccess, runId, ...counters };
    }

    const activeReservations = await loadActiveReservations(supabase);
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .in("inventory_status", ["QUALIFIED", "IN_INVENTORY"])
      .eq("review_status", "approved")
      .eq("is_test_data", false)
      .order("overall_score", { ascending: false })
      .limit(500);
    if (error) throw error;
    const opportunities = (data || []).map((row) => opportunityFromRow(row as Record<string, unknown>));

    for (const profile of profiles) {
      const delivered = await deliveredIdsForCustomer(supabase, profile.customer_email);
      const feedbackPreferences = await loadCustomerFeedbackPreferences(supabase, profile);
      const candidates = applyCustomerFeedbackPreferences(opportunities.map((opportunity) => ({
        ...opportunity,
        previously_delivered_to: delivered.has(opportunity.id) ? [profile.customer_email] : [],
      })), feedbackPreferences);
      const selection = selectMatchingOpportunities({ opportunities: candidates, profile, activeExclusivity: activeReservations, quantity });
      counters.customer_shortages += selection.shortage;

      for (const opportunity of selection.selected) {
        const feedbackAdjustedOpportunity = opportunity as FeedbackAdjustedOpportunity;
        const reservedAt = nowIso();
        const endsAt = profile.exclusivity_period_days > 0
          ? new Date(Date.now() + profile.exclusivity_period_days * 86_400_000).toISOString()
          : null;
        const exclusivityKey = opportunity.exclusivity_key || buildExclusivityKey(opportunity, profile);
        if (exclusivityKey) {
          const { error: reservationError } = await supabase.from("opportunity_exclusivity_reservations").insert({
            opportunity_id: opportunity.id,
            search_profile_id: profile.id || null,
            customer_email: profile.customer_email,
            product_code: profile.product_code,
            exclusivity_key: exclusivityKey,
            exclusivity_mode: profile.exclusivity_mode,
            starts_at: reservedAt,
            ends_at: endsAt,
          });
          if (reservationError?.code === "23505") {
            counters.duplicate_count += 1;
            continue;
          }
          if (reservationError) throw reservationError;
          activeReservations.push({ exclusivity_key: exclusivityKey, customer_email: profile.customer_email, ends_at: endsAt, status: "active" });
        }

        const { error: assignmentError } = await supabase.from("opportunity_assignments").insert({
          opportunity_id: opportunity.id,
          search_profile_id: profile.id || null,
          customer_email: profile.customer_email,
          product_code: profile.product_code,
          assignment_status: "assigned",
          delivery_status: "queued",
          match_reason: {
            reasons: opportunity.match_reasons,
            scores: { fit: opportunity.fit_score, intent: opportunity.intent_score, evidence: opportunity.evidence_score, overall: opportunity.overall_score },
            customer_feedback_adjustment: feedbackAdjustedOpportunity.customer_feedback_adjustment || 0,
            customer_feedback_reasons: feedbackAdjustedOpportunity.customer_feedback_reasons || [],
          },
          reserved_at: reservedAt,
          assigned_at: reservedAt,
        });
        if (assignmentError?.code === "23505") {
          counters.duplicate_count += 1;
          continue;
        }
        if (assignmentError) throw assignmentError;

        await supabase.from("opportunities").update({
          inventory_status: "ASSIGNED",
          assignment_status: "assigned",
          delivery_status: "queued",
          customer_email: profile.customer_email,
          product_code: profile.product_code,
          updated_at: reservedAt,
        }).eq("id", opportunity.id);
        counters.records_added_to_inventory += 1;
      }
    }

    await finishRun(supabase, runId, "completed", counters, { skipped_profiles_without_paid_access: skippedProfilesWithoutPaidAccess });
    return { ok: true, skippedProfilesWithoutPaidAccess, runId, ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Matching failed." });
    throw error;
  }
}

async function removeAssignmentWithoutPaidAccess(supabase: SupabaseClient, row: Record<string, unknown>, opportunity: Record<string, unknown>) {
  const blockedAt = nowIso();
  const matchReason = matchReasonObject(row.match_reason);
  const existingBlockers = Array.isArray(matchReason.delivery_blockers) ? matchReason.delivery_blockers : [];
  await supabase.from("opportunity_assignments").update({
    assignment_status: "removed",
    delivery_status: "not_delivered",
    match_reason: {
      ...matchReason,
      delivery_blockers: [...existingBlockers, "customer_has_no_active_paid_access"],
    },
    updated_at: blockedAt,
  }).eq("id", row.id);

  if (opportunity.id) {
    const canReturnToInventory = opportunity.verification_status === "QUALIFIED" && opportunity.review_status === "approved";
    await supabase.from("opportunities").update({
      inventory_status: canReturnToInventory ? "IN_INVENTORY" : opportunity.inventory_status || "REJECTED",
      assignment_status: "unassigned",
      delivery_status: "not_delivered",
      customer_email: null,
      product_code: null,
      updated_at: blockedAt,
    }).eq("id", opportunity.id);
  }
}

export async function publishDueOpportunityDeliveries({ trigger = "admin", sendEmail = true }: { trigger?: DiscoveryTrigger; sendEmail?: boolean } = {}) {
  const supabase = supabaseOrThrow();
  const runId = await createRun(supabase, { runType: "delivery", trigger, idempotencyKey: runIdempotencyKey("delivery", trigger, new Date().toISOString().slice(0, 10)) });
  const counters: RunCounters = { records_discovered: 0, records_rejected: 0, records_qualified: 0, records_added_to_inventory: 0, duplicate_count: 0, stale_records: 0, customer_shortages: 0, source_failures: [] };
  try {
    const { data, error } = await supabase
      .from("opportunity_assignments")
      .select("*, opportunities(*), customer_search_profiles(*)")
      .eq("assignment_status", "assigned")
      .eq("delivery_status", "queued")
      .limit(200);
    if (error) throw error;
    const grouped = new Map<string, Array<Record<string, unknown>>>();
    for (const row of data || []) {
      const opportunity = row.opportunities && typeof row.opportunities === "object" ? row.opportunities as Record<string, unknown> : {};
      const qualityFlags = opportunityDeliveryQualityFlags(dbRowToOpportunityInput(opportunity));
      if (qualityFlags.length > 0) {
        const blockedAt = nowIso();
        await supabase.from("opportunity_assignments").update({
          assignment_status: "removed",
          delivery_status: "not_delivered",
          match_reason: {
            ...matchReasonObject(row.match_reason),
            delivery_quality_blockers: qualityFlags,
          },
          updated_at: blockedAt,
        }).eq("id", row.id);
        if (opportunity.id) {
          await supabase.from("opportunities").update({
            inventory_status: "REJECTED",
            verification_status: "REJECTED",
            review_status: "rejected",
            rejection_reason: qualityFlags.join(", "),
            quality_flags: qualityFlags,
            updated_at: blockedAt,
          }).eq("id", opportunity.id);
        }
        counters.records_rejected += 1;
        continue;
      }
      const customerEmail = normalizeEmail(String(row.customer_email || ""));
      const productCode = String(row.product_code || "");
      if (!await hasBillableOpportunityAccess(supabase, customerEmail, productCode)) {
        await removeAssignmentWithoutPaidAccess(supabase, row as Record<string, unknown>, opportunity);
        counters.records_rejected += 1;
        continue;
      }

      const key = `${customerEmail}:${productCode}:${row.search_profile_id || "none"}`;
      grouped.set(key, [...(grouped.get(key) || []), row as Record<string, unknown>]);
    }

    for (const [key, assignments] of grouped) {
      const [customerEmail, productCode, profileId] = key.split(":");
      const token = deliveryToken();
      const idempotencyKey = `delivery:${key}:${new Date().toISOString().slice(0, 10)}`;
      const { data: batch, error: batchError } = await supabase
        .from("opportunity_delivery_batches")
        .upsert({
          customer_email: customerEmail,
          product_code: productCode,
          search_profile_id: profileId === "none" ? null : profileId,
          opportunity_count: assignments.length,
          status: "published",
          access_token_hash: tokenHash(token),
          idempotency_key: idempotencyKey,
          csv_generated_at: nowIso(),
        }, { onConflict: "idempotency_key" })
        .select("id")
        .single();
      if (batchError || !batch) throw batchError || new Error("Delivery batch could not be created.");

      const assignmentIds = assignments.map((assignment) => assignment.id);
      const opportunityIds = assignments.map((assignment) => String((assignment.opportunities as { id?: unknown })?.id || assignment.opportunity_id));
      const deliveredAt = nowIso();
      await supabase.from("opportunity_assignments").update({
        assignment_status: "delivered",
        delivery_status: "delivered",
        delivery_batch_id: batch.id,
        published_at: deliveredAt,
        delivered_at: deliveredAt,
        updated_at: deliveredAt,
      }).in("id", assignmentIds);
      await supabase.from("opportunities").update({
        inventory_status: "DELIVERED",
        assignment_status: "delivered",
        delivery_status: "delivered",
        updated_at: deliveredAt,
      }).in("id", opportunityIds);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.marketvibe1.com";
      const accessToken = createCustomerAccessToken(customerEmail);
      const dashboardUrl = `${baseUrl}${appendCustomerAccessParams("/dashboard", customerEmail, accessToken)}&opportunity_delivery_token=${encodeURIComponent(token)}`;
      const csvUrl = `${baseUrl}/api/opportunities/csv?email=${encodeURIComponent(customerEmail)}&access_token=${encodeURIComponent(accessToken)}`;
      const testMode = process.env.OPPORTUNITY_EMAIL_TEST_MODE === "1" || process.env.OPPORTUNITY_EMAIL_TEST_MODE === "true";

      if (sendEmail && !testMode) {
        try {
          await sendTransactionalEmail({
            to: customerEmail,
            subject: "Your MarketVibe opportunities are ready",
            htmlContent: `<p>Your MarketVibe opportunity delivery is ready.</p><p><a href="${dashboardUrl}">Open your dashboard</a></p><p><a href="${csvUrl}">Download CSV</a></p>`,
            textContent: `Your MarketVibe opportunity delivery is ready.\n\nDashboard:\n${dashboardUrl}\n\nCSV:\n${csvUrl}`,
          });
          await supabase.from("opportunity_delivery_batches").update({ status: "delivered", email_sent_at: nowIso() }).eq("id", batch.id);
        } catch (emailError) {
          await supabase.from("opportunity_delivery_batches").update({
            status: "email_failed",
            error_summary: { email: emailError instanceof Error ? emailError.message : "Email failed." },
          }).eq("id", batch.id);
          counters.source_failures.push({ customerEmail, error: emailError instanceof Error ? emailError.message : "Email failed." });
        }
      } else {
        await supabase.from("opportunity_delivery_batches").update({ status: "delivered", email_sent_at: testMode ? null : nowIso() }).eq("id", batch.id);
      }
      counters.records_added_to_inventory += assignments.length;
    }

    await finishRun(supabase, runId, counters.source_failures.length ? "partial" : "completed", counters);
    return { ok: true, runId, ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Delivery failed." });
    throw error;
  }
}

export async function refreshStaleOpportunities({ trigger = "admin", limit = 50 }: { trigger?: DiscoveryTrigger; limit?: number } = {}) {
  const supabase = supabaseOrThrow();
  const runId = await createRun(supabase, { runType: "refresh", trigger, idempotencyKey: runIdempotencyKey("refresh", trigger) });
  const counters: RunCounters = { records_discovered: 0, records_rejected: 0, records_qualified: 0, records_added_to_inventory: 0, duplicate_count: 0, stale_records: 0, customer_shortages: 0, source_failures: [] };
  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .in("inventory_status", ["IN_INVENTORY", "ASSIGNED", "PUBLISHED", "DELIVERED"])
      .lte("next_verification_at", nowIso())
      .limit(limit);
    if (error) throw error;

    for (const row of data || []) {
      const input = dbRowToOpportunityInput(row as Record<string, unknown>);
      if (shouldExpireOpportunity(input, 90)) {
        counters.stale_records += 1;
        await supabase.from("opportunities").update({
          inventory_status: "EXPIRED",
          verification_status: "EXPIRED",
          replacement_status: row.delivery_status === "delivered" ? "requested" : "none",
          rejection_reason: "stale_evidence",
          updated_at: nowIso(),
        }).eq("id", row.id);
      } else {
        await verifyOpportunity(supabase, row as Record<string, unknown>);
      }
    }
    await finishRun(supabase, runId, "completed", counters);
    return { ok: true, runId, ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Refresh failed." });
    throw error;
  }
}

export async function getOpportunityEngineSummary() {
  const supabaseStatus = supabaseConnectionStatus();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      automationPaused: false,
      latestRun: null,
      nextScheduledRun: "Unavailable until Supabase server environment is complete",
      sourcesEnabled: [],
      supabaseStatus,
      setupReady: false,
      counts: {
        activeProfiles: 0,
        qualifiedInventory: 0,
        reserved: 0,
        delivered: 0,
        expired: 0,
        replacementsDue: 0,
        failedDeliveries: 0,
      },
      sourceErrors: [{
        source_name: "Supabase configuration",
        error_message: formatSupabaseServerEnvError() || "Supabase privileged access is not configured.",
        created_at: nowIso(),
      }],
    };
  }
  const [
    settings,
    latestRun,
    profiles,
    inventory,
    reserved,
    delivered,
    expired,
    replacements,
    failedDeliveries,
    sourceErrors,
  ] = await Promise.all([
    supabase.from("opportunity_automation_settings").select("*").eq("id", "default").maybeSingle(),
    supabase.from("opportunity_source_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("customer_search_profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("inventory_status", "IN_INVENTORY").eq("is_test_data", false),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("inventory_status", "ASSIGNED"),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("inventory_status", "DELIVERED"),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("inventory_status", "EXPIRED"),
    supabase.from("opportunity_replacement_requests").select("id", { count: "exact", head: true }).eq("status", "requested"),
    supabase.from("opportunity_delivery_batches").select("id", { count: "exact", head: true }).eq("status", "email_failed"),
    supabase.from("opportunity_source_errors").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    automationPaused: Boolean(settings.data?.automation_paused),
    latestRun: latestRun.data || null,
    nextScheduledRun: "06:45 UTC full opportunity pipeline when Vercel cron is configured",
    sourcesEnabled: [
      ...(rssFeeds().length ? ["Configured public RSS feeds"] : []),
      "Manual reviewed public-signal imports",
    ],
    supabaseStatus,
    setupReady: true,
    counts: {
      activeProfiles: profiles.count || 0,
      qualifiedInventory: inventory.count || 0,
      reserved: reserved.count || 0,
      delivered: delivered.count || 0,
      expired: expired.count || 0,
      replacementsDue: replacements.count || 0,
      failedDeliveries: failedDeliveries.count || 0,
    },
    sourceErrors: sourceErrors.data || [],
  };
}

export async function listInventory(filters: Record<string, string> = {}) {
  const supabase = supabaseOrThrow();
  let query = supabase.from("opportunities").select("*").eq("is_test_data", false).order("created_at", { ascending: false }).limit(100);
  if (filters.status) query = query.eq("inventory_status", filters.status);
  if (filters.niche) query = query.ilike("niche", `%${filters.niche}%`);
  if (filters.country) query = query.ilike("company_country", `%${filters.country}%`);
  if (filters.company) query = query.ilike("company_name", `%${filters.company}%`);
  if (filters.evidence) query = query.eq("evidence_status", filters.evidence);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getInventoryStats() {
  const supabase = supabaseOrThrow();
  const statuses = ["IN_INVENTORY", "ASSIGNED", "DELIVERED", "EXPIRED", "REPLACEMENT_REQUESTED"];
  const results = await Promise.all(statuses.map((status) => supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("inventory_status", status).eq("is_test_data", false)));
  return Object.fromEntries(statuses.map((status, index) => [status, results[index].count || 0]));
}

export async function getOpportunityDetail(id: string) {
  const supabase = supabaseOrThrow();
  const [opportunity, assignments, verification, replacements] = await Promise.all([
    supabase.from("opportunities").select("*").eq("id", id).maybeSingle(),
    supabase.from("opportunity_assignments").select("*").eq("opportunity_id", id).order("created_at", { ascending: false }),
    supabase.from("opportunity_verification_events").select("*").eq("opportunity_id", id).order("checked_at", { ascending: false }).limit(20),
    supabase.from("opportunity_replacement_requests").select("*").eq("opportunity_id", id).order("created_at", { ascending: false }),
  ]);
  if (opportunity.error) throw opportunity.error;
  return {
    opportunity: opportunity.data,
    assignments: assignments.data || [],
    verification: verification.data || [],
    replacements: replacements.data || [],
  };
}

export async function getCustomerOpportunityDeliveries(email: string) {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from("opportunity_assignments")
    .select("*, opportunities(*)")
    .eq("customer_email", normalizeEmail(email))
    .in("assignment_status", ["published", "delivered"])
    .order("delivered_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export function buildOpportunityDeliveryCsv(rows: Array<Record<string, unknown>>) {
  const headers = [
    "Company",
    "Website",
    "Location",
    "Country",
    "Contact",
    "Role",
    "Source URL",
    "Evidence",
    "Date Found",
    "Last Verified",
    "Fit Score",
    "Fit Explanation",
    "Intent Score",
    "Intent Explanation",
    "Evidence Score",
    "Freshness Score",
    "Recommended Action",
    "Delivery Date",
    "Replacement Eligible",
  ];
  const body = rows.map((row) => {
    const opportunity = (row.opportunities || {}) as Record<string, unknown>;
    const scoreReasons = opportunity.score_reasons && typeof opportunity.score_reasons === "object" ? opportunity.score_reasons as Record<string, unknown> : {};
    return [
      opportunity.company_name,
      opportunity.company_website,
      opportunity.company_location,
      opportunity.company_country,
      opportunity.contact_full_name,
      opportunity.contact_job_title,
      opportunity.source_url,
      opportunity.source_text,
      opportunity.captured_at,
      opportunity.last_verified_at,
      opportunity.fit_score,
      Array.isArray(scoreReasons.fit) ? scoreReasons.fit.join(" | ") : "",
      opportunity.intent_score,
      Array.isArray(scoreReasons.intent) ? scoreReasons.intent.join(" | ") : "",
      opportunity.evidence_score,
      opportunity.freshness_score,
      opportunity.recommended_action,
      row.delivered_at,
      opportunity.replacement_status === "none" ? "Yes" : "No",
    ];
  });
  return [headers, ...body].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export async function recordOpportunityFeedback(input: {
  assignmentId: string;
  customerEmail: string;
  status: OpportunityFeedbackStatus;
  note?: string;
  submittedBy?: "customer" | "admin" | "system";
}) {
  const status = normalizeOpportunityFeedbackStatus(input.status);
  if (!status) throw new Error("Feedback status must be replied, booked, or not_useful.");

  const supabase = supabaseOrThrow();
  const { data: assignment, error: assignmentError } = await supabase
    .from("opportunity_assignments")
    .select("id,opportunity_id,customer_email,match_reason")
    .eq("id", input.assignmentId)
    .eq("customer_email", normalizeEmail(input.customerEmail))
    .maybeSingle();
  if (assignmentError) throw assignmentError;
  if (!assignment) throw new Error("Delivery assignment was not found for this customer.");

  const submittedAt = nowIso();
  const note = String(input.note || "").trim().slice(0, 500);
  const matchReason = matchReasonObject(assignment.match_reason);
  const customerFeedback = {
    status,
    note,
    submitted_at: submittedAt,
    submitted_by: input.submittedBy || "customer",
  };

  const { error: updateError } = await supabase.from("opportunity_assignments").update({
    match_reason: {
      ...matchReason,
      customer_feedback: customerFeedback,
    },
    updated_at: submittedAt,
  }).eq("id", assignment.id);
  if (updateError) throw updateError;

  let replacementRequestId: string | null = null;
  if (status === "not_useful") {
    const { data: existingReplacement, error: existingReplacementError } = await supabase
      .from("opportunity_replacement_requests")
      .select("id")
      .eq("assignment_id", assignment.id)
      .in("status", ["requested", "approved", "fulfilled"])
      .limit(1)
      .maybeSingle();
    if (existingReplacementError) throw existingReplacementError;

    if (existingReplacement?.id) {
      replacementRequestId = String(existingReplacement.id);
    } else {
      const replacement = await requestOpportunityReplacement({
        assignmentId: String(assignment.id),
        customerEmail: input.customerEmail,
        reason: "outside_criteria",
        details: note || "Customer marked this opportunity as not useful from the dashboard.",
        requestedBy: "customer",
      });
      replacementRequestId = replacement.requestId;
    }
  }

  return {
    ok: true,
    feedback: customerFeedback,
    replacementRequestId,
  };
}

export async function requestOpportunityReplacement(input: {
  assignmentId: string;
  customerEmail: string;
  reason: string;
  details?: string;
  requestedBy?: "customer" | "admin" | "system";
}) {
  const supabase = supabaseOrThrow();
  const { data: assignment, error: assignmentError } = await supabase
    .from("opportunity_assignments")
    .select("id,opportunity_id,customer_email")
    .eq("id", input.assignmentId)
    .eq("customer_email", normalizeEmail(input.customerEmail))
    .maybeSingle();
  if (assignmentError) throw assignmentError;
  if (!assignment) throw new Error("Delivery assignment was not found for this customer.");

  const { data, error } = await supabase.from("opportunity_replacement_requests").insert({
    assignment_id: assignment.id,
    opportunity_id: assignment.opportunity_id,
    customer_email: normalizeEmail(input.customerEmail),
    reason: input.reason,
    details: input.details || null,
    requested_by: input.requestedBy || "customer",
  }).select("id").single();
  if (error) throw error;

  await supabase.from("opportunities").update({
    inventory_status: "REPLACEMENT_REQUESTED",
    replacement_status: "requested",
    updated_at: nowIso(),
  }).eq("id", assignment.opportunity_id);

  if (replacementAutoApprovalReason(input.reason) && input.requestedBy === "system") {
    await approveReplacementRequest(String(data.id), "system", "Automatically approved after objective verification failure.");
  }

  return { requestId: data.id as string };
}

export async function approveReplacementRequest(requestId: string, reviewedBy = "admin", reviewNote = "") {
  const supabase = supabaseOrThrow();
  const { data: request, error } = await supabase
    .from("opportunity_replacement_requests")
    .select("*, opportunity_assignments(search_profile_id, product_code, customer_email)")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw error;
  if (!request) throw new Error("Replacement request was not found.");

  await supabase.from("opportunity_replacement_requests").update({
    status: "approved",
    reviewed_by: reviewedBy,
    review_note: reviewNote || null,
    updated_at: nowIso(),
  }).eq("id", requestId);
  await supabase.from("opportunity_assignments").update({
    assignment_status: "replaced",
    updated_at: nowIso(),
  }).eq("id", request.assignment_id);
  await supabase.from("opportunities").update({
    inventory_status: "REPLACED",
    replacement_status: "approved",
    updated_at: nowIso(),
  }).eq("id", request.opportunity_id);

  const assignment = Array.isArray(request.opportunity_assignments) ? request.opportunity_assignments[0] : request.opportunity_assignments;
  if (assignment?.search_profile_id) {
    await fillCustomerShortages({ trigger: "admin", profileId: String(assignment.search_profile_id), quantity: 1 });
  }
  return { approved: true };
}

export async function setOpportunityAutomationPaused(paused: boolean, reason = "") {
  const supabase = supabaseOrThrow();
  const { error } = await supabase.from("opportunity_automation_settings").upsert({
    id: "default",
    automation_paused: paused,
    paused_reason: reason || null,
    updated_at: nowIso(),
  }, { onConflict: "id" });
  if (error) throw error;
  return { automationPaused: paused };
}
