import { createHash, createHmac } from "node:crypto";
import {
  addContactToMarketVibeList,
  addOrUpdateContact,
  marketVibeUrl,
  pricingUrl,
  proofPackUrl,
  sendTransactionalEmail,
} from "@/lib/brevo";
import { getSupabaseAdmin } from "@/lib/supabase";

export const salesPipelineStages = [
  "new_lead",
  "qualified",
  "contacted",
  "interested",
  "proof_pack_purchased",
  "proof_pack_delivered",
  "subscription_opportunity",
  "subscriber",
  "lost",
] as const;

export const salesEmailSequenceTypes = [
  "new_qualified_lead",
  "proof_pack_onboarding",
  "proof_pack_delivery_followup",
  "proof_pack_to_subscription",
  "inactive_subscriber",
  "cold_outbound",
] as const;

export const salesLeadFits = ["high", "medium", "low"] as const;
export const salesRegions = ["US", "UK", "EU", "OTHER"] as const;
export const customerJourneys = ["proof_pack", "subscriber"] as const;
export const salesLeadOrigins = ["inbound_fit_check", "cold_outbound", "navigator_import", "manual_import"] as const;
export const outboundRecipientTypes = ["uk_corporate_subscriber", "us_b2b_contact", "eu_contact", "sole_trader", "personal_email", "unknown"] as const;
export const salesLawfulBases = ["consent", "legitimate_interest", "can_spam_business_context", "manual_review", "not_applicable"] as const;
export const salesComplianceStatuses = ["not_checked", "approved", "manual_review", "blocked"] as const;
export const salesEmailPermissionStatuses = ["not_checked", "can_email", "manual_review", "do_not_email"] as const;
export const outboundSequenceStatuses = ["not_started", "approved", "queued", "sending", "sent", "paused", "stopped"] as const;

export type SalesPipelineStage = (typeof salesPipelineStages)[number];
export type SalesEmailSequenceType = (typeof salesEmailSequenceTypes)[number];
export type SalesLeadFit = (typeof salesLeadFits)[number];
export type SalesRegion = (typeof salesRegions)[number];
export type CustomerJourney = (typeof customerJourneys)[number];
export type SalesLeadOrigin = (typeof salesLeadOrigins)[number];
export type OutboundRecipientType = (typeof outboundRecipientTypes)[number];
export type SalesLawfulBasis = (typeof salesLawfulBases)[number];
export type SalesComplianceStatus = (typeof salesComplianceStatuses)[number];
export type SalesEmailPermissionStatus = (typeof salesEmailPermissionStatuses)[number];
export type OutboundSequenceStatus = (typeof outboundSequenceStatuses)[number];

export type ValidatedSalesLeadInput = {
  email: string;
  name: string;
  companyName: string;
  website: string;
  customerJourney: CustomerJourney;
  serviceOffered: string;
  averageClientValue: number;
  targetIndustry: string;
  targetCountries: string;
  companySize: string;
  weeklyOutreachCapacity: number;
  currentLeadGenerationMethod: string;
  region: SalesRegion;
  country: string;
  consentMarketing: boolean;
  consentSource: string;
  consentIp: string;
  utmSource: string;
  utmCampaign: string;
  source: string;
};

export type SalesLeadScore = {
  score: number;
  fit: SalesLeadFit;
  reasons: string[];
};

export type ValidatedOutboundProspectInput = {
  email: string;
  name: string;
  companyName: string;
  website: string;
  customerJourney: CustomerJourney;
  serviceOffered: string;
  averageClientValue: number;
  targetIndustry: string;
  targetCountries: string;
  companySize: string;
  weeklyOutreachCapacity: number;
  currentLeadGenerationMethod: string;
  region: SalesRegion;
  country: string;
  sourceUrl: string;
  sourceEvidence: string;
  leadOrigin: SalesLeadOrigin;
  recipientType: OutboundRecipientType;
  lawfulBasis: SalesLawfulBasis;
  complianceStatus: SalesComplianceStatus;
  emailPermissionStatus: SalesEmailPermissionStatus;
  metadata: Record<string, unknown>;
};

