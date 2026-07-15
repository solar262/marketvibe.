import {
  buildCustomerSummary,
  buildExclusivityKey,
  buildOpportunityDedupeKey,
  calculateOpportunityScores,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  normalizeUrl,
  qualifyOpportunity,
  recommendedAction,
  type CustomerSearchProfile,
  type OpportunityInput,
  type OpportunityScores,
} from "@/lib/opportunity-quality";
import { enforcePropertyOpportunityIntegrity } from "@/lib/property-opportunity-integrity";
import type { PremiumProductCode } from "@/lib/premium-products";
import { synchronizeSearchProfileEntitlements } from "@/lib/search-profile-entitlements";
import { getSupabaseAdmin } from "@/lib/supabase";

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";
const GOOGLE_NEWS_RSS_ENDPOINT = "https://news.google.com/rss/search";
const DIRECT_SIGNAL_QUERY = "(\"request for proposal\" OR RFP OR tender OR procurement OR \"invitation to bid\" OR \"looking for\" OR seeking OR \"need a\" OR \"needs a\" OR \"hiring a\" OR \"supplier wanted\" OR \"vendor wanted\" OR \"contract awarded\" OR expansion OR funding OR \"new project\" OR launch OR migration OR rebrand OR implementation)";
const DIRECT_SIGNAL_PATTERN = /\b(request(?:ing)?|request for proposal|rfp|proposal|quote|supplier|vendor|recommendation|looking for|need(?:s|ed)?|seeking|hiring (?:an?|for)|tender|procurement|invitation to bid|contract awarded|expansion|funding|new project|launch(?:ed|ing)?|migration|rebrand|implementation|planning application|permit issued|new location|major hiring)\b/i;
const STOPWORDS = new Set(["and", "the", "for", "with", "from", "that", "this", "into", "their", "your", "business", "services", "service", "company", "companies", "opportunities", "opportunity", "buyer", "buyers", "high", "value"]);

type DiscoveryTrigger = "admin" | "cron" | "test";
type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type PublicArticle = {
  url?: string;
  url_mobile?: string;
  title?: string;
  description?: string;
  seendate?: string;
  published_at?: string;
  domain?: string;
  sourcecountry?: string;
  provider: string;
};

type Candidate = OpportunityInput & { raw_payload?: Record<string, unknown> };
type Counters = { records_discovered: number; records_rejected: number; records_qualified: number; records_added_to_inventory: number; duplicate_count: number; stale_records: number; customer_shortages: number; source_failures: Array<Record<string, unknown>> };

function nowIso() { return new Date().toISOString(); }
function arrayFromDb(value: unknown) { return Array.isArray(value) ? value.map(String).filter(Boolean) : []; }
function profileFromRow(row: Record<string, unknown>): CustomerSearchProfile {
  return {
    id: String(row.id || ""), customer_email: normalizeEmail(row.customer_email), product_code: String(row.product_code || "proof_pack") as PremiumProductCode,
    status: row.status === "paused" ? "paused" : "active", niche: String(row.niche || ""), target_service: String(row.target_service || ""),
    target_industries: arrayFromDb(row.target_industries), target_locations: arrayFromDb(row.target_locations), company_sizes: arrayFromDb(row.company_sizes), target_job_roles: arrayFromDb(row.target_job_roles),
    minimum_fit_score: Number(row.minimum_fit_score || 50), minimum_intent_score: Number(row.minimum_intent_score || 35), minimum_evidence_score: Number(row.minimum_evidence_score || 50), maximum_record_age_days: Number(row.maximum_record_age_days || 90),
    opportunity_quantity: Number(row.opportunity_quantity || 10), delivery_frequency: row.delivery_frequency === "daily" || row.delivery_frequency === "monthly" || row.delivery_frequency === "once" ? row.delivery_frequency : "weekly",
    exclusivity_mode: row.exclusivity_mode === "non_exclusive" || row.exclusivity_mode === "niche_exclusive" || row.exclusivity_mode === "geographic_exclusive" || row.exclusivity_mode === "time_limited_exclusive" ? row.exclusivity_mode : "customer_exclusive",
    exclusivity_period_days: Number(row.exclusivity_period_days || 14), allow_profile_only: Boolean(row.allow_profile_only), replacement_policy: row.replacement_policy === "none" || row.replacement_policy === "admin_review" || row.replacement_policy === "automatic" ? row.replacement_policy : "objective_failures",
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {},
  };
}

