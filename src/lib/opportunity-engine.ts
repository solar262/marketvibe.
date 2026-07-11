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
  normalizeDomain,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  normalizeUrl,
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
import type { PremiumProductCode } from "@/lib/premium-products";
import type { BusinessLead, LeadSearchInput } from "@/lib/types";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type DiscoveryTrigger = "admin" | "cron" | "test";

type SourceCandidate = OpportunityInput & {
  raw_payload?: Record<string, unknown>;
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

function supabaseOrThrow() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error(formatSupabaseServerEnvError() || "Supabase privileged access is not configured for opportunity automation.");
  return supabase;
}

function nowIso() {
  return new Date().toISOString();
}

function runIdempotencyKey(name: string, trigger: DiscoveryTrigger | "cron" | "admin", scope = "all") {
  const bucket = trigger === "cron" ? new Date().toISOString().slice(0, 13) : `${new Date().toISOString()}:${Math.random().toString(36).slice(2, 8)}`;
  return `${name}:${scope}:${bucket}`;
}

function arrayFromDb(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function profileFromRow(row: Record<string, unknown>): CustomerSearchProfile {
  return {
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
  };
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

function stripXml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function xmlValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return stripXml(match?.[1] || "").replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
}

async function fetchRssCandidates(profile: CustomerSearchProfile): Promise<SourceCandidate[]> {
  const feeds = rssFeeds();
  if (feeds.length === 0) return [];
  const candidates: SourceCandidate[] = [];
  for (const feed of feeds) {
    const response = await fetch(feed, {
      headers: { "user-agent": "MarketVibeOpportunityEngine/1.0 (+https://marketvibe1.com)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`RSS feed ${feed} returned ${response.status}`);
    const xml = await response.text();
    const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    for (const item of items.slice(0, 10)) {
      const title = xmlValue(item, "title");
      const link = normalizeUrl(xmlValue(item, "link"));
      const description = xmlValue(item, "description");
      const published = xmlValue(item, "pubDate");
      const text = `${title} ${description}`;
      const haystack = normalizeText(text);
      if (!haystack.includes(normalizeText(profile.niche).split(" ")[0] || normalizeText(profile.niche))) continue;
      const companyName = title.split(/[-|:]/)[0]?.trim() || title;
      candidates.push({
        company_name: companyName.slice(0, 160),
        source_type: "public_rss_feed",
        source_name: feed,
        source_url: link || feed,
        source_title: title,
        source_text: text,
        source_published_at: published ? new Date(published).toISOString() : null,
        captured_at: nowIso(),
        niche: profile.niche,
        target_location: profile.target_locations.join(", "),
        raw_payload: { feed, title, description },
      });
    }
  }
  return candidates;
}

async function discoverCandidatesForProfile(profile: CustomerSearchProfile) {
  const candidates: SourceCandidate[] = [];
  const failures: Array<Record<string, unknown>> = [];

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

  try {
    candidates.push(...await fetchRssCandidates(profile));
  } catch (error) {
    failures.push({
      source_name: "Configured RSS feeds",
      source_type: "public_rss_feed",
      error: error instanceof Error ? error.message : "RSS discovery failed.",
    });
  }

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

async function loadProfiles(supabase: SupabaseClient, profileId?: string) {
  let query = supabase.from("customer_search_profiles").select("*").eq("status", "active").order("created_at", { ascending: true }).limit(25);
  if (profileId) query = query.eq("id", profileId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => profileFromRow(row as Record<string, unknown>));
}

async function existingDedupeKeys(supabase: SupabaseClient, keys: string[]) {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  if (unique.length === 0) return new Set<string>();
  const { data, error } = await supabase.from("opportunities").select("dedupe_key").in("dedupe_key", unique);
  if (error) throw error;
  return new Set((data || []).map((row) => String(row.dedupe_key)));
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

export async function runOpportunityDiscovery({ trigger = "admin", profileId }: { trigger?: DiscoveryTrigger; profileId?: string } = {}) {
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
      const { candidates, failures } = await discoverCandidatesForProfile(profile);
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

export async function fillCustomerShortages({ trigger = "admin", profileId, quantity }: { trigger?: DiscoveryTrigger; profileId?: string; quantity?: number } = {}) {
  const supabase = supabaseOrThrow();
  const runId = await createRun(supabase, { runType: "matching", trigger, idempotencyKey: runIdempotencyKey("matching", trigger, profileId || "all") });
  const counters: RunCounters = { records_discovered: 0, records_rejected: 0, records_qualified: 0, records_added_to_inventory: 0, duplicate_count: 0, stale_records: 0, customer_shortages: 0, source_failures: [] };
  try {
    const profiles = await loadProfiles(supabase, profileId);
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
      const candidates = opportunities.map((opportunity) => ({
        ...opportunity,
        previously_delivered_to: delivered.has(opportunity.id) ? [profile.customer_email] : [],
      }));
      const selection = selectMatchingOpportunities({ opportunities: candidates, profile, activeExclusivity: activeReservations, quantity });
      counters.customer_shortages += selection.shortage;

      for (const opportunity of selection.selected) {
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
          match_reason: { reasons: opportunity.match_reasons, scores: { fit: opportunity.fit_score, intent: opportunity.intent_score, evidence: opportunity.evidence_score, overall: opportunity.overall_score } },
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

    await finishRun(supabase, runId, "completed", counters);
    return { ok: true, runId, ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Matching failed." });
    throw error;
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
      const key = `${row.customer_email}:${row.product_code}:${row.search_profile_id || "none"}`;
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
    nextScheduledRun: "06:30 UTC matching, 07:00 UTC discovery/verification when Vercel cron is configured",
    sourcesEnabled: [
      "MarketVibe live lead engine",
      ...(rssFeeds().length ? ["Configured public RSS feeds"] : []),
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