export type SalesLeadListRow = {
  id: string;
  email: string;
  normalized_email: string;
  name: string | null;
  company_name: string | null;
  website: string | null;
  customer_journey: CustomerJourney;
  service_offered: string;
  average_client_value: number;
  target_industry: string;
  target_countries: string;
  company_size: string;
  weekly_outreach_capacity: number;
  current_lead_generation_method: string;
  score: number;
  fit: SalesLeadFit;
  score_reasons: string[];
  stage: SalesPipelineStage;
  owner: string | null;
  region: SalesRegion;
  country: string | null;
  consent_marketing: boolean;
  is_suppressed: boolean;
  lead_origin: SalesLeadOrigin;
  source_url: string | null;
  source_evidence: string | null;
  recipient_type: OutboundRecipientType;
  lawful_basis: SalesLawfulBasis;
  compliance_status: SalesComplianceStatus;
  email_permission_status: SalesEmailPermissionStatus;
  cold_outbound_approved_at: string | null;
  cold_outbound_approved_by: string | null;
  outbound_sequence_status: OutboundSequenceStatus;
  metadata: Record<string, unknown>;
  lost_reason: string | null;
  next_task_at: string | null;
  last_contacted_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SalesLeadNoteRow = {
  id: string;
  lead_id: string;
  body: string;
  created_by: string | null;
  created_at: string;
};

export type SalesLeadTaskRow = {
  id: string;
  lead_id: string;
  title: string;
  due_at: string | null;
  status: "todo" | "done" | "skipped";
  assigned_to: string | null;
  created_at: string;
  completed_at: string | null;
};

export type SalesLeadStatusHistoryRow = {
  id: string;
  lead_id: string;
  from_stage: SalesPipelineStage | null;
  to_stage: SalesPipelineStage;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

type SalesEmailEventRow = {
  id: string;
  lead_id: string | null;
  email: string;
  normalized_email: string;
  sequence_type: SalesEmailSequenceType;
  subject: string;
  html_content: string;
  text_content: string;
  status: "queued" | "sent" | "skipped" | "failed";
  scheduled_at: string;
  sent_at: string | null;
  provider_message_id: string | null;
  failure_reason: string | null;
  created_at: string;
};

type ColdOutboundAssessment = {
  allowed: boolean;
  reason: string;
};

type QueuedEmail = {
  sequenceType: SalesEmailSequenceType;
  subject: string;
  htmlContent: string;
  textContent: string;
  scheduledAt: string;
};

type MetadataQueuedEmail = QueuedEmail & {
  status: "queued" | "sent" | "failed" | "skipped";
  sentAt?: string;
  failureReason?: string;
  providerMessageId?: string;
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanLower(value: unknown) {
  return cleanString(value).toLowerCase();
}

export function normalizeSalesEmail(value: unknown) {
  return cleanLower(value);
}

function readString(input: Record<string, unknown>, key: string) {
  return cleanString(input[key]);
}

function readBoolean(input: Record<string, unknown>, key: string) {
  return input[key] === true || input[key] === "true" || input[key] === "on";
}

function readNumber(input: Record<string, unknown>, key: string) {
  const raw = typeof input[key] === "number" ? input[key] : Number(cleanString(input[key]).replace(/[^\d.]/g, ""));
  return Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
}

function isEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function isCustomerJourney(value: string): value is CustomerJourney {
  return customerJourneys.includes(value as CustomerJourney);
}

function isSalesRegion(value: string): value is SalesRegion {
  return salesRegions.includes(value as SalesRegion);
}

function isSalesLeadOrigin(value: string): value is SalesLeadOrigin {
  return salesLeadOrigins.includes(value as SalesLeadOrigin);
}

export function isSalesPipelineStage(value: unknown): value is SalesPipelineStage {
  return salesPipelineStages.includes(value as SalesPipelineStage);
}

function inferRegion(country: string): SalesRegion {
  const value = country.toLowerCase();
  if (/\b(us|usa|united states|america)\b/.test(value)) return "US";
  if (/\b(uk|gb|great britain|united kingdom|england|scotland|wales|northern ireland)\b/.test(value)) return "UK";
  if (/\b(austria|belgium|bulgaria|croatia|cyprus|czech|denmark|estonia|finland|france|germany|greece|hungary|ireland|italy|latvia|lithuania|luxembourg|malta|netherlands|poland|portugal|romania|slovakia|slovenia|spain|sweden|eu|european union)\b/.test(value)) return "EU";
  return "OTHER";
}

function fitFromScore(score: number): SalesLeadFit {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

const freeEmailDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "mail.com",
  "gmx.com",
  "gmx.co.uk",
  "yandex.com",
]);

function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() || "";
}

export function isBusinessSalesEmail(email: string) {
  const domain = emailDomain(normalizeSalesEmail(email));
  return Boolean(domain) && !freeEmailDomains.has(domain);
}

function inferOutboundRecipientType(input: { email: string; region: SalesRegion; companyName: string; metadata?: Record<string, unknown> }): OutboundRecipientType {
  if (!isBusinessSalesEmail(input.email)) return "personal_email";
  const metaText = JSON.stringify(input.metadata || {}).toLowerCase();
  if (/\b(sole trader|partnership|individual|self employed|self-employed)\b/.test(metaText)) return "sole_trader";
  if (input.region === "UK" && input.companyName) return "uk_corporate_subscriber";
  if (input.region === "US" && input.companyName) return "us_b2b_contact";
  if (input.region === "EU") return "eu_contact";
  return "unknown";
}

function outboundLawfulBasis(region: SalesRegion): SalesLawfulBasis {
  if (region === "UK") return "legitimate_interest";
  if (region === "US") return "can_spam_business_context";
  if (region === "EU") return "manual_review";
  return "manual_review";
}

function classifyOutboundPermission(input: {
  region: SalesRegion;
  recipientType: OutboundRecipientType;
  sourceUrl: string;
  sourceEvidence: string;
}): Pick<ValidatedOutboundProspectInput, "complianceStatus" | "emailPermissionStatus"> {
  if (!input.sourceUrl || !input.sourceEvidence) {
    return { complianceStatus: "blocked", emailPermissionStatus: "do_not_email" };
  }
  if (input.recipientType === "personal_email" || input.recipientType === "sole_trader") {
    return { complianceStatus: "blocked", emailPermissionStatus: "do_not_email" };
  }
  if ((input.region === "UK" && input.recipientType === "uk_corporate_subscriber") || (input.region === "US" && input.recipientType === "us_b2b_contact")) {
    return { complianceStatus: "approved", emailPermissionStatus: "can_email" };
  }
  if (input.region === "EU") {
    return { complianceStatus: "manual_review", emailPermissionStatus: "manual_review" };
  }
  return { complianceStatus: "manual_review", emailPermissionStatus: "manual_review" };
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function unsubscribeSecret() {
  return process.env.SALES_PIPELINE_UNSUBSCRIBE_SECRET
    || process.env.ADMIN_SESSION_SECRET
    || process.env.CRON_SECRET
    || "marketvibe-sales-pipeline-dev";
}

export function createSalesUnsubscribeToken(email: string) {
  return createHmac("sha256", unsubscribeSecret()).update(normalizeSalesEmail(email)).digest("hex").slice(0, 48);
}

function hashSalesUnsubscribeToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifySalesUnsubscribeToken(email: string, token: string) {
  return createSalesUnsubscribeToken(email) === cleanString(token);
}

function unsubscribeUrl(email: string, token: string) {
  const params = new URLSearchParams({ email: normalizeSalesEmail(email), token });
  return `${marketVibeUrl}/api/sales/unsubscribe?${params.toString()}`;
}

export function salesOutboundConfig() {
  const dailyLimit = Number(process.env.SALES_OUTBOUND_DAILY_LIMIT || "25");
  const postalAddress = cleanString(process.env.SALES_OUTBOUND_POSTAL_ADDRESS || process.env.OUTREACH_POSTAL_ADDRESS || "");
  const allowedRegions = cleanString(process.env.SALES_OUTBOUND_ALLOWED_REGIONS || "UK,US")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  return {
    enabled: process.env.SALES_OUTBOUND_ENABLED === "true",
    dailyLimit: Number.isFinite(dailyLimit) ? Math.max(0, Math.round(dailyLimit)) : 25,
    postalAddress,
    allowedRegions,
    missing: {
      enabledFlag: process.env.SALES_OUTBOUND_ENABLED !== "true",
      postalAddress: !postalAddress,
    },
  };
}

export function salesOutboundRunLimit(runCount = 5) {
  const dailyLimit = salesOutboundConfig().dailyLimit || 25;
  const divisor = Math.max(1, Math.floor(runCount));
  return Math.min(100, Math.max(1, Math.ceil(dailyLimit / divisor)));
}

function validateRequired(errors: Record<string, string>, key: string, value: string, label: string) {
  if (!value) errors[key] = `${label} is required.`;
}

export function validateSalesLeadInput(payload: unknown): { ok: true; value: ValidatedSalesLeadInput } | { ok: false; errors: Record<string, string> } {
  const input = toRecord(payload);
  const errors: Record<string, string> = {};
  const email = normalizeSalesEmail(input.email);
  const customerJourney = readString(input, "customerJourney") || "proof_pack";
  const serviceOffered = readString(input, "serviceOffered");
  const averageClientValue = readNumber(input, "averageClientValue");
  const targetIndustry = readString(input, "targetIndustry");
  const targetCountries = readString(input, "targetCountries");
  const companySize = readString(input, "companySize");
  const weeklyOutreachCapacity = readNumber(input, "weeklyOutreachCapacity");
  const currentLeadGenerationMethod = readString(input, "currentLeadGenerationMethod");
  const country = readString(input, "country") || targetCountries;
  const rawRegion = readString(input, "region").toUpperCase();
  const region = isSalesRegion(rawRegion) ? rawRegion : inferRegion(country);
  const consentMarketing = readBoolean(input, "consentMarketing");

  if (!isEmail(email)) errors.email = "A valid email address is required.";
  if (!isCustomerJourney(customerJourney)) errors.customerJourney = "Choose Proof Pack or recurring subscriber.";
  validateRequired(errors, "serviceOffered", serviceOffered, "Service offered");
  if (averageClientValue <= 0) errors.averageClientValue = "Average client value must be greater than zero.";
  validateRequired(errors, "targetIndustry", targetIndustry, "Target industry");
  validateRequired(errors, "targetCountries", targetCountries, "Target countries");
  validateRequired(errors, "companySize", companySize, "Company size");
  if (weeklyOutreachCapacity <= 0) errors.weeklyOutreachCapacity = "Weekly outreach capacity must be greater than zero.";
  validateRequired(errors, "currentLeadGenerationMethod", currentLeadGenerationMethod, "Current lead-generation method");
  if (!consentMarketing) errors.consentMarketing = "Consent is required before MarketVibe can send the requested follow-up.";

  if (Object.keys(errors).length > 0 || !isCustomerJourney(customerJourney)) return { ok: false, errors };

  return {
    ok: true,
    value: {
      email,
      name: readString(input, "name"),
      companyName: readString(input, "companyName"),
      website: readString(input, "website"),
      customerJourney,
      serviceOffered,
      averageClientValue,
      targetIndustry,
      targetCountries,
      companySize,
      weeklyOutreachCapacity,
      currentLeadGenerationMethod,
      region,
      country,
      consentMarketing,
      consentSource: readString(input, "consentSource") || "sales_qualification_form",
      consentIp: readString(input, "consentIp"),
      utmSource: readString(input, "utmSource"),
      utmCampaign: readString(input, "utmCampaign"),
      source: readString(input, "source") || "qualification_form",
    },
  };
}

export function validateOutboundProspectInput(payload: unknown): { ok: true; value: ValidatedOutboundProspectInput } | { ok: false; errors: Record<string, string> } {
  const input = toRecord(payload);
  const errors: Record<string, string> = {};
  const email = normalizeSalesEmail(input.email);
  const companyName = readString(input, "companyName") || readString(input, "company_name") || readString(input, "company");
  const country = readString(input, "country") || readString(input, "targetCountries") || readString(input, "target_countries");
  const rawRegion = readString(input, "region").toUpperCase();
  const region = isSalesRegion(rawRegion) ? rawRegion : inferRegion(country);
  const sourceUrl = readString(input, "sourceUrl") || readString(input, "source_url") || readString(input, "url");
  const sourceEvidence = readString(input, "sourceEvidence") || readString(input, "source_evidence") || readString(input, "evidence") || readString(input, "signal");
  const rawLeadOrigin = readString(input, "leadOrigin") || readString(input, "lead_origin") || "cold_outbound";
  const leadOrigin = isSalesLeadOrigin(rawLeadOrigin) ? rawLeadOrigin : "cold_outbound";
  const metadata = toRecord(input.metadata);

  if (!isEmail(email)) errors.email = "A valid business email is required.";
  if (!companyName && !readString(input, "name")) errors.companyName = "Company or contact name is required.";
  if (!sourceUrl) errors.sourceUrl = "Source URL is required before cold outbound.";
  if (!sourceEvidence) errors.sourceEvidence = "Source evidence is required before cold outbound.";

  const recipientType = inferOutboundRecipientType({ email, region, companyName, metadata });
  const permission = classifyOutboundPermission({ region, recipientType, sourceUrl, sourceEvidence });

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      email,
      name: readString(input, "name"),
      companyName,
      website: readString(input, "website"),
      customerJourney: "proof_pack",
      serviceOffered: readString(input, "serviceOffered") || readString(input, "service_offered") || "MarketVibe Proof Pack and recurring Radar opportunity intelligence",
      averageClientValue: readNumber(input, "averageClientValue") || readNumber(input, "average_client_value") || 5000,
      targetIndustry: readString(input, "targetIndustry") || readString(input, "target_industry") || "Specialist consultants and boutique B2B agencies",
      targetCountries: readString(input, "targetCountries") || readString(input, "target_countries") || country || region,
      companySize: readString(input, "companySize") || readString(input, "company_size") || "2-15",
      weeklyOutreachCapacity: readNumber(input, "weeklyOutreachCapacity") || readNumber(input, "weekly_outreach_capacity") || 10,
      currentLeadGenerationMethod: readString(input, "currentLeadGenerationMethod") || readString(input, "current_lead_generation_method") || "LinkedIn, CRM, manual research, or current outbound process",
      region,
      country,
      sourceUrl,
      sourceEvidence,
      leadOrigin,
      recipientType,
      lawfulBasis: outboundLawfulBasis(region),
      complianceStatus: permission.complianceStatus,
      emailPermissionStatus: permission.emailPermissionStatus,
      metadata,
    },
  };
}

