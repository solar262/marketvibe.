import { opportunityConfigForProduct, type ExclusivityMode, type ReplacementPolicy } from "@/lib/opportunity-products";
import type { PremiumProductCode } from "@/lib/premium-products";

export type IntentCategory =
  | "verified_direct_intent"
  | "public_opportunity_signal"
  | "weak_research_signal"
  | "company_fit"
  | "profile_only"
  | "unavailable";

export type EvidenceStatus =
  | "unavailable"
  | "profile_only"
  | "website_verified"
  | "public_signal_verified"
  | "decision_maker_verified";

export type InventoryStatus =
  | "DISCOVERED"
  | "VALIDATING"
  | "REJECTED"
  | "QUALIFIED"
  | "IN_INVENTORY"
  | "RESERVED"
  | "ASSIGNED"
  | "PUBLISHED"
  | "DELIVERED"
  | "REPLACEMENT_REQUESTED"
  | "REPLACED"
  | "EXPIRED";

export type OpportunityInput = {
  id?: string;
  company_name: string;
  company_domain?: string | null;
  company_website?: string | null;
  company_location?: string | null;
  company_country?: string | null;
  company_industry?: string | null;
  company_size?: string | null;
  company_description?: string | null;
  contact_full_name?: string | null;
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  contact_job_title?: string | null;
  public_email?: string | null;
  public_phone?: string | null;
  source_type: string;
  source_name: string;
  source_url: string;
  source_title?: string | null;
  source_text: string;
  source_published_at?: string | null;
  captured_at?: string | null;
  last_verified_at?: string | null;
  evidence_status?: EvidenceStatus | null;
  intent_category?: IntentCategory | null;
  inventory_status?: InventoryStatus | null;
  customer_email?: string | null;
  product_code?: PremiumProductCode | null;
  niche?: string | null;
  target_location?: string | null;
  is_test_data?: boolean | null;
};

export type OpportunityScores = {
  fit_score: number;
  intent_score: number;
  evidence_score: number;
  freshness_score: number;
  overall_score: number;
  intent_category: IntentCategory;
  evidence_status: EvidenceStatus;
  reasons: {
    fit: string[];
    intent: string[];
    evidence: string[];
    freshness: string[];
    overall: string;
  };
};

export type CustomerSearchProfile = {
  id?: string;
  customer_email: string;
  product_code: PremiumProductCode;
  status?: "active" | "paused";
  niche: string;
  target_service: string;
  target_industries: string[];
  target_locations: string[];
  company_sizes: string[];
  target_job_roles: string[];
  minimum_fit_score: number;
  minimum_intent_score: number;
  minimum_evidence_score: number;
  maximum_record_age_days: number;
  opportunity_quantity: number;
  delivery_frequency: "once" | "daily" | "weekly" | "monthly";
  exclusivity_mode: ExclusivityMode;
  exclusivity_period_days: number;
  allow_profile_only: boolean;
  replacement_policy: ReplacementPolicy;
  metadata?: Record<string, unknown>;
};

export type QualificationResult = {
  qualified: boolean;
  inventory_status: InventoryStatus;
  review_status: "pending" | "approved" | "rejected";
  verification_status: "DISCOVERED" | "VALIDATING" | "REJECTED" | "QUALIFIED" | "EXPIRED";
  rejection_reason: string;
  quality_flags: string[];
};

export type MatchableOpportunity = OpportunityInput & OpportunityScores & {
  id: string;
  dedupe_key: string;
  exclusivity_key?: string | null;
  inventory_status: InventoryStatus;
  delivery_status?: string | null;
  previously_delivered_to?: string[];
};

export type ActiveExclusivity = {
  exclusivity_key: string;
  customer_email: string;
  ends_at?: string | null;
  status: "active" | "released" | "expired";
};

