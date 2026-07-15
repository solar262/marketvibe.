import {
  buildCustomerSummary,
  buildExclusivityKey,
  buildOpportunityDedupeKey,
  calculateOpportunityScores,
  domainFromUrl,
  normalizeDomain,
  normalizeEmail,
  normalizeText,
  normalizeUrl,
  qualifyOpportunity,
  recommendedAction,
  type CustomerSearchProfile,
  type OpportunityInput,
  type OpportunityScores,
} from "@/lib/opportunity-quality";
import type { PremiumProductCode } from "@/lib/premium-products";
import { scanPublicWebsite } from "@/lib/sales-navigator-import";
import { getSupabaseAdmin } from "@/lib/supabase";

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";
const SIGNAL_QUERY = "(\"looking for\" OR seeking OR \"request for proposal\" OR RFP OR tender OR procurement OR supplier OR vendor OR quote OR \"contract awarded\" OR expansion OR \"new location\" OR funding OR implementation OR migration OR rebrand OR \"new project\")";
const DIRECT_SIGNAL_PATTERN = /\b(looking for|seeking|request(?:ing)?|request for proposal|rfp|proposal|quote|supplier|vendor|recommend(?:ation)?|need(?:s|ed)?|hiring (?:an?|for)|tender|procurement|contractor|agency|consultant|help with|outsourc(?:e|ing))\b/i;
const OPPORTUNITY_SIGNAL_PATTERN = /\b(expansion|new location|opening|funding|raised|launch(?:ed|ing)?|project|planning application|permit|contract awarded|major hiring|growth|migration|rebrand|implementation|acquisition|partnership)\b/i;
const PROFILE_STOP_WORDS = new Set([
  "and", "for", "the", "with", "from", "into", "that", "this", "your", "their", "business", "businesses",
  "service", "services", "company", "companies", "solutions", "provider", "providers", "opportunities", "opportunity",
  "high", "value", "buyer", "buyers", "ideal", "target", "market", "markets", "support", "managed",
]);

type DiscoveryTrigger = "admin" | "cron" | "test";
type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type GdeltArticle = {
  url?: string;
  url_mobile?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  sourcecountry?: string;
};