export function scoreSalesLead(input: ValidatedSalesLeadInput): SalesLeadScore {
  let score = 0;
  const reasons: string[] = [];
  const industry = input.targetIndustry.toLowerCase();
  const countries = input.targetCountries.toLowerCase();
  const method = input.currentLeadGenerationMethod.toLowerCase();
  const companySize = input.companySize.toLowerCase();

  if (input.serviceOffered.length >= 3) {
    score += 10;
    reasons.push("Clear service offer");
  }

  if (input.averageClientValue >= 5000) {
    score += 20;
    reasons.push("High client value");
  } else if (input.averageClientValue >= 2000) {
    score += 16;
    reasons.push("Strong client value");
  } else if (input.averageClientValue >= 1000) {
    score += 12;
    reasons.push("Viable client value");
  } else if (input.averageClientValue >= 500) {
    score += 6;
    reasons.push("Some client value");
  }

  if (industry) {
    score += 10;
    reasons.push("Defined target industry");
  }
  if (/\b(b2b|agency|consult|software|saas|construction|property|industrial|manufacturing|professional|healthcare|legal|finance)\b/.test(industry)) {
    score += 5;
    reasons.push("Industry is suitable for high-context outreach");
  }

  if (countries) {
    score += 6;
    reasons.push("Defined target countries");
  }
  if (/\b(us|usa|united states|uk|united kingdom|germany|france|netherlands|ireland|canada|australia|eu|europe)\b/.test(countries)) {
    score += 4;
    reasons.push("Target market has strong public signal coverage");
  }

  if (/\b(2-10|11-50|51-200|small|mid|medium|agency|team)\b/.test(companySize)) {
    score += 10;
    reasons.push("Company size can act on prospecting data");
  } else if (/\b(201-500|500|enterprise|large)\b/.test(companySize)) {
    score += 8;
    reasons.push("Larger team may need recurring delivery");
  } else if (/\b(solo|founder|freelance|1)\b/.test(companySize)) {
    score += 5;
    reasons.push("Solo operator can validate with Proof Pack first");
  }

  if (input.weeklyOutreachCapacity >= 100) {
    score += 15;
    reasons.push("High weekly outreach capacity");
  } else if (input.weeklyOutreachCapacity >= 50) {
    score += 12;
    reasons.push("Good weekly outreach capacity");
  } else if (input.weeklyOutreachCapacity >= 20) {
    score += 8;
    reasons.push("Enough capacity to use the leads");
  } else if (input.weeklyOutreachCapacity > 0) {
    score += 4;
    reasons.push("Limited but usable outreach capacity");
  }

  if (/\b(manual|google|linkedin|sales nav|sales navigator|referral|cold|email|spreadsheet|crm|apollo|clay)\b/.test(method)) {
    score += 10;
    reasons.push("Current method leaves room for better buyer-intent context");
  } else if (method) {
    score += 5;
    reasons.push("Current lead-generation method is known");
  }

  if (input.customerJourney === "subscriber") {
    score += 10;
    reasons.push("Interested in recurring delivery");
  } else {
    score += 6;
    reasons.push("Good fit for a one-off Proof Pack test");
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return { score: finalScore, fit: fitFromScore(finalScore), reasons };
}

export function scoreOutboundProspect(input: ValidatedOutboundProspectInput): SalesLeadScore {
  const base = scoreSalesLead({
    email: input.email,
    name: input.name,
    companyName: input.companyName,
    website: input.website,
    customerJourney: input.customerJourney,
    serviceOffered: input.serviceOffered,
    averageClientValue: input.averageClientValue,
    targetIndustry: input.targetIndustry,
    targetCountries: input.targetCountries,
    companySize: input.companySize,
    weeklyOutreachCapacity: input.weeklyOutreachCapacity,
    currentLeadGenerationMethod: input.currentLeadGenerationMethod,
    region: input.region,
    country: input.country,
    consentMarketing: true,
    consentSource: "outbound_scoring_only",
    consentIp: "",
    utmSource: "",
    utmCampaign: "",
    source: input.leadOrigin,
  });
  let score = base.score;
  const reasons = [...base.reasons];

  if (input.complianceStatus === "approved") {
    score += 8;
    reasons.push("UK/US B2B outbound compliance gate passed");
  }
  if (input.sourceUrl && input.sourceEvidence) {
    score += 7;
    reasons.push("Has source-backed reason to contact");
  }
  if (input.recipientType === "personal_email" || input.recipientType === "sole_trader") {
    score -= 35;
    reasons.push("Blocked from automated cold outbound");
  }
  if (input.region === "EU" || input.region === "OTHER") {
    score -= 20;
    reasons.push("Region requires manual review before email");
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return { score: finalScore, fit: fitFromScore(finalScore), reasons };
}

function initialStageForScore(score: number): SalesPipelineStage {
  return score >= 60 ? "qualified" : "new_lead";
}

function rowFromInput(input: ValidatedSalesLeadInput, scored: SalesLeadScore, token: string, stage: SalesPipelineStage) {
  return {
    email: input.email,
    normalized_email: input.email,
    name: input.name || null,
    company_name: input.companyName || null,
    website: input.website || null,
    customer_journey: input.customerJourney,
    service_offered: input.serviceOffered,
    average_client_value: input.averageClientValue,
    target_industry: input.targetIndustry,
    target_countries: input.targetCountries,
    company_size: input.companySize,
    weekly_outreach_capacity: input.weeklyOutreachCapacity,
    current_lead_generation_method: input.currentLeadGenerationMethod,
    score: scored.score,
    fit: scored.fit,
    score_reasons: scored.reasons,
    stage,
    source: input.source,
    utm_source: input.utmSource || null,
    utm_campaign: input.utmCampaign || null,
    region: input.region,
    country: input.country || null,
    consent_marketing: input.consentMarketing,
    consent_source: input.consentSource,
    consent_timestamp: new Date().toISOString(),
    consent_ip: input.consentIp || null,
    unsubscribe_token_hash: hashSalesUnsubscribeToken(token),
    is_suppressed: false,
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function rowFromOutboundInput(input: ValidatedOutboundProspectInput, scored: SalesLeadScore, token: string, stage: SalesPipelineStage, suppressed: boolean) {
  const outbound = {
    lead_origin: input.leadOrigin,
    source_url: input.sourceUrl,
    source_evidence: input.sourceEvidence,
    recipient_type: input.recipientType,
    lawful_basis: input.lawfulBasis,
    compliance_status: suppressed ? "blocked" : input.complianceStatus,
    email_permission_status: suppressed ? "do_not_email" : input.emailPermissionStatus,
    cold_outbound_approved_at: null,
    cold_outbound_approved_by: null,
    outbound_sequence_status: "not_started",
  };
  return {
    email: input.email,
    normalized_email: input.email,
    name: input.name || null,
    company_name: input.companyName || null,
    website: input.website || null,
    customer_journey: input.customerJourney,
    service_offered: input.serviceOffered,
    average_client_value: input.averageClientValue,
    target_industry: input.targetIndustry,
    target_countries: input.targetCountries,
    company_size: input.companySize,
    weekly_outreach_capacity: input.weeklyOutreachCapacity,
    current_lead_generation_method: input.currentLeadGenerationMethod,
    score: scored.score,
    fit: scored.fit,
    score_reasons: scored.reasons,
    stage,
    source: input.leadOrigin,
    region: input.region,
    country: input.country || null,
    consent_marketing: false,
    consent_source: "cold_outbound_compliance_gate",
    consent_timestamp: null,
    consent_ip: null,
    unsubscribe_token_hash: hashSalesUnsubscribeToken(token),
    is_suppressed: suppressed,
    metadata: {
      ...input.metadata,
      marketvibeOutbound: outbound,
    },
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = cleanString(value);
    if (text) return text;
  }
  return "";
}

function asSalesLeadOrigin(value: unknown): SalesLeadOrigin {
  const text = cleanString(value);
  return salesLeadOrigins.includes(text as SalesLeadOrigin) ? text as SalesLeadOrigin : "inbound_fit_check";
}

function asOutboundRecipientType(value: unknown): OutboundRecipientType {
  const text = cleanString(value);
  return outboundRecipientTypes.includes(text as OutboundRecipientType) ? text as OutboundRecipientType : "unknown";
}

function asSalesLawfulBasis(value: unknown): SalesLawfulBasis {
  const text = cleanString(value);
  return salesLawfulBases.includes(text as SalesLawfulBasis) ? text as SalesLawfulBasis : "not_applicable";
}

function asSalesComplianceStatus(value: unknown): SalesComplianceStatus {
  const text = cleanString(value);
  return salesComplianceStatuses.includes(text as SalesComplianceStatus) ? text as SalesComplianceStatus : "not_checked";
}

function asSalesEmailPermissionStatus(value: unknown): SalesEmailPermissionStatus {
  const text = cleanString(value);
  return salesEmailPermissionStatuses.includes(text as SalesEmailPermissionStatus) ? text as SalesEmailPermissionStatus : "not_checked";
}

function asOutboundSequenceStatus(value: unknown): OutboundSequenceStatus {
  const text = cleanString(value);
  return outboundSequenceStatuses.includes(text as OutboundSequenceStatus) ? text as OutboundSequenceStatus : "not_started";
}

function outboundMeta(row: Record<string, unknown>) {
  const metadata = toRecord(row.metadata);
  return toRecord(metadata.marketvibeOutbound);
}

function withOutboundMetadata(row: Partial<SalesLeadListRow>, patch: Record<string, unknown>) {
  const metadata = toRecord(row.metadata);
  const current = toRecord(metadata.marketvibeOutbound);
  return {
    ...metadata,
    marketvibeOutbound: {
      ...current,
      ...patch,
    },
  };
}

function hydrateSalesLeadRow(row: unknown): SalesLeadListRow {
  const record = toRecord(row);
  const meta = outboundMeta(record);
  const source = firstString(record.source);
  const leadOrigin = asSalesLeadOrigin(firstString(record.lead_origin, meta.lead_origin, source === "cold_outbound" ? "cold_outbound" : ""));
  return {
    ...(record as unknown as SalesLeadListRow),
    metadata: toRecord(record.metadata),
    lead_origin: leadOrigin,
    source_url: firstString(record.source_url, meta.source_url) || null,
    source_evidence: firstString(record.source_evidence, meta.source_evidence) || null,
    recipient_type: asOutboundRecipientType(firstString(record.recipient_type, meta.recipient_type)),
    lawful_basis: asSalesLawfulBasis(firstString(record.lawful_basis, meta.lawful_basis, record.consent_marketing ? "consent" : "")),
    compliance_status: asSalesComplianceStatus(firstString(record.compliance_status, meta.compliance_status, record.consent_marketing ? "approved" : "")),
    email_permission_status: asSalesEmailPermissionStatus(firstString(record.email_permission_status, meta.email_permission_status, record.consent_marketing ? "can_email" : "")),
    cold_outbound_approved_at: firstString(record.cold_outbound_approved_at, meta.cold_outbound_approved_at) || null,
    cold_outbound_approved_by: firstString(record.cold_outbound_approved_by, meta.cold_outbound_approved_by) || null,
    outbound_sequence_status: asOutboundSequenceStatus(firstString(record.outbound_sequence_status, meta.outbound_sequence_status)),
  };
}

function salesEmailStorageSequenceType(sequenceType: SalesEmailSequenceType): SalesEmailSequenceType {
  return sequenceType === "cold_outbound" ? "new_qualified_lead" : sequenceType;
}

function isMissingSalesTableError(error: unknown) {
  const message = String((error as { message?: unknown })?.message || error || "").toLowerCase();
  return message.includes("could not find the table")
    || message.includes("schema cache")
    || (message.includes("relation") && message.includes("does not exist"));
}

function metadataQueuedEmails(lead: Partial<SalesLeadListRow>) {
  const outbound = outboundMeta(lead as Record<string, unknown>);
  return Array.isArray(outbound.queued_emails) ? outbound.queued_emails as MetadataQueuedEmail[] : [];
}

async function queueColdOutboundMetadataEmails(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  lead: SalesLeadListRow,
  emails: QueuedEmail[],
) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const existing = metadataQueuedEmails(lead);
  if (existing.some((email) => email.status === "queued" || email.status === "sent")) {
    return { queued: 0, skipped: "already_queued" };
  }
  const queuedEmails: MetadataQueuedEmail[] = emails.map((email) => ({ ...email, status: "queued" }));
  await throwSupabaseError(await supabase.from("sales_leads").update({
    metadata: withOutboundMetadata(lead, {
      queued_emails: queuedEmails,
      outbound_sequence_status: "queued",
    }),
    updated_at: new Date().toISOString(),
  }).eq("id", lead.id).select("id").single());
  return { queued: queuedEmails.length };
}

async function throwSupabaseError<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function isSuppressed(supabase: ReturnType<typeof getSupabaseAdmin>, normalizedEmail: string) {
  if (!supabase) return true;
  const { data, error } = await supabase
    .from("sales_suppression_list")
    .select("id")
    .eq("normalized_email", normalizedEmail)
    .maybeSingle();
  if (error) {
    if (isMissingSalesTableError(error)) return false;
    throw new Error(error.message);
  }
  return Boolean(data);
}

function leadName(lead: Pick<SalesLeadListRow, "name" | "email">) {
  return lead.name?.trim() || lead.email.split("@")[0] || "there";
}

function complianceFooter(email: string, token: string, mode: "consent" | "cold" = "consent") {
  const url = unsubscribeUrl(email, token);
  if (mode === "cold") {
    const config = salesOutboundConfig();
    const address = config.postalAddress ? ` MarketVibe postal address: ${config.postalAddress}.` : "";
    return {
      html: `<p style="font-size:12px;line-height:18px;color:#64748b;margin-top:24px;">MarketVibe is contacting you at a business address because of a relevant public business signal.${escapeHtml(address)} <a href="${escapeHtml(url)}">Unsubscribe</a>.</p>`,
      text: `\n\nMarketVibe is contacting you at a business address because of a relevant public business signal.${address} Unsubscribe: ${url}`,
    };
  }
  return {
    html: `<p style="font-size:12px;line-height:18px;color:#64748b;margin-top:24px;">You are receiving this because you requested MarketVibe information or opted in to follow-up. <a href="${escapeHtml(url)}">Unsubscribe</a>.</p>`,
    text: `\n\nUnsubscribe: ${url}`,
  };
}

function trackedMarketVibeUrl(path: string, content: string) {
  const url = new URL(path, marketVibeUrl);
  url.searchParams.set("utm_source", "cold_outbound");
  url.searchParams.set("utm_medium", "email");
  url.searchParams.set("utm_campaign", "proof_pack_outbound");
  url.searchParams.set("utm_content", content);
  return url.toString();
}

function emailButton(href: string, label: string) {
  return `<p style="margin:22px 0 8px;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:12px 16px;">${escapeHtml(label)}</a></p>`;
}

const emailPreviewImageUrl = `${marketVibeUrl}/marketvibe-email-preview.png`;

function emailPreviewImage(href: string) {
  return `<a href="${escapeHtml(href)}" style="display:block;margin:0 0 22px;text-decoration:none;"><img src="${emailPreviewImageUrl}" alt="MarketVibe Proof Pack preview" width="588" style="display:block;width:100%;max-width:588px;height:auto;border:0;border-radius:10px;"></a>`;
}

function wrapEmail(body: string, footerHtml: string, previewHref = proofPackUrl) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;"><div style="max-width:640px;margin:0 auto;padding:28px 18px;"><div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:26px;"><div style="font-size:13px;font-weight:800;letter-spacing:.02em;color:#7c3aed;margin-bottom:18px;">MarketVibe</div>${emailPreviewImage(previewHref)}${body}${footerHtml}</div></div></body></html>`;
}

function makeEmail(
  sequenceType: SalesEmailSequenceType,
  subject: string,
  bodyHtml: string,
  bodyText: string,
  scheduledAt: string,
  footer: { html: string; text: string },
  previewHref?: string,
): QueuedEmail {
  return {
    sequenceType,
    subject,
    htmlContent: wrapEmail(bodyHtml, footer.html, previewHref),
    textContent: `${bodyText}${footer.text}`,
    scheduledAt,
  };
}

export function buildSalesEmailSequence(
  sequenceType: SalesEmailSequenceType,
  lead: Pick<SalesLeadListRow, "email" | "name" | "customer_journey" | "target_industry" | "service_offered" | "score" | "fit"> & Partial<Pick<SalesLeadListRow, "company_name" | "source_url" | "source_evidence" | "region">>,
  token = createSalesUnsubscribeToken(lead.email),
  now = new Date(),
): QueuedEmail[] {
  const firstName = escapeHtml(leadName(lead));
  const textName = leadName(lead);
  const industry = escapeHtml(lead.target_industry);
  const footer = complianceFooter(lead.email, token);

  if (sequenceType === "cold_outbound") {
    const coldFooter = complianceFooter(lead.email, token, "cold");
    const signal = escapeHtml(lead.source_evidence || "a public signal connected with your market");
    const signalText = lead.source_evidence || "a public signal connected with your market";
    const sourceLink = lead.source_url ? `<p style="font-size:13px;color:#475569;">Source reference: <a href="${escapeHtml(lead.source_url)}">${escapeHtml(lead.source_url)}</a></p>` : "";
    const sourceText = lead.source_url ? `\n\nSource reference: ${lead.source_url}` : "";
    const sampleIntroUrl = trackedMarketVibeUrl("/sample", "intro_redacted_example");
    const proofPackUrlCold = trackedMarketVibeUrl("/sample", "proof_pack_cta");
    const pricingUrlCold = trackedMarketVibeUrl("/pricing", "radar_pricing");

    return [
      makeEmail(
        sequenceType,
        "A source-backed opportunity example for your market",
        `<p>Hi ${firstName},</p><p>I noticed this public signal: ${signal}.</p><p>That is the sort of context MarketVibe turns into a Proof Pack: a focused shortlist with the public evidence, likely business problem, fit score, and first-message angle kept together.</p><p>I put a redacted example here so you can judge whether the format is relevant before replying.</p>${emailButton(sampleIntroUrl, "View the redacted example")}<p style="font-size:13px;color:#475569;">If the fit is not relevant, the unsubscribe link below removes this address immediately.</p>${sourceLink}<p>MarketVibe</p>`,
        `Hi ${textName},\n\nI noticed this public signal: ${signalText}.\n\nThat is the sort of context MarketVibe turns into a Proof Pack: a focused shortlist with the public evidence, likely business problem, fit score, and first-message angle kept together.\n\nI put a redacted example here so you can judge whether the format is relevant before replying.\n\nView the redacted example: ${sampleIntroUrl}${sourceText}\n\nMarketVibe`,
        now.toISOString(),
        coldFooter,
        sampleIntroUrl,
      ),
      makeEmail(
        sequenceType,
        "The reason I reached out",
        `<p>Hi ${firstName},</p><p>The useful part is not just contact data. MarketVibe keeps the reason to look, the source context, and the outreach angle together so the first message can start from something specific.</p><p>If ${industry} is a market you are targeting, the one-niche test is the lowest-commitment way to check the signal quality.</p>${emailButton(sampleIntroUrl, "Review the one-niche test")}<p>MarketVibe</p>`,
        `Hi ${textName},\n\nThe useful part is not just contact data. MarketVibe keeps the reason to look, the source context, and the outreach angle together so the first message can start from something specific.\n\nIf ${lead.target_industry} is a market you are targeting, the one-niche test is the lowest-commitment way to check the signal quality.\n\nReview the one-niche test: ${sampleIntroUrl}\n\nMarketVibe`,
        addDays(now, 3),
        coldFooter,
        sampleIntroUrl,
      ),
      makeEmail(
        sequenceType,
        "Test one niche before subscribing",
        `<p>Hi ${firstName},</p><p>MarketVibe offers a 99 euro Proof Pack for teams that want to test one niche before subscribing. It is built for consultants and agencies that need fewer, better-timed opportunities rather than a large database.</p>${emailButton(proofPackUrlCold, "View Proof Pack")}<p>MarketVibe</p>`,
        `Hi ${textName},\n\nMarketVibe offers a 99 euro Proof Pack for teams that want to test one niche before subscribing. It is built for consultants and agencies that need fewer, better-timed opportunities rather than a large database.\n\nView Proof Pack: ${proofPackUrlCold}\n\nMarketVibe`,
        addDays(now, 7),
        coldFooter,
        proofPackUrlCold,
      ),
      makeEmail(
        sequenceType,
        "Closing this here",
        `<p>Hi ${firstName},</p><p>I will close this here. I contacted you because of this signal: ${signal}.</p><p>If pipeline research becomes a priority, MarketVibe can test one market without a recurring commitment.</p>${emailButton(pricingUrlCold, "Compare Proof Pack and Radar")}<p>MarketVibe</p>`,
        `Hi ${textName},\n\nI will close this here. I contacted you because of this signal: ${signalText}.\n\nIf pipeline research becomes a priority, MarketVibe can test one market without a recurring commitment.\n\nCompare Proof Pack and Radar: ${pricingUrlCold}\n\nMarketVibe`,
        addDays(now, 12),
        coldFooter,
        pricingUrlCold,
      ),
    ];
  }

  if (sequenceType === "new_qualified_lead") {
    return [
      makeEmail(
        sequenceType,
        "Your MarketVibe fit check is ready",
        `<p>Hi ${firstName},</p><p>Your MarketVibe fit score is <strong>${lead.score}/100</strong> (${lead.fit} fit).</p><p>For ${industry}, the useful output is not a list you could Google. It is a shortlist with the reason each company is worth attention, source context where available, and practical outreach angles.</p><p><a href="${proofPackUrl}">Review the Proof Pack option</a></p><p><a href="${pricingUrl}">Compare recurring plans</a></p><p>MarketVibe</p>`,
        `Hi ${textName},\n\nYour MarketVibe fit score is ${lead.score}/100 (${lead.fit} fit).\n\nFor ${lead.target_industry}, the useful output is not a list you could Google. It is a shortlist with the reason each company is worth attention, source context where available, and practical outreach angles.\n\nProof Pack: ${proofPackUrl}\nPricing: ${pricingUrl}\n\nMarketVibe`,
        now.toISOString(),
        footer,
      ),
      makeEmail(
        sequenceType,
        "Try one market before paying monthly",
        `<p>Hi ${firstName},</p><p>If you do not want another subscription yet, Proof Pack is the smaller test: one niche, qualified opportunities, the reason they matter, and suggested first-message angles.</p><p><a href="${proofPackUrl}">Start with Proof Pack</a></p><p>MarketVibe</p>`,
        `Hi ${textName},\n\nIf you do not want another subscription yet, Proof Pack is the smaller test: one niche, qualified opportunities, the reason they matter, and suggested first-message angles.\n\nStart with Proof Pack: ${proofPackUrl}\n\nMarketVibe`,
        addDays(now, 2),
        footer,
      ),
    ];
  }

  if (sequenceType === "proof_pack_onboarding") {
    return [
      makeEmail(
        sequenceType,
        "Next step: shape your Proof Pack",
        `<p>Hi ${firstName},</p><p>Thanks for starting Proof Pack. The best output comes from a tight service offer and a specific market.</p><p>Use your onboarding link from checkout to confirm the niche, countries, and customer profile so delivery can stay focused.</p><p><a href="${marketVibeUrl}/dashboard">Open MarketVibe dashboard</a></p><p>MarketVibe</p>`,
        `Hi ${textName},\n\nThanks for starting Proof Pack. The best output comes from a tight service offer and a specific market.\n\nUse your onboarding link from checkout to confirm the niche, countries, and customer profile so delivery can stay focused.\n\nDashboard: ${marketVibeUrl}/dashboard\n\nMarketVibe`,
        now.toISOString(),
        footer,
      ),
    ];
  }

  if (sequenceType === "proof_pack_delivery_followup") {
    return [
      makeEmail(
        sequenceType,
        "How to use your Proof Pack",
        `<p>Hi ${firstName},</p><p>Your Proof Pack should help you decide which companies deserve attention first. Review the reason, source context, and suggested angle before sending outreach.</p><p>If the market is promising, Radar keeps that opportunity flow recurring.</p><p><a href="${pricingUrl}">Compare Radar</a></p><p>MarketVibe</p>`,
        `Hi ${textName},\n\nYour Proof Pack should help you decide which companies deserve attention first. Review the reason, source context, and suggested angle before sending outreach.\n\nIf the market is promising, Radar keeps that opportunity flow recurring.\n\nCompare Radar: ${pricingUrl}\n\nMarketVibe`,
        addDays(now, 2),
        footer,
      ),
    ];
  }

  if (sequenceType === "proof_pack_to_subscription") {
    return [
      makeEmail(
        sequenceType,
        "Turn the Proof Pack into a recurring flow",
        `<p>Hi ${firstName},</p><p>If the Proof Pack gave you usable companies for ${industry}, Radar is the next step: recurring scored opportunities, saved context, and export access.</p><p><a href="${pricingUrl}">Start Radar</a></p><p>MarketVibe</p>`,
        `Hi ${textName},\n\nIf the Proof Pack gave you usable companies for ${lead.target_industry}, Radar is the next step: recurring scored opportunities, saved context, and export access.\n\nStart Radar: ${pricingUrl}\n\nMarketVibe`,
        addDays(now, 5),
        footer,
      ),
      makeEmail(
        sequenceType,
        "Keep useful buyer-intent signal coming",
        `<p>Hi ${firstName},</p><p>A one-off Proof Pack validates a market. Radar is for teams that want a repeatable workflow instead of rebuilding research manually every week.</p><p><a href="${pricingUrl}">View recurring options</a></p><p>MarketVibe</p>`,
        `Hi ${textName},\n\nA one-off Proof Pack validates a market. Radar is for teams that want a repeatable workflow instead of rebuilding research manually every week.\n\nView recurring options: ${pricingUrl}\n\nMarketVibe`,
        addDays(now, 10),
        footer,
      ),
    ];
  }

  return [
    makeEmail(
      sequenceType,
      "Your MarketVibe pipeline is quiet",
      `<p>Hi ${firstName},</p><p>Your MarketVibe subscriber activity has been quiet. Open the dashboard to review saved opportunities, refresh your target market, or export the latest usable leads.</p><p><a href="${marketVibeUrl}/dashboard">Open dashboard</a></p><p>MarketVibe</p>`,
      `Hi ${textName},\n\nYour MarketVibe subscriber activity has been quiet. Open the dashboard to review saved opportunities, refresh your target market, or export the latest usable leads.\n\nDashboard: ${marketVibeUrl}/dashboard\n\nMarketVibe`,
      now.toISOString(),
      footer,
    ),
  ];
}

export async function queueSalesEmailSequence(lead: SalesLeadListRow, sequenceType: SalesEmailSequenceType) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const dbSequenceType = salesEmailStorageSequenceType(sequenceType);
  if (sequenceType === "cold_outbound") {
    const gate = assessColdOutboundLead(lead, { requireEnabled: false });
    if (!gate.allowed || await isSuppressed(supabase, lead.normalized_email)) {
      return { queued: 0, skipped: gate.allowed ? "suppressed" : gate.reason };
    }
  } else if (!lead.consent_marketing || lead.is_suppressed || await isSuppressed(supabase, lead.normalized_email)) {
    return { queued: 0, skipped: "suppressed_or_no_consent" };
  }

  const existing = await supabase
    .from("sales_email_events")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", lead.id)
    .eq("sequence_type", dbSequenceType);
  const token = createSalesUnsubscribeToken(lead.email);
  const builtEmails = buildSalesEmailSequence(sequenceType, lead, token);
  if (existing.error) {
    if (sequenceType === "cold_outbound" && isMissingSalesTableError(existing.error)) {
      return queueColdOutboundMetadataEmails(supabase, lead, builtEmails);
    }
    throw new Error(existing.error.message);
  }
  if ((existing.count || 0) > 0) return { queued: 0, skipped: "already_queued" };

  const emails = builtEmails.map((email) => ({
    lead_id: lead.id,
    email: lead.email,
    normalized_email: lead.normalized_email,
    sequence_type: dbSequenceType,
    subject: email.subject,
    html_content: email.htmlContent,
    text_content: email.textContent,
    status: "queued",
    scheduled_at: email.scheduledAt,
  }));

  if (emails.length === 0) return { queued: 0, skipped: "empty_sequence" };
  const insert = await supabase.from("sales_email_events").insert(emails);
  if (insert.error) {
    if (sequenceType === "cold_outbound" && isMissingSalesTableError(insert.error)) {
      return queueColdOutboundMetadataEmails(supabase, lead, builtEmails);
    }
    throw new Error(insert.error.message);
  }
  if (sequenceType === "cold_outbound") {
    await supabase.from("sales_leads").update({
      metadata: withOutboundMetadata(lead, { outbound_sequence_status: "queued" }),
      updated_at: new Date().toISOString(),
    }).eq("id", lead.id);
  }
  return { queued: emails.length };
}

export function assessColdOutboundLead(lead: Partial<SalesLeadListRow>, options: { requireEnabled?: boolean } = {}): ColdOutboundAssessment {
  const config = salesOutboundConfig();
  if (options.requireEnabled && !config.enabled) return { allowed: false, reason: "cold_outbound_disabled" };
  if (!lead.email || !isEmail(lead.email)) return { allowed: false, reason: "invalid_email" };
  if (!isBusinessSalesEmail(lead.email)) return { allowed: false, reason: "personal_or_free_email" };
  if (lead.is_suppressed) return { allowed: false, reason: "suppressed" };
  if (lead.region !== "UK" && lead.region !== "US") return { allowed: false, reason: "region_not_allowed" };
  if (!config.allowedRegions.includes(lead.region)) return { allowed: false, reason: "region_disabled" };
  if (lead.region === "US" && !config.postalAddress) return { allowed: false, reason: "missing_us_postal_address" };
  if (!lead.source_url || !lead.source_evidence) return { allowed: false, reason: "missing_source_evidence" };
  if (lead.compliance_status !== "approved") return { allowed: false, reason: "compliance_not_approved" };
  if (lead.email_permission_status !== "can_email") return { allowed: false, reason: "email_permission_not_approved" };
  if (lead.recipient_type !== "uk_corporate_subscriber" && lead.recipient_type !== "us_b2b_contact") return { allowed: false, reason: "recipient_type_not_approved" };
  return { allowed: true, reason: "approved" };
}

async function syncBrevoContact(input: ValidatedSalesLeadInput, scored: SalesLeadScore, stage: SalesPipelineStage) {
  const attributes = {
    FIRSTNAME: input.name,
    COMPANY: input.companyName,
    SOURCE: "sales_pipeline",
    FUNNEL_STAGE: stage,
    CUSTOMER_JOURNEY: input.customerJourney,
    LEAD_SCORE: scored.score,
    LEAD_FIT: scored.fit,
    TARGET_INDUSTRY: input.targetIndustry,
    TARGET_COUNTRIES: input.targetCountries,
    REGION: input.region,
  };

  await addOrUpdateContact(input.email, attributes);
  await addContactToMarketVibeList(input.email, attributes);
}

export async function createSalesLead(payload: unknown) {
  const validation = validateSalesLeadInput(payload);
  if (!validation.ok) {
    throw new Error(Object.values(validation.errors).join(" "));
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const input = validation.value;
  const scored = scoreSalesLead(input);
  const token = createSalesUnsubscribeToken(input.email);
  const preferredStage = initialStageForScore(scored.score);
  const suppressed = await isSuppressed(supabase, input.email);

  const existingResult = await supabase
    .from("sales_leads")
    .select("*")
    .eq("normalized_email", input.email)
    .maybeSingle();
  if (existingResult.error) throw new Error(existingResult.error.message);

  const existingLead = existingResult.data ? hydrateSalesLeadRow(existingResult.data) : null;
  const nextStage = existingLead?.stage && existingLead.stage !== "new_lead"
    ? existingLead.stage
    : preferredStage;
  const row = {
    ...rowFromInput(input, scored, token, nextStage),
    is_suppressed: suppressed,
  };

  const lead = hydrateSalesLeadRow(existingLead
    ? await throwSupabaseError(
      await supabase
        .from("sales_leads")
        .update(row)
        .eq("id", existingLead.id)
        .select("*")
        .single(),
    )
    : await throwSupabaseError(
      await supabase
        .from("sales_leads")
        .insert(row)
        .select("*")
        .single(),
    ));

  if (!existingLead || existingLead.stage !== lead.stage) {
    await supabase.from("sales_lead_status_history").insert({
      lead_id: lead.id,
      from_stage: existingLead?.stage || null,
      to_stage: lead.stage,
      changed_by: "qualification_form",
      note: `Lead scored ${scored.score}/100 (${scored.fit} fit).`,
    });
  }

  if (!suppressed) {
    await syncBrevoContact(input, scored, lead.stage).catch((error) => {
      console.warn("sales_pipeline_brevo_sync_failed", error instanceof Error ? error.message : error);
    });
  }

  if (!suppressed && scored.score >= 60) {
    await queueSalesEmailSequence(lead, "new_qualified_lead").catch((error) => {
      console.warn("sales_pipeline_sequence_queue_failed", error instanceof Error ? error.message : error);
    });
  }

  return { lead, score: scored.score, fit: scored.fit, stage: lead.stage, unsubscribeToken: token };
}

export async function createOutboundSalesProspect(payload: unknown) {
  const validation = validateOutboundProspectInput(payload);
  if (!validation.ok) {
    throw new Error(Object.values(validation.errors).join(" "));
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const input = validation.value;
  const scored = scoreOutboundProspect(input);
  const token = createSalesUnsubscribeToken(input.email);
  const suppressed = await isSuppressed(supabase, input.email);
  const stage = scored.score >= 60 && input.complianceStatus === "approved" && !suppressed ? "qualified" : "new_lead";

  const existingResult = await supabase
    .from("sales_leads")
    .select("*")
    .eq("normalized_email", input.email)
    .maybeSingle();
  if (existingResult.error) throw new Error(existingResult.error.message);

  const existingLead = existingResult.data ? hydrateSalesLeadRow(existingResult.data) : null;
  const row = rowFromOutboundInput(input, scored, token, stage, suppressed);
  const lead = hydrateSalesLeadRow(existingLead
    ? await throwSupabaseError(
      await supabase.from("sales_leads").update(row).eq("id", existingLead.id).select("*").single(),
    )
    : await throwSupabaseError(
      await supabase.from("sales_leads").insert(row).select("*").single(),
    ));

  if (!existingLead || existingLead.stage !== lead.stage) {
    await supabase.from("sales_lead_status_history").insert({
      lead_id: lead.id,
      from_stage: existingLead?.stage || null,
      to_stage: lead.stage,
      changed_by: "outbound_import",
      note: `Outbound prospect scored ${scored.score}/100 (${scored.fit} fit); compliance ${lead.compliance_status}.`,
    });
  }

  return {
    lead,
    score: scored.score,
    fit: scored.fit,
    complianceStatus: lead.compliance_status,
    emailPermissionStatus: lead.email_permission_status,
    canQueue: assessColdOutboundLead(lead, { requireEnabled: false }).allowed,
  };
}

export async function listOutboundSalesLeads(filters: { status?: string; q?: string; limit?: number }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { leads: [] as SalesLeadListRow[], error: "Supabase is not configured." };

  let query = supabase
    .from("sales_leads")
    .select("*")
    .eq("source", "cold_outbound")
    .order("updated_at", { ascending: false })
    .limit(250);

  const q = cleanString(filters.q).replace(/[%,()]/g, " ").trim();
  if (q) {
    query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%,company_name.ilike.%${q}%,target_industry.ilike.%${q}%`);
  }

  const { data, error } = await query;
  const status = salesComplianceStatuses.includes(filters.status as SalesComplianceStatus) ? filters.status as SalesComplianceStatus : "";
  const leads = (data || []).map(hydrateSalesLeadRow)
    .filter((lead) => !status || lead.compliance_status === status)
    .slice(0, Math.min(Math.max(filters.limit || 100, 1), 250));
  return { leads, error: error?.message || "" };
}