const directIntentPattern = /\b(rfp|request for proposal|invitation to bid|bid opportunity|tender|procurement|quote request|(?:vendor|contractor|consultant|supplier) needs? to provide|request(?:ing)? (?:quotes?|proposals?|supplier|vendor|contractor|builder|agency|consultant|support|help)|supplier recommendations?|vendor recommendations?|looking for (?:a |an |new |qualified |local |specialist )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support|help|quotes?|proposals?)|need(?:s|ed)? (?:a |an |new |qualified |local |specialist )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support|help|quotes?|proposals?)|seeking (?:a |an |new |qualified |local |specialist |for )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support|help|quotes?|proposals?)|hiring (?:a |an |for |new |qualified |local |specialist )?(?:supplier|vendor|contractor|builder|agency|consultant|partner|subcontractor|developer|architect|engineer|service|support)|help with|outsourc(?:e|ing))\b/i;
const opportunityPattern = /\b(expansion|new location|opening|raised|launch(?:ed|ing)?|project|planning application|permit|contract awarded|major hiring|growth|migration|rebrand|new website|implementation)\b/i;
const weakSignalPattern = /\b(marketing|sales|customers|leads|pipeline|operations|manual|delay|broken|slow|booking|contact|reviews|seo|visibility|traffic|conversion)\b/i;
const relevantRolePattern = /\b(founder|owner|ceo|chief|vp|head|director|manager|partner|principal|operations|marketing|growth|sales|revenue|commercial|procurement|property|construction)\b/i;
const directoryPattern = /\b(yelp|yellowpages|trustpilot|clutch|g2|capterra|facebook|instagram|linkedin|google|bing|duckduckgo|reddit\.com\/r\/all)\b/i;
const listiclePattern = /\b(best|top|directory|list|near me|reviews?)\b/i;
const genericLeadRoundupPattern = /\b(?:industrial leads for the week|leads for the week|weekly leads|lead roundup|opportunity roundup)\b/i;
const policyGuidanceOnlyPattern = /\b(?:legal guidance|funding guidance|funding requirement|project funding|funding creates|build grants|capture(?:s|d)? [^.]{0,40} grants|programme funding|housing revenue account|appropriation of general fund|public consultation|consultation closes|regulatory guidance|policy update|grant guidance|sprinklers in care homes|refugee housing programme)\b/i;
const vagueOpportunityTitlePattern = /^(?:empty and under|untitled|unknown|n\/a|none)$/i;
const publicTenderDirectoryTitlePattern = /^[A-Z]{3,12}-\d+\s+-/i;
const publicTenderDirectorySourcePattern = /^(?:rfpmart\.com|governmentbids\.com|bidnetdirect\.com|find-tender\.service\.gov\.uk|sam\.gov)$/i;
const genericProcurementServicePattern = /\b(?:title (?:services|searches|examinations)|property and casualty|insurance broker|commodity brokerage|staff augmentation|vehicle transport|professional legal services|maintenance and repair staff|student athletic|catastrophic accident)\b/i;

export function normalizeText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function normalizePhone(value: unknown) {
  const text = String(value || "").trim();
  const plus = text.startsWith("+") ? "+" : "";
  const digits = text.replace(/\D/g, "");
  return digits.length >= 7 ? `${plus}${digits}` : "";
}

export function normalizeUrl(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|trk|ref)/i.test(key)) url.searchParams.delete(key);
    }
    const query = url.searchParams.toString();
    return `${url.protocol}//${url.hostname.toLowerCase().replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}${query ? `?${query}` : ""}`;
  } catch {
    return "";
  }
}

export function domainFromUrl(value: unknown) {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";
  try {
    return new URL(normalized).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizeDomain(value: unknown) {
  const text = String(value || "").trim().toLowerCase().replace(/^www\./, "").replace(/\/+$/, "");
  if (!text) return "";
  return text.includes("://") ? domainFromUrl(text) : text;
}

export function isFakeOrExampleDomain(domain: string) {
  const clean = normalizeDomain(domain);
  return !clean || clean === "localhost" || clean.endsWith(".localhost") || clean.endsWith(".test") || clean.endsWith(".example") || ["example.com", "example.org", "example.net", "test.com", "fake.com"].includes(clean);
}

export function isBlockedSourceUrl(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) return true;
  const parsed = new URL(normalized);
  const host = parsed.hostname.replace(/^www\./, "");
  if (/^(google|bing|duckduckgo)\./i.test(host)) return true;
  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) return true;
  if (/\/search\b/i.test(parsed.pathname)) return true;
  return false;
}