function significantTerms(profile: CustomerSearchProfile) {
  return Array.from(new Set([profile.niche, profile.target_service, ...profile.target_industries].join(" ").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).map((value) => value.trim()).filter((value) => value.length >= 4 && !STOPWORDS.has(value)))).slice(0, 8);
}
function specificLocation(profile: CustomerSearchProfile) { return profile.target_locations.map((value) => value.split(",")[0]?.trim() || "").find((value) => value.length >= 3) || ""; }
function quote(value: string) { return `"${value.replace(/["()]/g, " ").replace(/\s+/g, " ").trim()}"`; }
export function buildProfileOpportunityQuery(profile: CustomerSearchProfile) {
  const terms = significantTerms(profile);
  const context = terms.length ? `(${terms.map(quote).join(" OR ")})` : quote(profile.niche || profile.target_service);
  const location = specificLocation(profile);
  return `${DIRECT_SIGNAL_QUERY} ${context}${location ? ` ${quote(location)}` : ""}`;
}
function parseDate(value: string | undefined) {
  const text = String(value || "").trim(); const digits = text.replace(/\D/g, "");
  if (digits.length >= 14) { const parsed = new Date(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}Z`); if (!Number.isNaN(parsed.getTime())) return parsed.toISOString(); }
  const parsed = new Date(text); return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString();
}
function subjectFromTitle(title: string) {
  const clean = title.replace(/\s+/g, " ").trim().split(/\s[-|]\s/)[0]?.trim() || title;
  const actor = clean.match(/^(.{2,100}?)\s+(?:wins?|secures?|seeks?|plans?|submits?|launches?|awarded|acquires?|proposes?|unveils?|files?|requests?|appoints?|needs?|looks?)\b/i)?.[1]?.trim();
  return (actor || clean).slice(0, 160);
}
function articleEvidence(article: PublicArticle) {
  let pathText = ""; try { pathText = decodeURIComponent(new URL(String(article.url || article.url_mobile || "")).pathname.replace(/[-_/]+/g, " ")); } catch { pathText = ""; }
  return `${article.title || ""} ${article.description || ""} ${pathText}`.replace(/\s+/g, " ").trim();
}
function articleMatchesProfile(article: PublicArticle, profile: CustomerSearchProfile) {
  const evidence = articleEvidence(article); if (!DIRECT_SIGNAL_PATTERN.test(evidence)) return false;
  const normalized = normalizeText(evidence); const terms = significantTerms(profile);
  return terms.length === 0 || terms.some((term) => normalized.includes(normalizeText(term)));
}
export function publicArticleToProfileCandidate(article: PublicArticle, profile: CustomerSearchProfile): Candidate | null {
  const title = String(article.title || "").replace(/\s+/g, " ").trim(); const sourceUrl = normalizeUrl(article.url || article.url_mobile);
  if (!title || !sourceUrl || !articleMatchesProfile(article, profile)) return null;
  const evidence = articleEvidence(article);
  return {
    company_name: subjectFromTitle(title), company_location: article.sourcecountry || null, company_country: article.sourcecountry || null,
    company_industry: null, company_description: evidence.slice(0, 1000), source_type: "public_buyer_intent_news", source_name: article.domain ? `${article.provider} · ${article.domain}` : article.provider,
    source_url: sourceUrl, source_title: title, source_text: evidence, source_published_at: parseDate(article.seendate || article.published_at), captured_at: nowIso(), evidence_status: "profile_only",
    niche: null, target_location: null, is_test_data: false,
    raw_payload: { provider: article.provider, query: buildProfileOpportunityQuery(profile), article },
  };
}
export function gdeltArticleToProfileCandidate(article: Omit<PublicArticle, "provider">, profile: CustomerSearchProfile) { return publicArticleToProfileCandidate({ ...article, provider: "GDELT DOC 2.0" }, profile); }

async function fetchGdeltArticles(query: string, maxRecords: number): Promise<PublicArticle[]> {
  const url = new URL(GDELT_ENDPOINT); url.searchParams.set("query", query); url.searchParams.set("mode", "artlist"); url.searchParams.set("format", "json"); url.searchParams.set("sort", "datedesc"); url.searchParams.set("timespan", "1month"); url.searchParams.set("maxrecords", String(Math.max(10, Math.min(maxRecords, 75))));
  const response = await fetch(url, { headers: { "user-agent": "MarketVibeOpportunityEngine/4.0 (+https://marketvibe1.com)" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`GDELT DOC 2.0 returned ${response.status}.`);
  const payload = await response.json().catch(() => null) as { articles?: Array<Omit<PublicArticle, "provider">> } | null; if (!payload) throw new Error("GDELT DOC 2.0 returned invalid JSON.");
  return (payload.articles || []).map((article) => ({ ...article, provider: "GDELT DOC 2.0" }));
}
function stripXml(value: string) { return value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim(); }
function xmlValue(item: string, tag: string) { return stripXml(item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] || ""); }
function rssUrls(profile: CustomerSearchProfile) {
  const configured = (process.env.OPPORTUNITY_RSS_FEEDS || "").split(",").map((value) => value.trim()).filter(Boolean).slice(0, 8);
  const google = new URL(GOOGLE_NEWS_RSS_ENDPOINT); google.searchParams.set("q", buildProfileOpportunityQuery(profile)); google.searchParams.set("hl", "en"); google.searchParams.set("gl", "US"); google.searchParams.set("ceid", "US:en");
  return Array.from(new Set([google.toString(), ...configured]));
}
async function fetchRssArticles(profile: CustomerSearchProfile): Promise<PublicArticle[]> {
  const articles: PublicArticle[] = [];
  for (const feed of rssUrls(profile)) {
    const response = await fetch(feed, { headers: { "user-agent": "MarketVibeOpportunityEngine/4.0 (+https://marketvibe1.com)" }, signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`RSS source returned ${response.status}: ${feed}`);
    const xml = await response.text(); const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    for (const item of items.slice(0, 30)) {
      const title = xmlValue(item, "title"); const link = xmlValue(item, "link"); const description = xmlValue(item, "description"); const published = xmlValue(item, "pubDate");
      if (!title || !link) continue;
      articles.push({ url: link, title, description, published_at: published, domain: (() => { try { return new URL(feed).hostname; } catch { return ""; } })(), provider: feed.includes("news.google.com") ? "Google News RSS" : "Configured public RSS" });
    }
  }
  return articles;
}
async function loadProfiles(supabase: SupabaseClient, profileId?: string) { let query = supabase.from("customer_search_profiles").select("*").eq("status", "active").order("created_at", { ascending: true }).limit(50); if (profileId) query = query.eq("id", profileId); const { data, error } = await query; if (error) throw error; return (data || []).map((row) => profileFromRow(row as Record<string, unknown>)); }
async function automationPaused(supabase: SupabaseClient) { const { data } = await supabase.from("opportunity_automation_settings").select("automation_paused").eq("id", "default").maybeSingle(); return Boolean(data?.automation_paused); }
async function createRun(supabase: SupabaseClient, trigger: DiscoveryTrigger, profileId?: string) { const bucket = trigger === "cron" ? new Date().toISOString().slice(0, 13) : `${nowIso()}:${Math.random().toString(36).slice(2, 8)}`; const { data, error } = await supabase.from("opportunity_source_runs").insert({ run_type: "customer_profile_discovery", trigger_source: trigger, idempotency_key: `customer-profile-discovery:${profileId || "all"}:${bucket}`, search_profile_id: profileId || null }).select("id").single(); if (error || !data) throw error || new Error("Discovery run could not be created."); return String(data.id); }
async function finishRun(supabase: SupabaseClient, runId: string, status: "completed" | "failed" | "partial" | "skipped", counters: Counters, errorSummary: Record<string, unknown> = {}) { const { error } = await supabase.from("opportunity_source_runs").update({ status, finished_at: nowIso(), ...counters, error_summary: errorSummary }).eq("id", runId); if (error) throw error; }
function insertRow(candidate: Candidate, profile: CustomerSearchProfile, scores: OpportunityScores) {
  return {
    company_name: candidate.company_name, company_domain: null, company_website: null, company_location: candidate.company_location || null, company_country: candidate.company_country || null, company_industry: candidate.company_industry || null, company_description: candidate.company_description || null,
    contact_full_name: null, contact_job_title: null, public_email: normalizeEmail(candidate.public_email), public_phone: normalizePhone(candidate.public_phone), source_type: candidate.source_type, source_name: candidate.source_name, source_url: normalizeUrl(candidate.source_url), source_title: candidate.source_title || null, source_text: candidate.source_text,
    source_published_at: candidate.source_published_at || null, captured_at: candidate.captured_at || nowIso(), last_verified_at: null, next_verification_at: nowIso(), fit_score: scores.fit_score, intent_score: scores.intent_score, evidence_score: scores.evidence_score, freshness_score: scores.freshness_score, overall_score: scores.overall_score,
    score_reasons: scores.reasons, intent_category: scores.intent_category, evidence_status: "profile_only", verification_status: "VALIDATING", review_status: "pending", inventory_status: "VALIDATING", niche: null, target_location: null,
    dedupe_key: buildOpportunityDedupeKey(candidate), exclusivity_key: buildExclusivityKey(candidate, profile) || null, rejection_reason: null, customer_summary: buildCustomerSummary(candidate, scores), recommended_action: recommendedAction(candidate, scores), is_test_data: false,
    raw_payload: { ...(candidate.raw_payload || {}), search_profile_id: profile.id, customer_email: profile.customer_email, product_code: profile.product_code }, quality_flags: ["awaiting_source_verification"], updated_at: nowIso(),
  };
}
export function isDeliverableBuyerIntentOpportunity(row: Record<string, unknown>) {
  const sourceUrl = normalizeUrl(row.source_url); const evidence = normalizeText(`${row.source_title || ""} ${row.source_text || ""}`); const intent = String(row.intent_category || "");
  return Boolean(sourceUrl && evidence && row.last_verified_at && row.evidence_status === "public_signal_verified" && row.review_status === "approved" && ["verified_direct_intent", "public_opportunity_signal"].includes(intent) && row.is_test_data !== true);
}

export async function runCustomerProfileOpportunityDiscovery({ trigger = "admin", profileId }: { trigger?: DiscoveryTrigger; profileId?: string } = {}) {
  const supabase = getSupabaseAdmin(); if (!supabase) throw new Error("Supabase privileged access is not configured.");
  const counters: Counters = { records_discovered: 0, records_rejected: 0, records_qualified: 0, records_added_to_inventory: 0, duplicate_count: 0, stale_records: 0, customer_shortages: 0, source_failures: [] };
  const runId = await createRun(supabase, trigger, profileId);
  try {
    if (await automationPaused(supabase)) { await finishRun(supabase, runId, "skipped", counters, { reason: "automation_paused" }); return { ok: true, skipped: true, runId, ...counters }; }
    const entitlementSync = await synchronizeSearchProfileEntitlements();
    await enforcePropertyOpportunityIntegrity();
    const profiles = await loadProfiles(supabase, profileId);
    for (const profile of profiles) {
      const query = buildProfileOpportunityQuery(profile); const sourceArticles: PublicArticle[] = [];
      const results = await Promise.allSettled([fetchGdeltArticles(query, Math.max(30, profile.opportunity_quantity * 3)), fetchRssArticles(profile)]);
      for (const result of results) {
        if (result.status === "fulfilled") sourceArticles.push(...result.value);
        else counters.source_failures.push({ profile_id: profile.id, customer_email: profile.customer_email, source_name: "Public buyer-intent source", error: result.reason instanceof Error ? result.reason.message : "Public discovery failed." });
      }
      const candidates = sourceArticles.map((article) => publicArticleToProfileCandidate(article, profile)).filter((candidate): candidate is Candidate => Boolean(candidate));
      counters.records_discovered += candidates.length;
      const keys = candidates.map((candidate) => buildOpportunityDedupeKey(candidate)).filter(Boolean);
      const { data: existingRows, error: existingError } = keys.length ? await supabase.from("opportunities").select("dedupe_key").in("dedupe_key", keys) : { data: [], error: null }; if (existingError) throw existingError;
      const existing = new Set((existingRows || []).map((row) => String(row.dedupe_key)));
      for (const candidate of candidates) {
        const key = buildOpportunityDedupeKey(candidate); if (!key || existing.has(key)) { counters.duplicate_count += 1; continue; }
        const scores = calculateOpportunityScores(candidate, profile);
        const { error } = await supabase.from("opportunities").insert(insertRow(candidate, profile, scores));
        if (error?.code === "23505") counters.duplicate_count += 1; else if (error) throw error; else existing.add(key);
      }
    }
    for (const failure of counters.source_failures) await supabase.from("opportunity_source_errors").insert({ run_id: runId, source_name: String(failure.source_name || "Public buyer-intent source"), source_type: "public_buyer_intent_news", source_url: null, error_message: String(failure.error || "Public opportunity source failed.") });
    await finishRun(supabase, runId, counters.source_failures.length ? "partial" : "completed", counters);
    return { ok: true, skipped: false, runId, profiles_examined: profiles.length, sources: ["GDELT DOC 2.0", "Google News RSS", "Configured public RSS"], entitlementSync, ...counters };
  } catch (error) { await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Customer-profile discovery failed." }); throw error; }
}