export async function approveOutboundLead(id: string, approvedBy = "admin") {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const current = hydrateSalesLeadRow(await throwSupabaseError(await supabase.from("sales_leads").select("*").eq("id", id).single()));
  const gate = assessColdOutboundLead(current, { requireEnabled: false });
  if (!gate.allowed) throw new Error(`Outbound lead cannot be approved: ${gate.reason}`);
  const now = new Date().toISOString();
  const lead = hydrateSalesLeadRow(await throwSupabaseError(await supabase.from("sales_leads").update({
    metadata: withOutboundMetadata(current, {
      cold_outbound_approved_at: now,
      cold_outbound_approved_by: approvedBy,
      outbound_sequence_status: "approved",
    }),
    stage: current.stage === "new_lead" ? "qualified" : current.stage,
    updated_at: now,
    last_activity_at: now,
  }).eq("id", id).select("*").single()));
  await supabase.from("sales_lead_status_history").insert({
    lead_id: id,
    from_stage: current.stage,
    to_stage: lead.stage,
    changed_by: approvedBy,
    note: "Cold outbound prospect approved for automated UK/US B2B sequence.",
  });
  return lead;
}

export async function queueColdOutboundForLead(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const lead = hydrateSalesLeadRow(await throwSupabaseError(await supabase.from("sales_leads").select("*").eq("id", id).single()));
  const gate = assessColdOutboundLead(lead, { requireEnabled: false });
  if (!gate.allowed) throw new Error(`Outbound lead cannot be queued: ${gate.reason}`);
  const approved = lead.cold_outbound_approved_at ? lead : await approveOutboundLead(id, "admin_queue");
  return queueSalesEmailSequence(approved, "cold_outbound");
}