function isVisibleNavigatorCardSource(input: Pick<OpportunityInput, "source_type" | "source_url">) {
  if (input.source_type !== "sales_navigator_visible_card") return false;
  const normalized = normalizeUrl(input.source_url);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "");
    return (host === "linkedin.com" || host.endsWith(".linkedin.com"))
      && /^\/(?:sales\/lead|sales\/company|in|company)\//i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function sourceUrlCountsAsEvidence(input: Pick<OpportunityInput, "source_type" | "source_url">) {
  return Boolean(input.source_url && (!isBlockedSourceUrl(input.source_url) || isVisibleNavigatorCardSource(input)));
}

export function hasLowValueOpportunityEvidence(value: unknown) {
  const raw = String(value || "").trim();
  const text = normalizeText(raw);
  return Boolean(
    text
      && (
        genericLeadRoundupPattern.test(text)
        || policyGuidanceOnlyPattern.test(text)
        || publicTenderDirectoryTitlePattern.test(raw)
        || genericProcurementServicePattern.test(text)
      )
  );
}

export function opportunityDeliveryQualityFlags(input: Pick<OpportunityInput, "company_name" | "source_url" | "source_title" | "source_text">) {
  const flags: string[] = [];
  const title = String(input.source_title || "").trim();
  const evidence = [input.company_name, title, input.source_text].filter(Boolean).join(" ");
  const sourceHost = domainFromUrl(input.source_url);

  if (vagueOpportunityTitlePattern.test(title) || vagueOpportunityTitlePattern.test(String(input.company_name || "").trim())) {
    flags.push("vague_opportunity_record");
  }
  if (genericLeadRoundupPattern.test(evidence)) flags.push("generic_lead_roundup");
  if (policyGuidanceOnlyPattern.test(evidence)) flags.push("policy_or_guidance_only");
  if (genericProcurementServicePattern.test(evidence)) flags.push("generic_procurement_service");
  if (publicTenderDirectorySourcePattern.test(sourceHost) || publicTenderDirectoryTitlePattern.test(title)) {
    flags.push("public_tender_directory_without_named_buyer");
  }

  return Array.from(new Set(flags));
}

export function buildOpportunityDedupeKeys(input: OpportunityInput) {
  const domain = normalizeDomain(input.company_domain || domainFromUrl(input.company_website));
  const company = normalizeText(input.company_name);
  const fullName = normalizeText(input.contact_full_name || [input.contact_first_name, input.contact_last_name].filter(Boolean).join(" "));
  const email = normalizeEmail(input.public_email);
  const phone = normalizePhone(input.public_phone);
  const source = normalizeUrl(input.source_url);

  return {
    source: source ? `source:${source}` : "",
    email: email ? `email:${email}` : "",
    phone: phone ? `phone:${phone}` : "",
    companyDomain: company && domain ? `company_domain:${company}:${domain}` : "",
    companyPerson: company && fullName ? `company_person:${company}:${fullName}` : "",
  };
}

export function buildOpportunityDedupeKey(input: OpportunityInput) {
  const keys = buildOpportunityDedupeKeys(input);
  return keys.source || keys.email || keys.phone || keys.companyPerson || keys.companyDomain || "";
}

export function buildExclusivityKey(input: OpportunityInput, profile: Pick<CustomerSearchProfile, "exclusivity_mode" | "niche" | "target_locations" | "customer_email">) {
  if (profile.exclusivity_mode === "non_exclusive") return "";
  const domain = normalizeDomain(input.company_domain || domainFromUrl(input.company_website));
  const company = normalizeText(input.company_name);
  const niche = normalizeText(profile.niche || input.niche || "");
  const country = normalizeText(input.company_country || input.target_location || profile.target_locations[0] || "");
  if (profile.exclusivity_mode === "customer_exclusive" || profile.exclusivity_mode === "time_limited_exclusive") {
    return `customer:${profile.customer_email}:${domain || company}`;
  }
  if (profile.exclusivity_mode === "niche_exclusive") return `niche:${niche}:${domain || company}`;
  if (profile.exclusivity_mode === "geographic_exclusive") return `geo:${country}:${domain || company}`;
  return "";
}

function keywordMatch(haystack: string, values: string[]) {
  const text = normalizeText(haystack);
  return values.some((value) => value && text.includes(normalizeText(value)));
}