type BuyerIntentCandidate = OpportunityInput & {
  raw_payload: Record<string, unknown>;
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

function nowIso() {
  return new Date().toISOString();
}

function arrayFromDb(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function rawPayload(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
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
    metadata: rawPayload(row.metadata),
  };
}

function compactPhrase(value: string) {
  return value
    .replace(/[()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8)
    .join(" ");
}

function phrase(value: string) {
  return `"${compactPhrase(value)}"`;
}

function profilePhrases(profile: CustomerSearchProfile) {
  return Array.from(new Set([
    profile.niche,
    profile.target_service,
    ...profile.target_industries,
  ].map(compactPhrase).filter((value) => value.length >= 3))).slice(0, 5);
}

function profileTokens(profile: CustomerSearchProfile) {
  return Array.from(new Set(profilePhrases(profile)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !PROFILE_STOP_WORDS.has(token))));
}

function locationPhrase(profile: CustomerSearchProfile) {
  const generic = /^(worldwide|global|remote|europe|united states|usa|united kingdom|uk|canada|australia)$/i;
  return profile.target_locations
    .map(compactPhrase)
    .find((value) => value.length >= 3 && !generic.test(value)) || "";
}

export function buildBuyerIntentQuery(profile: CustomerSearchProfile, broad = false) {
  const terms = profilePhrases(profile);
  const termGroup = terms.length ? `(${terms.map(phrase).join(" OR ")})` : phrase(profile.niche || profile.target_service || "business services");
  const location = broad ? "" : locationPhrase(profile);
  return `${SIGNAL_QUERY} ${termGroup}${location ? ` ${phrase(location)}` : ""}`;
}

function evidenceMatchesProfile(text: string, profile: CustomerSearchProfile) {
  const normalized = normalizeText(text);
  const tokens = profileTokens(profile);
  return tokens.length > 0 && tokens.some((token) => normalized.includes(token));
}

function hasBuyerIntentSignal(text: string) {
  return DIRECT_SIGNAL_PATTERN.test(text) || OPPORTUNITY_SIGNAL_PATTERN.test(text);
}

function parseGdeltDate(value: string | undefined) {
  const text = String(value || "").trim();
  if (!text) return nowIso();
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 14) {
    const parsed = new Date(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString();
}

function subjectFromTitle(title: string) {
  const clean = title.replace(/\s+/g, " ").trim();
  const publisherTrimmed = clean.split(/\s[-|]\s/)[0]?.trim() || clean;
  const actor = publisherTrimmed.match(/^(.{2,90}?)\s+(?:wins?|secures?|seeks?|plans?|submits?|launches?|awarded|acquires?|proposes?|unveils?|files?|requests?|appoints?|raises?|expands?|hires?)\b/i)?.[1]?.trim();
  return (actor || publisherTrimmed).slice(0, 160);
}

function matchedProfileLocation(text: string, profile: CustomerSearchProfile) {
  const normalized = normalizeText(text);
  return profile.target_locations.find((location) => {
    const value = normalizeText(location);
    return value.length >= 3 && normalized.includes(value);
  }) || "";
}

export function buyerIntentArticleToCandidate(
  article: GdeltArticle,
  profile: CustomerSearchProfile,
  capturedAt = nowIso(),
): BuyerIntentCandidate | null {
  const title = String(article.title || "").replace(/\s+/g, " ").trim();
  const sourceUrl = normalizeUrl(article.url || article.url_mobile);
  if (!title || !sourceUrl) return null;

  let pathText = "";
  try {
    pathText = decodeURIComponent(new URL(sourceUrl).pathname.replace(/[-_/]+/g, " "));
  } catch {
    pathText = "";
  }
  const evidence = `${title} ${pathText}`;
  if (!hasBuyerIntentSignal(evidence) || !evidenceMatchesProfile(evidence, profile)) return null;

  const location = matchedProfileLocation(evidence, profile) || String(article.sourcecountry || "");
  const sourceDomain = String(article.domain || domainFromUrl(sourceUrl));
  return {
    company_name: subjectFromTitle(title),
    company_domain: null,
    company_website: null,
    company_location: location || null,
    company_country: article.sourcecountry || null,
    company_industry: profile.niche,
    company_description: title,
    source_type: "public_buyer_intent_news",
    source_name: sourceDomain ? `GDELT DOC 2.0 · ${sourceDomain}` : "GDELT DOC 2.0",
    source_url: sourceUrl,
    source_title: title,
    source_text: title,
    source_published_at: parseGdeltDate(article.seendate),
    captured_at: capturedAt,
    evidence_status: "profile_only",
    niche: profile.niche,
    target_location: location || article.sourcecountry || null,
    customer_email: profile.customer_email,
    product_code: profile.product_code,
    is_test_data: false,
    raw_payload: {
      provider: "gdelt_doc_2",
      search_profile_id: profile.id || null,
      customer_email: profile.customer_email,
      product_code: profile.product_code,
      query: buildBuyerIntentQuery(profile),
      article,
      verification_attempts: 0,
    },
  };
}

async function fetchGdeltArticles(query: string, maxRecords: number): Promise<GdeltArticle[]> {
  const url = new URL(GDELT_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("timespan", "1month");
  url.searchParams.set("maxrecords", String(Math.max(10, Math.min(maxRecords, 75))));

  const response = await fetch(url, {
    headers: { "user-agent": "MarketVibeBuyerIntentEngine/1.0 (+https://marketvibe1.com)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`GDELT DOC 2.0 returned ${response.status}.`);
  const payload = await response.json().catch(() => null) as { articles?: GdeltArticle[] } | null;
  if (!payload) throw new Error("GDELT DOC 2.0 returned an invalid JSON response.");
  return Array.isArray(payload.articles) ? payload.articles : [];
}

async function loadActiveProfiles(supabase: SupabaseClient, profileId?: string) {
  let query = supabase
    .from("customer_search_profiles")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(50);
  if (profileId) query = query.eq("id", profileId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => profileFromRow(row as Record<string, unknown>));
}

async function automationPaused(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("opportunity_automation_settings")
    .select("automation_paused")
    .eq("id", "default")
    .maybeSingle();
  return Boolean(data?.automation_paused);
}

async function createRun(supabase: SupabaseClient, runType: string, trigger: DiscoveryTrigger, profileId?: string) {
  const bucket = trigger === "cron" ? new Date().toISOString().slice(0, 13) : `${nowIso()}:${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await supabase
    .from("opportunity_source_runs")
    .insert({
      run_type: runType,
      trigger_source: trigger,
      idempotency_key: `${runType}:${profileId || "all"}:${bucket}`,
      search_profile_id: profileId || null,
    })
    .select("id")
    .single();
  if (error || !data) throw error || new Error(`${runType} run could not be created.`);
  return String(data.id);
}

async function finishRun(
  supabase: SupabaseClient,
  runId: string,
  status: "completed" | "failed" | "partial" | "skipped",
  counters: RunCounters,
  errorSummary: Record<string, unknown> = {},
) {
  const { error } = await supabase
    .from("opportunity_source_runs")
    .update({ status, finished_at: nowIso(), ...counters, error_summary: errorSummary })
    .eq("id", runId);
  if (error) throw error;
}

function initialOpportunityRow(candidate: BuyerIntentCandidate, profile: CustomerSearchProfile) {
  const scores = calculateOpportunityScores(candidate, profile);
  return {
    company_name: candidate.company_name,
    company_domain: null,
    company_website: null,
    company_location: candidate.company_location || null,
    company_country: candidate.company_country || null,
    company_industry: candidate.company_industry || profile.niche,
    company_description: candidate.company_description || null,
    source_type: candidate.source_type,
    source_name: candidate.source_name,
    source_url: normalizeUrl(candidate.source_url),
    source_title: candidate.source_title || null,
    source_text: candidate.source_text,
    source_published_at: candidate.source_published_at || null,
    captured_at: candidate.captured_at || nowIso(),
    last_verified_at: null,
    next_verification_at: nowIso(),
    fit_score: scores.fit_score,
    intent_score: scores.intent_score,
    evidence_score: Math.min(scores.evidence_score, 45),
    freshness_score: scores.freshness_score,
    overall_score: scores.overall_score,
    score_reasons: scores.reasons,
    intent_category: scores.intent_category,
    evidence_status: "profile_only",
    verification_status: "VALIDATING",
    review_status: "pending",
    inventory_status: "VALIDATING",
    niche: profile.niche,
    target_location: candidate.target_location || null,
    customer_email: profile.customer_email,
    product_code: profile.product_code,
    dedupe_key: buildOpportunityDedupeKey(candidate),
    exclusivity_key: buildExclusivityKey(candidate, profile) || null,
    rejection_reason: null,
    customer_summary: buildCustomerSummary(candidate, scores),
    recommended_action: recommendedAction(candidate, scores),
    is_test_data: false,
    raw_payload: candidate.raw_payload,
    quality_flags: ["pending_source_verification"],
    updated_at: nowIso(),
  };
}

async function existingDedupeKeys(supabase: SupabaseClient, keys: string[]) {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  if (unique.length === 0) return new Set<string>();
  const { data, error } = await supabase.from("opportunities").select("dedupe_key").in("dedupe_key", unique);
  if (error) throw error;
  return new Set((data || []).map((row) => String(row.dedupe_key)));
}

async function discoverForProfile(profile: CustomerSearchProfile) {
  const primaryQuery = buildBuyerIntentQuery(profile, false);
  let articles = await fetchGdeltArticles(primaryQuery, Math.max(30, profile.opportunity_quantity * 2));
  let candidates = articles
    .map((article) => buyerIntentArticleToCandidate(article, profile))
    .filter((candidate): candidate is BuyerIntentCandidate => Boolean(candidate));

  if (candidates.length < Math.min(3, profile.opportunity_quantity)) {
    const broadQuery = buildBuyerIntentQuery(profile, true);
    if (broadQuery !== primaryQuery) {
      const broadArticles = await fetchGdeltArticles(broadQuery, Math.max(30, profile.opportunity_quantity * 2));
      articles = [...articles, ...broadArticles];
      const seen = new Set<string>();
      candidates = articles
        .map((article) => buyerIntentArticleToCandidate(article, profile))
        .filter((candidate): candidate is BuyerIntentCandidate => {
          if (!candidate) return false;
          const key = buildOpportunityDedupeKey(candidate);
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    }
  }

  return candidates.slice(0, Math.min(50, Math.max(10, profile.opportunity_quantity * 2)));
}

export async function runBuyerIntentDiscovery({
  trigger = "admin",
  profileId,
}: {
  trigger?: DiscoveryTrigger;
  profileId?: string;
} = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");
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
  const runId = await createRun(supabase, "buyer_intent_discovery", trigger, profileId);

  try {
    if (await automationPaused(supabase)) {
      await finishRun(supabase, runId, "skipped", counters, { reason: "automation_paused" });
      return { ok: true, skipped: true, runId, profiles_examined: 0, ...counters };
    }

    const profiles = await loadActiveProfiles(supabase, profileId);
    for (let index = 0; index < profiles.length; index += 5) {
      const chunk = profiles.slice(index, index + 5);
      const results = await Promise.allSettled(chunk.map(async (profile) => ({ profile, candidates: await discoverForProfile(profile) })));
      for (const result of results) {
        if (result.status === "rejected") {
          counters.source_failures.push({
            source_name: "GDELT DOC 2.0",
            source_type: "public_buyer_intent_news",
            error: result.reason instanceof Error ? result.reason.message : "Buyer-intent discovery failed.",
          });
          continue;
        }

        const { profile, candidates } = result.value;
        counters.records_discovered += candidates.length;
        const existing = await existingDedupeKeys(supabase, candidates.map((candidate) => buildOpportunityDedupeKey(candidate)));
        for (const candidate of candidates) {
          const dedupeKey = buildOpportunityDedupeKey(candidate);
          if (!dedupeKey || existing.has(dedupeKey)) {
            counters.duplicate_count += 1;
            continue;
          }
          const { error } = await supabase.from("opportunities").insert(initialOpportunityRow(candidate, profile));
          if (error?.code === "23505") counters.duplicate_count += 1;
          else if (error) throw error;
          else {
            existing.add(dedupeKey);
            counters.records_added_to_inventory += 1;
          }
        }
      }
    }

    for (const failure of counters.source_failures) {
      await supabase.from("opportunity_source_errors").insert({
        run_id: runId,
        source_name: String(failure.source_name || "GDELT DOC 2.0"),
        source_type: String(failure.source_type || "public_buyer_intent_news"),
        source_url: GDELT_ENDPOINT,
        error_message: String(failure.error || "Buyer-intent discovery failed."),
      });
    }

    await finishRun(supabase, runId, counters.source_failures.length ? "partial" : "completed", counters);
    return { ok: true, skipped: false, runId, profiles_examined: profiles.length, source: "GDELT DOC 2.0", ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Buyer-intent discovery failed." });
    throw error;
  }
}

function profileForOpportunity(row: Record<string, unknown>, profiles: CustomerSearchProfile[]) {
  const payload = rawPayload(row.raw_payload);
  const profileId = String(payload.search_profile_id || "");
  if (profileId) {
    const byId = profiles.find((profile) => profile.id === profileId);
    if (byId) return byId;
  }
  const customerEmail = normalizeEmail(row.customer_email || payload.customer_email);
  const productCode = String(row.product_code || payload.product_code || "");
  const niche = normalizeText(row.niche);
  return profiles.find((profile) =>
    (!customerEmail || profile.customer_email === customerEmail)
    && (!productCode || profile.product_code === productCode)
    && (!niche || normalizeText(profile.niche) === niche))
    || profiles.find((profile) => niche && normalizeText(profile.niche) === niche)
    || null;
}

function verifiedOpportunityRow(
  row: Record<string, unknown>,
  profile: CustomerSearchProfile,
  input: OpportunityInput,
  scores: OpportunityScores,
  qualified: ReturnType<typeof qualifyOpportunity>,
  sourceText: string,
  finalUrl: string,
  pageTitle: string,
  location: string,
) {
  const currentStatus = String(row.inventory_status || "VALIDATING");
  const preserveStatus = ["ASSIGNED", "PUBLISHED", "DELIVERED"].includes(currentStatus) && qualified.qualified;
  return {
    source_url: finalUrl,
    source_title: pageTitle || input.source_title || null,
    source_text: sourceText,
    company_location: location || input.company_location || null,
    target_location: location || input.target_location || null,
    last_verified_at: nowIso(),
    next_verification_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    fit_score: scores.fit_score,
    intent_score: scores.intent_score,
    evidence_score: scores.evidence_score,
    freshness_score: scores.freshness_score,
    overall_score: scores.overall_score,
    score_reasons: scores.reasons,
    intent_category: scores.intent_category,
    evidence_status: qualified.qualified ? "public_signal_verified" : scores.evidence_status,
    verification_status: qualified.verification_status,
    review_status: qualified.review_status,
    inventory_status: preserveStatus ? currentStatus : qualified.inventory_status,
    rejection_reason: qualified.rejection_reason || null,
    quality_flags: qualified.quality_flags,
    customer_summary: buildCustomerSummary({ ...input, source_url: finalUrl, source_title: pageTitle, source_text: sourceText, company_location: location || input.company_location }, scores),
    recommended_action: recommendedAction({ ...input, source_url: finalUrl, source_title: pageTitle, source_text: sourceText }, scores),
    raw_payload: { ...rawPayload(row.raw_payload), verification_attempts: 0, last_verified_source_url: finalUrl },
    updated_at: nowIso(),
  };
}

async function verifyRow(supabase: SupabaseClient, row: Record<string, unknown>, profile: CustomerSearchProfile | null) {
  const sourceUrl = normalizeUrl(row.source_url);
  const payload = rawPayload(row.raw_payload);
  const attempts = Number(payload.verification_attempts || 0);
  if (!profile || !sourceUrl) {
    await supabase.from("opportunities").update({
      inventory_status: "REJECTED",
      verification_status: "REJECTED",
      review_status: "rejected",
      rejection_reason: !profile ? "customer_search_profile_missing" : "source_url_missing",
      quality_flags: [!profile ? "customer_search_profile_missing" : "source_url_missing"],
      updated_at: nowIso(),
    }).eq("id", row.id);
    return { qualified: false, retry: false, rejected: true };
  }

  try {
    const scan = await scanPublicWebsite(sourceUrl);
    const sourceText = [scan.pageTitle, scan.metaDescription, scan.textEvidence, String(row.source_text || "")]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
    const profileMatch = evidenceMatchesProfile(sourceText, profile);
    const signalMatch = hasBuyerIntentSignal(sourceText);
    const location = matchedProfileLocation(sourceText, profile) || String(row.company_location || row.company_country || "");
    const input: OpportunityInput = {
      id: String(row.id || ""),
      company_name: String(row.company_name || scan.pageTitle || ""),
      company_domain: row.company_domain ? String(row.company_domain) : null,
      company_website: row.company_website ? String(row.company_website) : null,
      company_location: location || null,
      company_country: row.company_country ? String(row.company_country) : null,
      company_industry: String(row.company_industry || profile.niche),
      company_description: String(row.company_description || scan.metaDescription || scan.pageTitle || ""),
      contact_full_name: row.contact_full_name ? String(row.contact_full_name) : null,
      contact_job_title: row.contact_job_title ? String(row.contact_job_title) : null,
      source_type: String(row.source_type || "public_buyer_intent_news"),
      source_name: String(row.source_name || domainFromUrl(scan.finalUrl)),
      source_url: scan.finalUrl,
      source_title: scan.pageTitle || String(row.source_title || ""),
      source_text: sourceText,
      source_published_at: row.source_published_at ? String(row.source_published_at) : null,
      captured_at: row.captured_at ? String(row.captured_at) : nowIso(),
      last_verified_at: nowIso(),
      evidence_status: "public_signal_verified",
      niche: profile.niche,
      target_location: location || null,
      customer_email: profile.customer_email,
      product_code: profile.product_code,
      is_test_data: false,
    };
    const scores = calculateOpportunityScores(input, profile);
    let qualification = qualifyOpportunity(input, scores, profile);
    if (!profileMatch || !signalMatch) {
      const flags = [
        ...qualification.quality_flags,
        !profileMatch ? "profile_relevance_not_verified" : "",
        !signalMatch ? "buyer_intent_signal_not_verified" : "",
      ].filter(Boolean);
      qualification = {
        qualified: false,
        inventory_status: "REJECTED",
        review_status: "rejected",
        verification_status: "REJECTED",
        rejection_reason: flags.join(", "),
        quality_flags: flags,
      };
    }

    const update = verifiedOpportunityRow(row, profile, input, scores, qualification, sourceText, scan.finalUrl, scan.pageTitle, location);
    await supabase.from("opportunities").update(update).eq("id", row.id);
    await supabase.from("opportunity_verification_events").insert({
      opportunity_id: row.id,
      verification_status: qualification.verification_status,
      website_status: "not_applicable",
      source_status: "resolved",
      evidence_found: profileMatch && signalMatch,
      notes: profileMatch && signalMatch ? "Source page verified against the customer profile and buyer-intent rules." : "Source page did not verify both profile relevance and buyer intent.",
      raw_result: { scores, qualification, profile_id: profile.id || null },
    });
    return { qualified: qualification.qualified, retry: false, rejected: !qualification.qualified };
  } catch (error) {
    const nextAttempts = attempts + 1;
    const retry = nextAttempts < 3;
    await supabase.from("opportunities").update({
      inventory_status: retry ? "VALIDATING" : "REJECTED",
      verification_status: retry ? "VALIDATING" : "REJECTED",
      review_status: retry ? "pending" : "rejected",
      next_verification_at: retry ? new Date(Date.now() + 6 * 3_600_000).toISOString() : null,
      rejection_reason: retry ? null : "source_verification_failed_three_times",
      quality_flags: retry ? ["source_verification_retry"] : ["source_verification_failed"],
      raw_payload: { ...payload, verification_attempts: nextAttempts, last_verification_error: error instanceof Error ? error.message : "Source verification failed." },
      updated_at: nowIso(),
    }).eq("id", row.id);
    return { qualified: false, retry, rejected: !retry, error: error instanceof Error ? error.message : "Source verification failed." };
  }
}

async function verificationRows(supabase: SupabaseClient, limit: number, refresh: boolean) {
  let query = supabase
    .from("opportunities")
    .select("*")
    .in("source_type", ["public_buyer_intent_news", "public_property_news", "public_rss_feed"])
    .eq("is_test_data", false)
    .lte("next_verification_at", nowIso())
    .limit(limit);
  query = refresh
    ? query.in("inventory_status", ["IN_INVENTORY", "ASSIGNED", "PUBLISHED", "DELIVERED"])
    : query.in("inventory_status", ["DISCOVERED", "VALIDATING"]);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Array<Record<string, unknown>>;
}

async function runVerificationMode({
  trigger,
  limit,
  refresh,
}: {
  trigger: DiscoveryTrigger;
  limit: number;
  refresh: boolean;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");
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
  const runId = await createRun(supabase, refresh ? "buyer_intent_refresh" : "buyer_intent_verification", trigger);

  try {
    const [profiles, rows] = await Promise.all([
      loadActiveProfiles(supabase),
      verificationRows(supabase, limit, refresh),
    ]);
    for (let index = 0; index < rows.length; index += 5) {
      const chunk = rows.slice(index, index + 5);
      const results = await Promise.all(chunk.map(async (row) => ({ row, result: await verifyRow(supabase, row, profileForOpportunity(row, profiles)) })));
      for (const { row, result } of results) {
        if (result.qualified) {
          counters.records_qualified += 1;
          if (!refresh) counters.records_added_to_inventory += 1;
        } else if (result.retry) {
          counters.source_failures.push({ opportunity_id: row.id, error: result.error || "Source verification will retry." });
        } else {
          counters.records_rejected += 1;
          if (refresh) counters.stale_records += 1;
        }
      }
    }
    await finishRun(supabase, runId, counters.source_failures.length ? "partial" : "completed", counters);
    return { ok: true, runId, examined: rows.length, ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Buyer-intent verification failed." });
    throw error;
  }
}

export async function runBuyerIntentVerification({
  trigger = "admin",
  limit = 50,
}: {
  trigger?: DiscoveryTrigger;
  limit?: number;
} = {}) {
  return runVerificationMode({ trigger, limit: Math.max(1, Math.min(limit, 100)), refresh: false });
}

export async function refreshBuyerIntentOpportunities({
  trigger = "admin",
  limit = 50,
}: {
  trigger?: DiscoveryTrigger;
  limit?: number;
} = {}) {
  return runVerificationMode({ trigger, limit: Math.max(1, Math.min(limit, 100)), refresh: true });
}