export async function getOutboundSalesOverview() {
  const outbound = await listOutboundSalesLeads({ limit: 250 });
  const leads = outbound.leads;
  return {
    config: salesOutboundConfig(),
    imported: leads.length,
    approved: leads.filter((lead) => lead.compliance_status === "approved").length,
    manualReview: leads.filter((lead) => lead.compliance_status === "manual_review").length,
    blocked: leads.filter((lead) => lead.compliance_status === "blocked").length,
    queued: leads.filter((lead) => lead.outbound_sequence_status === "queued").length,
  };
}

export async function listSalesLeads(filters: { stage?: string; fit?: string; q?: string; journey?: string; limit?: number }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { leads: [] as SalesLeadListRow[], error: "Supabase is not configured." };

  let query = supabase.from("sales_leads").select("*").order("updated_at", { ascending: false }).limit(Math.min(Math.max(filters.limit || 100, 1), 250));
  if (isSalesPipelineStage(filters.stage)) query = query.eq("stage", filters.stage);
  if (salesLeadFits.includes(filters.fit as SalesLeadFit)) query = query.eq("fit", filters.fit);
  if (customerJourneys.includes(filters.journey as CustomerJourney)) query = query.eq("customer_journey", filters.journey);

  const q = cleanString(filters.q).replace(/[%,()]/g, " ").trim();
  if (q) {
    query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%,company_name.ilike.%${q}%,service_offered.ilike.%${q}%,target_industry.ilike.%${q}%`);
  }

  const { data, error } = await query;
  return { leads: (data || []).map(hydrateSalesLeadRow), error: error?.message || "" };
}

async function countSalesRows(table: string, filters: Record<string, string | boolean> = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) return null;
  return count || 0;
}

export async function getSalesPipelineOverview() {
  const stageCounts = Object.fromEntries(
    await Promise.all(salesPipelineStages.map(async (stage) => [stage, await countSalesRows("sales_leads", { stage })])),
  ) as Record<SalesPipelineStage, number | null>;

  return {
    stageCounts,
    highFit: await countSalesRows("sales_leads", { fit: "high" }),
    mediumFit: await countSalesRows("sales_leads", { fit: "medium" }),
    suppressed: await countSalesRows("sales_suppression_list"),
    queuedEmails: await countSalesRows("sales_email_events", { status: "queued" }),
  };
}

export async function getSalesLeadDetail(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const lead = hydrateSalesLeadRow(await throwSupabaseError(await supabase.from("sales_leads").select("*").eq("id", id).single()));
  const [notes, tasks, statusHistory, emailEvents] = await Promise.all([
    throwSupabaseError(await supabase.from("sales_lead_notes").select("*").eq("lead_id", id).order("created_at", { ascending: false })),
    throwSupabaseError(await supabase.from("sales_lead_tasks").select("*").eq("lead_id", id).order("created_at", { ascending: false })),
    throwSupabaseError(await supabase.from("sales_lead_status_history").select("*").eq("lead_id", id).order("created_at", { ascending: false })),
    throwSupabaseError(await supabase.from("sales_email_events").select("*").eq("lead_id", id).order("created_at", { ascending: false }).limit(25)),
  ]);
  return {
    lead,
    notes: notes as SalesLeadNoteRow[],
    tasks: tasks as SalesLeadTaskRow[],
    statusHistory: statusHistory as SalesLeadStatusHistoryRow[],
    emailEvents: emailEvents as SalesEmailEventRow[],
  };
}

export async function updateSalesLeadStage(input: { id: string; stage: SalesPipelineStage; changedBy?: string; note?: string; lostReason?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const current = hydrateSalesLeadRow(await throwSupabaseError(await supabase.from("sales_leads").select("*").eq("id", input.id).single()));
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    stage: input.stage,
    updated_at: now,
    last_activity_at: now,
  };
  if (input.stage === "contacted") update.last_contacted_at = now;
  if (input.stage === "lost") update.lost_reason = input.lostReason || input.note || "Not a fit";

  const lead = hydrateSalesLeadRow(await throwSupabaseError(
    await supabase.from("sales_leads").update(update).eq("id", input.id).select("*").single(),
  ));

  if (current.stage !== input.stage) {
    await supabase.from("sales_lead_status_history").insert({
      lead_id: input.id,
      from_stage: current.stage,
      to_stage: input.stage,
      changed_by: input.changedBy || "admin",
      note: input.note || null,
    });
  }

  if (input.stage === "proof_pack_purchased") await queueSalesEmailSequence(lead, "proof_pack_onboarding").catch(() => undefined);
  if (input.stage === "proof_pack_delivered") {
    await queueSalesEmailSequence(lead, "proof_pack_delivery_followup").catch(() => undefined);
    await queueSalesEmailSequence(lead, "proof_pack_to_subscription").catch(() => undefined);
  }

  return lead;
}

export async function updateSalesLeadFields(id: string, payload: unknown) {
  const input = toRecord(payload);
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [sourceKey, column] of [
    ["owner", "owner"],
    ["lostReason", "lost_reason"],
    ["nextTaskAt", "next_task_at"],
  ] as const) {
    if (sourceKey in input) update[column] = cleanString(input[sourceKey]) || null;
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  return hydrateSalesLeadRow(await throwSupabaseError(await supabase.from("sales_leads").update(update).eq("id", id).select("*").single()));
}

export async function createSalesLeadNote(input: { leadId: string; body: string; createdBy?: string }) {
  const body = cleanString(input.body);
  if (!body) throw new Error("Note body is required.");
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  return await throwSupabaseError(await supabase.from("sales_lead_notes").insert({
    lead_id: input.leadId,
    body,
    created_by: input.createdBy || "admin",
  }).select("*").single()) as SalesLeadNoteRow;
}

export async function createSalesLeadTask(input: { leadId: string; title: string; dueAt?: string; assignedTo?: string }) {
  const title = cleanString(input.title);
  if (!title) throw new Error("Task title is required.");
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const task = await throwSupabaseError(await supabase.from("sales_lead_tasks").insert({
    lead_id: input.leadId,
    title,
    due_at: input.dueAt || null,
    assigned_to: input.assignedTo || null,
  }).select("*").single()) as SalesLeadTaskRow;
  if (task.due_at) await supabase.from("sales_leads").update({ next_task_at: task.due_at, updated_at: new Date().toISOString() }).eq("id", input.leadId);
  return task;
}

export async function updateSalesLeadTask(input: { id: string; status: "todo" | "done" | "skipped" }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  return await throwSupabaseError(await supabase.from("sales_lead_tasks").update({
    status: input.status,
    completed_at: input.status === "done" ? new Date().toISOString() : null,
  }).eq("id", input.id).select("*").single()) as SalesLeadTaskRow;
}

function csvValue(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildSalesPipelineCsv(leads: SalesLeadListRow[]) {
  const headers = [
    "email",
    "name",
    "company_name",
    "customer_journey",
    "stage",
    "fit",
    "score",
    "service_offered",
    "average_client_value",
    "target_industry",
    "target_countries",
    "company_size",
    "weekly_outreach_capacity",
    "current_lead_generation_method",
    "region",
    "country",
    "consent_marketing",
    "is_suppressed",
    "lead_origin",
    "source_url",
    "source_evidence",
    "recipient_type",
    "lawful_basis",
    "compliance_status",
    "email_permission_status",
    "outbound_sequence_status",
    "owner",
    "next_task_at",
    "created_at",
    "updated_at",
  ] as const;
  const rows = leads.map((lead) => headers.map((header) => csvValue(lead[header])).join(","));
  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

export async function unsubscribeSalesLead(input: { email: string; token?: string; reason?: string; source?: string }) {
  const normalizedEmail = normalizeSalesEmail(input.email);
  if (!isEmail(normalizedEmail)) throw new Error("A valid email address is required.");
  if (input.token && !verifySalesUnsubscribeToken(normalizedEmail, input.token)) throw new Error("Invalid unsubscribe link.");
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const existing = await supabase.from("sales_leads").select("region").eq("normalized_email", normalizedEmail).maybeSingle();
  const region = isSalesRegion(String(existing.data?.region || "")) ? existing.data?.region as SalesRegion : "OTHER";
  await throwSupabaseError(await supabase.from("sales_suppression_list").upsert({
    normalized_email: normalizedEmail,
    reason: input.reason || "unsubscribed",
    region,
    source: input.source || "unsubscribe_link",
  }, { onConflict: "normalized_email" }));
  await supabase.from("sales_leads").update({
    is_suppressed: true,
    consent_marketing: false,
    updated_at: new Date().toISOString(),
  }).eq("normalized_email", normalizedEmail);
  await supabase.from("sales_email_events").update({
    status: "skipped",
    failure_reason: "unsubscribed",
  }).eq("normalized_email", normalizedEmail).eq("status", "queued");
  return { ok: true };
}

export async function queueInactiveSubscriberEmails(limit = 25) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const { data, error } = await supabase
    .from("sales_leads")
    .select("*")
    .eq("stage", "subscriber")
    .eq("consent_marketing", true)
    .eq("is_suppressed", false)
    .lte("last_activity_at", cutoff.toISOString())
    .limit(Math.min(Math.max(limit, 1), 100));
  if (error) throw new Error(error.message);
  let queued = 0;
  for (const lead of (data || []) as SalesLeadListRow[]) {
    const result = await queueSalesEmailSequence(lead, "inactive_subscriber").catch(() => ({ queued: 0 }));
    queued += result.queued || 0;
  }
  return { queued };
}

async function processDueMetadataColdOutboundEmails(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  options: { limit: number; coldRemaining: number; config: ReturnType<typeof salesOutboundConfig> },
) {
  const result = { processed: 0, sent: 0, skipped: 0, failed: 0 };
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!options.config.enabled) return result;

  const { data, error } = await supabase
    .from("sales_leads")
    .select("*")
    .eq("source", "cold_outbound")
    .order("updated_at", { ascending: true })
    .limit(Math.min(Math.max(options.limit * 3, 10), 100));
  if (error) {
    if (isMissingSalesTableError(error)) return { processed: 0, sent: 0, skipped: 0, failed: 1 };
    throw new Error(error.message);
  }

  let coldRemaining = options.coldRemaining;
  for (const rawLead of data || []) {
    if (result.processed >= options.limit || coldRemaining <= 0) break;
    const lead = hydrateSalesLeadRow(rawLead);
    const queuedEmails = metadataQueuedEmails(lead);
    const nextIndex = queuedEmails.findIndex((email) => email.status === "queued" && new Date(email.scheduledAt).getTime() <= Date.now());
    if (nextIndex < 0) continue;

    result.processed += 1;
    try {
      const suppressed = await isSuppressed(supabase, lead.normalized_email);
      const gate = assessColdOutboundLead(lead, { requireEnabled: true });
      if (suppressed || !gate.allowed) {
        queuedEmails[nextIndex] = {
          ...queuedEmails[nextIndex],
          status: "skipped",
          failureReason: suppressed ? "suppressed" : gate.reason,
        };
        await supabase.from("sales_leads").update({
          metadata: withOutboundMetadata(lead, {
            queued_emails: queuedEmails,
            outbound_sequence_status: "stopped",
          }),
          updated_at: new Date().toISOString(),
        }).eq("id", lead.id);
        result.skipped += 1;
        continue;
      }

      const email = queuedEmails[nextIndex];
      const providerResult = await sendTransactionalEmail({
        to: lead.email,
        subject: email.subject,
        htmlContent: email.htmlContent,
        textContent: email.textContent,
      }) as { messageId?: string };

      queuedEmails[nextIndex] = {
        ...email,
        status: "sent",
        sentAt: new Date().toISOString(),
        providerMessageId: providerResult?.messageId || "",
      };
      const stillQueued = queuedEmails.some((item) => item.status === "queued");
      await supabase.from("sales_leads").update({
        metadata: withOutboundMetadata(lead, {
          queued_emails: queuedEmails,
          outbound_sequence_status: stillQueued ? "sending" : "sent",
        }),
        stage: "contacted",
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", lead.id);

      coldRemaining -= 1;
      result.sent += 1;
    } catch (sendError) {
      queuedEmails[nextIndex] = {
        ...queuedEmails[nextIndex],
        status: "failed",
        failureReason: sendError instanceof Error ? sendError.message : "Email send failed.",
      };
      await supabase.from("sales_leads").update({
        metadata: withOutboundMetadata(lead, {
          queued_emails: queuedEmails,
          outbound_sequence_status: "paused",
        }),
        updated_at: new Date().toISOString(),
      }).eq("id", lead.id);
      result.failed += 1;
    }
  }

  return result;
}

export async function processDueSalesEmails(options: { limit?: number } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  const limit = Math.min(Math.max(options.limit || 25, 1), 100);
  const { data, error } = await supabase
    .from("sales_email_events")
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);
  const config = salesOutboundConfig();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const sentColdToday = await supabase
    .from("sales_leads")
    .select("id", { count: "exact", head: true })
    .eq("source", "cold_outbound")
    .gte("last_contacted_at", since.toISOString());
  let coldRemaining = Math.max(0, config.dailyLimit - (sentColdToday.count || 0));

  if (error) {
    if (isMissingSalesTableError(error)) {
      return processDueMetadataColdOutboundEmails(supabase, { limit, coldRemaining, config });
    }
    throw new Error(error.message);
  }

  const result = { processed: 0, sent: 0, skipped: 0, failed: 0 };

  for (const event of (data || []) as SalesEmailEventRow[]) {
    result.processed += 1;
    try {
      const suppressed = await isSuppressed(supabase, event.normalized_email);
      const leadResult = event.lead_id
        ? await supabase.from("sales_leads").select("*").eq("id", event.lead_id).maybeSingle()
        : { data: null, error: null };
      if (leadResult.error) throw new Error(leadResult.error.message);
      const lead = leadResult.data ? hydrateSalesLeadRow(leadResult.data) : null;
      const isColdOutboundEvent = event.sequence_type === "cold_outbound" || lead?.lead_origin === "cold_outbound";
      if (isColdOutboundEvent) {
        if (!config.enabled) {
          result.skipped += 1;
          continue;
        }
        if (coldRemaining <= 0) {
          result.skipped += 1;
          continue;
        }
        const gate = assessColdOutboundLead(lead || { email: event.email, normalized_email: event.normalized_email }, { requireEnabled: true });
        if (suppressed || !gate.allowed) {
          await supabase.from("sales_email_events").update({ status: "skipped", failure_reason: suppressed ? "suppressed" : gate.reason }).eq("id", event.id);
          result.skipped += 1;
          continue;
        }
      } else {
        if (suppressed || lead?.consent_marketing === false || lead?.is_suppressed === true) {
          await supabase.from("sales_email_events").update({ status: "skipped", failure_reason: "suppressed_or_no_consent" }).eq("id", event.id);
          result.skipped += 1;
          continue;
        }
      }

      const providerResult = await sendTransactionalEmail({
        to: event.email,
        subject: event.subject,
        htmlContent: event.html_content,
        textContent: event.text_content,
      }) as { messageId?: string };
      await supabase.from("sales_email_events").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: providerResult?.messageId || null,
      }).eq("id", event.id);
      if (isColdOutboundEvent) {
        coldRemaining -= 1;
        if (event.lead_id && lead) {
          await supabase.from("sales_leads").update({
            metadata: withOutboundMetadata(lead, { outbound_sequence_status: "sending" }),
            stage: "contacted",
            last_contacted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", event.lead_id);
        }
      }
      result.sent += 1;
    } catch (sendError) {
      await supabase.from("sales_email_events").update({
        status: "failed",
        failure_reason: sendError instanceof Error ? sendError.message : "Email send failed.",
      }).eq("id", event.id);
      result.failed += 1;
    }
  }

  return result;
}