export function classifyIntentCategory(input: OpportunityInput): IntentCategory {
  const evidence = `${input.source_title || ""} ${input.source_text || ""}`;
  if (!normalizeText(evidence) && !input.source_url) return "unavailable";
  if (!normalizeText(evidence)) return "profile_only";
  if (directIntentPattern.test(evidence)) return "verified_direct_intent";
  if (opportunityPattern.test(evidence)) return "public_opportunity_signal";
  if (weakSignalPattern.test(evidence)) return "weak_research_signal";
  return "company_fit";
}

export function calculateOpportunityScores(input: OpportunityInput, profile?: Partial<CustomerSearchProfile>, now = new Date()): OpportunityScores {
  const fitReasons: string[] = [];
  const intentReasons: string[] = [];
  const evidenceReasons: string[] = [];
  const freshnessReasons: string[] = [];
  const companyText = `${input.company_name} ${input.company_description || ""} ${input.company_industry || ""} ${input.niche || ""}`;
  const locationText = `${input.company_location || ""} ${input.company_country || ""} ${input.target_location || ""}`;
  const roleText = `${input.contact_job_title || ""} ${input.contact_full_name || ""}`;
  const domain = normalizeDomain(input.company_domain || domainFromUrl(input.company_website));

  let fit = input.company_name ? 20 : 0;
  if (input.company_name) fitReasons.push("Company identity is present.");
  if (domain && !isFakeOrExampleDomain(domain)) {
    fit += 15;
    fitReasons.push("Company has a real domain or website.");
  }
  if (profile?.niche && keywordMatch(companyText, [profile.niche])) {
    fit += 20;
    fitReasons.push(`Company context matches niche "${profile.niche}".`);
  }
  if (profile?.target_industries?.length && keywordMatch(companyText, profile.target_industries)) {
    fit += 15;
    fitReasons.push("Industry matches the customer profile.");
  }
  if (profile?.target_locations?.length && keywordMatch(locationText, profile.target_locations)) {
    fit += 15;
    fitReasons.push("Location matches the customer profile.");
  } else if (locationText.trim()) {
    fit += 8;
    fitReasons.push("Company location is present.");
  }
  if (profile?.target_job_roles?.length && keywordMatch(roleText, profile.target_job_roles)) {
    fit += 15;
    fitReasons.push("Contact role matches the customer profile.");
  } else if (relevantRolePattern.test(roleText)) {
    fit += 10;
    fitReasons.push("Contact role appears commercially relevant.");
  }
  if (profile?.company_sizes?.length && keywordMatch(input.company_size || "", profile.company_sizes)) {
    fit += 8;
    fitReasons.push("Company size matches the customer profile.");
  }
  const fit_score = Math.min(100, fit);

  const intentCategory = classifyIntentCategory(input);
  let intent = 0;
  if (intentCategory === "verified_direct_intent") {
    intent = 100;
    intentReasons.push("Evidence contains an explicit request, supplier, quote, tender, hiring, or help-seeking signal.");
  } else if (intentCategory === "public_opportunity_signal") {
    intent = 80;
    intentReasons.push("Evidence shows expansion, funding, project, tender, launch, or hiring activity that can create demand.");
  } else if (intentCategory === "weak_research_signal") {
    intent = 60;
    intentReasons.push("Evidence suggests a relevant business need, but it is not a direct buying request.");
  } else if (intentCategory === "company_fit") {
    intent = 40;
    intentReasons.push("Company fits the niche, but the evidence is weak.");
  } else if (intentCategory === "profile_only") {
    intent = 20;
    intentReasons.push("Only profile or company context is available.");
  } else {
    intentReasons.push("No usable intent evidence is available.");
  }

  let evidence = 0;
  let evidenceStatus: EvidenceStatus = input.evidence_status || "unavailable";
  if (sourceUrlCountsAsEvidence(input)) {
    evidence += 25;
    evidenceReasons.push(input.source_type === "sales_navigator_visible_card"
      ? "Visible Sales Navigator card URL is stored as controlled provenance."
      : "Source URL is present and not a blocked search or social-login source.");
  }
  if (normalizeText(input.source_text).length >= 40) {
    evidence += 20;
    evidenceReasons.push("Evidence text is stored.");
  }
  if (domain && input.company_website && !isFakeOrExampleDomain(domain)) {
    evidence += 20;
    evidenceStatus = evidenceStatus === "unavailable" ? "website_verified" : evidenceStatus;
    evidenceReasons.push("Company website/domain is usable.");
  }
  if (intentCategory === "verified_direct_intent" || intentCategory === "public_opportunity_signal") {
    evidence += 20;
    evidenceStatus = "public_signal_verified";
    evidenceReasons.push("Evidence is direct enough to be treated as a public signal.");
  }
  if (input.contact_full_name && relevantRolePattern.test(roleText)) {
    evidence += 10;
    evidenceReasons.push("Named contact has a relevant role.");
  }
  if (normalizeEmail(input.public_email) || normalizePhone(input.public_phone)) {
    evidence += 5;
    evidenceReasons.push("Public contact detail is available.");
  }
  const evidence_score = Math.min(100, evidence);
  if (evidence_score === 0) evidenceStatus = "unavailable";
  if (evidenceStatus === "unavailable" && evidence_score > 0) evidenceStatus = "profile_only";

  const sourceDate = input.source_published_at || input.last_verified_at || input.captured_at;
  const ageDays = sourceDate ? Math.max(0, Math.floor((now.getTime() - Date.parse(sourceDate)) / 86_400_000)) : 9999;
  let freshness = 0;
  if (ageDays <= 7) freshness = 100;
  else if (ageDays <= 30) freshness = 85;
  else if (ageDays <= 90) freshness = 60;
  else if (ageDays <= 180) freshness = 35;
  else freshness = 10;
  freshnessReasons.push(sourceDate ? `Evidence age is ${ageDays} days.` : "No source or verification date was available.");

  const overall_score = Math.round((fit_score * 0.3) + (intent * 0.35) + (evidence_score * 0.2) + (freshness * 0.15));
  return {
    fit_score,
    intent_score: intent,
    evidence_score,
    freshness_score: freshness,
    overall_score,
    intent_category: intentCategory,
    evidence_status: evidenceStatus,
    reasons: {
      fit: fitReasons,
      intent: intentReasons,
      evidence: evidenceReasons,
      freshness: freshnessReasons,
      overall: "Overall score weights fit 30%, intent 35%, evidence 20%, and freshness 15%.",
    },
  };
}

export function qualifyOpportunity(input: OpportunityInput, scores: OpportunityScores, profile?: Partial<CustomerSearchProfile>, now = new Date()): QualificationResult {
  const flags: string[] = [];
  const domain = normalizeDomain(input.company_domain || domainFromUrl(input.company_website));
  const sourceDate = input.source_published_at || input.last_verified_at || input.captured_at;
  const maxAge = profile?.maximum_record_age_days || 90;
  const ageDays = sourceDate ? Math.max(0, Math.floor((now.getTime() - Date.parse(sourceDate)) / 86_400_000)) : 9999;

  flags.push(...opportunityDeliveryQualityFlags(input));
  if (input.is_test_data) flags.push("test_data");
  if (!normalizeText(input.company_name)) flags.push("missing_company");
  if (domain && isFakeOrExampleDomain(domain)) flags.push("fake_or_example_domain");
  if (!input.company_website && !input.source_url) flags.push("missing_company_reference");
  if (!sourceUrlCountsAsEvidence(input)) flags.push("broken_or_blocked_source_url");
  if (!normalizeText(input.source_text)) flags.push("empty_evidence");
  if (directoryPattern.test(input.source_url || "") && listiclePattern.test(`${input.source_title || ""} ${input.source_text || ""}`)) flags.push("directory_or_listicle_only");
  if (scores.intent_category === "profile_only" && !profile?.allow_profile_only) flags.push("profile_only_not_allowed");
  if (scores.intent_category === "unavailable") flags.push("unavailable_evidence");
  if (ageDays > maxAge) flags.push("stale_evidence");
  if (scores.fit_score < (profile?.minimum_fit_score || 50)) flags.push("fit_below_minimum");
  if (scores.intent_score < (profile?.minimum_intent_score || 35)) flags.push("intent_below_minimum");
  if (scores.evidence_score < (profile?.minimum_evidence_score || 50)) flags.push("evidence_below_minimum");
  if (scores.overall_score < 55) flags.push("overall_below_minimum");

  const qualityFlags = Array.from(new Set(flags));
  const qualified = qualityFlags.length === 0;
  return {
    qualified,
    inventory_status: qualified ? "IN_INVENTORY" : ageDays > maxAge ? "EXPIRED" : "REJECTED",
    review_status: qualified ? "approved" : "rejected",
    verification_status: qualified ? "QUALIFIED" : ageDays > maxAge ? "EXPIRED" : "REJECTED",
    rejection_reason: qualified ? "" : qualityFlags.join(", "),
    quality_flags: qualityFlags,
  };
}

export function profileFromOnboarding(input: {
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
  const config = opportunityConfigForProduct(input.productCode);
  const locations = [input.city, input.territory, input.country].filter(Boolean).map(String);
  const jobRoles = normalizeText(input.idealBuyer)
    .split(/[,;/]|\band\b/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);
  return {
    customer_email: normalizeEmail(input.email),
    product_code: input.productCode,
    status: "active" as const,
    niche: input.niche.trim(),
    target_service: input.serviceOffer.trim(),
    target_industries: [input.niche.trim()].filter(Boolean),
    target_locations: locations,
    company_sizes: [],
    target_job_roles: jobRoles,
    minimum_fit_score: config.minimumFitScore,
    minimum_intent_score: config.minimumIntentScore,
    minimum_evidence_score: config.minimumEvidenceScore,
    maximum_record_age_days: config.maximumRecordAgeDays,
    opportunity_quantity: config.opportunityQuantity,
    delivery_frequency: config.deliveryFrequency,
    exclusivity_mode: config.exclusivityMode,
    exclusivity_period_days: config.exclusivityPeriodDays,
    allow_profile_only: config.allowProfileOnly,
    replacement_policy: config.replacementPolicy,
    metadata: {
      onboarding_notes: input.notes || "",
      replacement_allowance: config.replacementAllowance,
    },
  } satisfies CustomerSearchProfile;
}

export function matchOpportunityToProfile(opportunity: MatchableOpportunity, profile: CustomerSearchProfile, activeExclusivity: ActiveExclusivity[] = [], now = new Date()) {
  const reasons: string[] = [];
  if (profile.status === "paused") return { matched: false, reasons: ["Profile is paused."] };
  if (!["QUALIFIED", "IN_INVENTORY"].includes(opportunity.inventory_status)) return { matched: false, reasons: [`Inventory status is ${opportunity.inventory_status}.`] };
  if (opportunity.is_test_data) return { matched: false, reasons: ["Test data is excluded."] };
  const deliveryQualityFlags = opportunityDeliveryQualityFlags(opportunity);
  if (deliveryQualityFlags.length > 0) return { matched: false, reasons: deliveryQualityFlags.map((flag) => `Delivery quality blocker: ${flag.replaceAll("_", " ")}.`) };
  if (opportunity.previously_delivered_to?.includes(profile.customer_email)) return { matched: false, reasons: ["Customer already received this opportunity."] };
  if (opportunity.fit_score < profile.minimum_fit_score) return { matched: false, reasons: ["Fit score is below profile minimum."] };
  if (opportunity.intent_score < profile.minimum_intent_score) return { matched: false, reasons: ["Intent score is below profile minimum."] };
  if (opportunity.evidence_score < profile.minimum_evidence_score) return { matched: false, reasons: ["Evidence score is below profile minimum."] };
  if (!profile.allow_profile_only && opportunity.intent_category === "profile_only") return { matched: false, reasons: ["Profile-only records are not allowed."] };
  if (profile.niche && !keywordMatch(`${opportunity.company_industry || ""} ${opportunity.company_description || ""} ${opportunity.niche || ""} ${opportunity.source_text || ""}`, [profile.niche])) {
    return { matched: false, reasons: ["Niche does not match."] };
  }
  if (profile.target_locations.length && !keywordMatch(`${opportunity.company_location || ""} ${opportunity.company_country || ""} ${opportunity.target_location || ""}`, profile.target_locations)) {
    return { matched: false, reasons: ["Location does not match."] };
  }
  const sourceDate = opportunity.source_published_at || opportunity.last_verified_at || opportunity.captured_at;
  const ageDays = sourceDate ? Math.max(0, Math.floor((now.getTime() - Date.parse(sourceDate)) / 86_400_000)) : 9999;
  if (ageDays > profile.maximum_record_age_days) return { matched: false, reasons: ["Record is too old for the profile."] };

  const exclusivityKey = buildExclusivityKey(opportunity, profile);
  const conflict = exclusivityKey
    ? activeExclusivity.find((reservation) => reservation.status === "active" && reservation.exclusivity_key === exclusivityKey && reservation.customer_email !== profile.customer_email && (!reservation.ends_at || Date.parse(reservation.ends_at) > now.getTime()))
    : null;
  if (conflict) return { matched: false, reasons: ["Active exclusivity reservation conflicts."] };

  reasons.push("Opportunity is qualified inventory.");
  reasons.push("Scores meet profile minimums.");
  if (profile.niche) reasons.push(`Matched niche "${profile.niche}".`);
  if (profile.target_locations.length) reasons.push(`Matched location profile: ${profile.target_locations.join(", ")}.`);
  return { matched: true, reasons, exclusivityKey };
}

export function selectMatchingOpportunities({
  opportunities,
  profile,
  activeExclusivity = [],
  quantity,
  now = new Date(),
}: {
  opportunities: MatchableOpportunity[];
  profile: CustomerSearchProfile;
  activeExclusivity?: ActiveExclusivity[];
  quantity?: number;
  now?: Date;
}) {
  const selected: Array<MatchableOpportunity & { match_reasons: string[]; exclusivity_key?: string }> = [];
  const rejected: Array<{ id: string; reasons: string[] }> = [];
  const target = quantity ?? profile.opportunity_quantity;
  const sorted = [...opportunities].sort((a, b) => b.overall_score - a.overall_score || b.freshness_score - a.freshness_score);
  const reservedKeys = new Set(activeExclusivity.filter((item) => item.status === "active").map((item) => item.exclusivity_key));

  for (const opportunity of sorted) {
    if (selected.length >= target) break;
    const currentExclusivity = [
      ...activeExclusivity,
      ...Array.from(reservedKeys).map((exclusivity_key) => ({
        exclusivity_key,
        customer_email: "__current_selection__",
        status: "active" as const,
      })),
    ];
    const match = matchOpportunityToProfile(opportunity, profile, currentExclusivity, now);
    if (!match.matched) {
      rejected.push({ id: opportunity.id, reasons: match.reasons });
      continue;
    }
    if (match.exclusivityKey) reservedKeys.add(match.exclusivityKey);
    selected.push({ ...opportunity, match_reasons: match.reasons, exclusivity_key: match.exclusivityKey });
  }

  return {
    selected,
    rejected,
    shortage: Math.max(0, target - selected.length),
  };
}

export function shouldExpireOpportunity(input: OpportunityInput, maxAgeDays: number, now = new Date()) {
  const sourceDate = input.source_published_at || input.last_verified_at || input.captured_at;
  if (!sourceDate) return true;
  const ageDays = Math.max(0, Math.floor((now.getTime() - Date.parse(sourceDate)) / 86_400_000));
  return ageDays > maxAgeDays;
}

export function replacementAutoApprovalReason(reason: string) {
  return reason === "website_dead" || reason === "evidence_unavailable";
}

export function buildCustomerSummary(input: OpportunityInput, scores: OpportunityScores) {
  const contact = input.contact_full_name ? `${input.contact_full_name}${input.contact_job_title ? `, ${input.contact_job_title}` : ""}` : "No verified decision-maker supplied";
  return [
    `${input.company_name} matches ${input.niche || "the selected profile"} with fit ${scores.fit_score}/100.`,
    `Contact: ${contact}.`,
    `Evidence: ${input.source_text}`,
    `Intent category: ${scores.intent_category.replaceAll("_", " ")}.`,
  ].join(" ");
}

export function recommendedAction(input: OpportunityInput, scores: OpportunityScores) {
  if (scores.intent_category === "verified_direct_intent") {
    return `Respond with a concise offer tied directly to the public request at ${input.source_url}.`;
  }
  if (scores.intent_category === "public_opportunity_signal") {
    return "Reference the public business event and suggest one practical next step related to the customer's service.";
  }
  if (scores.intent_category === "weak_research_signal") {
    return "Use a soft, evidence-based opener and avoid implying confirmed buying intent.";
  }
  return "Treat as low-confidence context only; do not position it as a high-intent opportunity.";
}
