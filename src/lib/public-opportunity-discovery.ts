import {
  buildCustomerSummary,
  buildExclusivityKey,
  buildOpportunityDedupeKey,
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
import { calculateEvidenceGroundedScores, groundOpportunityInEvidence } from "@/lib/buyer-intent-evidence";
import { filterProfilesWithActiveEntitlements } from "@/lib/paid-profile-access";
import { enforcePropertyOpportunityIntegrity } from "@/lib/property-opportunity-integrity";
import type { PremiumProductCode } from "@/lib/premium-products";
import { getSupabaseAdmin } from "@/lib/supabase";

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";
const BING_NEWS_ENDPOINT = "https://www.bing.com/news/search";
const DIRECT_SIGNAL_QUERY = "(\"request for proposal\" OR RFP OR tender OR procurement OR \"invitation to bid\" OR \"looking for\" OR seeking OR \"need a\" OR \"needs a\" OR \"hiring a\" OR \"supplier wanted\" OR \"vendor wanted\" OR \"contract awarded\" OR expansion OR funding OR \"new project\" OR launch OR migration OR rebrand OR implementation)";
const DIRECT_SIGNAL_PATTERN = /\b(request(?:ing)?|request for proposal|rfp|proposal|quote|supplier|vendor|recommendation|looking for|need(?:s|ed)?|seeking|hiring (?:an?|for)|tender|procurement|invitation to bid|contract awarded|expansion|funding|new project|launch(?:ed|ing)?|migration|rebrand|implementation|planning application|permit issued|new location|major hiring)\b/i;
const STOPWORDS = new Set(["and", "the", "for", "with", "from", "that", "this", "into", "their", "your", "business", "services", "service", "company", "companies", "opportunities", "opportunity", "buyer", "buyers", "high", "value"]);

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

type Candidate = OpportunityInput & { raw_payload?: Record<string, unknown> };

type SourceResult = {
  sourceName: string;
  candidates: Candidate[];
  error?: string;
};

type Counters = {
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

function significantTerms(profile: CustomerSearchProfile) {
  const source = [profile.niche, profile.target_service, ...profile.target_industries]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 3 && !STOPWORDS.has(value));
  return Array.from(new Set(source)).slice(0, 10);
}

function specificLocation(profile: CustomerSearchProfile) {
  return profile.target_locations
    .map((value) => value.split(",")[0]?.trim() || "")
    .find((value) => value.length >= 3) || "";
}

function quote(value: string) {
  return `"${value.replace(/["()]/g, " ").replace(/\s+/g, " ").trim()}"`;
}

export function buildProfileOpportunityQuery(profile: CustomerSearchProfile) {
  const terms = significantTerms(profile);
  const context = terms.length ? `(${terms.map(quote).join(" OR ")})` : quote(profile.niche || profile.target_service || "business services");
  const location = specificLocation(profile);
  return `${DIRECT_SIGNAL_QUERY} ${context}${location ? ` ${quote(location)}` : ""}`;
}

function parseDate(value: string | undefined) {
  const text = String(value || "").trim();
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 14) {
    const parsed = new Date(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString();
}

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function xmlValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] || "");
}

function subjectFromTitle(title: string) {
  const clean = title.replace(/\s+/g, " ").trim().split(/\s[-|]\s/)[0]?.trim() || title;
  const actor = clean.match(/^(.{2,100}?)\s+(?:wins?|secures?|seeks?|plans?|submits?|launches?|awarded|acquires?|proposes?|unveils?|files?|requests?|appoints?|needs?|looks?)\b/i)?.[1]?.trim();
  return (actor || clean).slice(0, 160);
}

function publisherUrlFromRssLink(value: string) {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";
  try {
    const parsed = new URL(normalized);
    if (parsed.hostname.endsWith("bing.com")) {
      const embedded = parsed.searchParams.get("url") || parsed.searchParams.get("u");
      if (embedded) return normalizeUrl(decodeURIComponent(embedded));
    }
  } catch {
    return normalized;
  }
  return normalized;
}

function candidateFromEvidence(input: {
  title: string;
  description?: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt?: string;
  provider: string;
  raw: Record<string, unknown>;
}, profile: CustomerSearchProfile): Candidate | null {
  const title = input.title.replace(/\s+/g, " ").trim();
  const sourceUrl = normalizeUrl(input.sourceUrl);
  if (!title || !sourceUrl) return null;

  let pathText = "";
  try {
    pathText = decodeURIComponent(new URL(sourceUrl).pathname.replace(/[-_/]+/g, " "));
  } catch {
    pathText = "";
  }

  const sourceText = `${title} ${input.description || ""} ${pathText}`.replace(/\s+/g, " ").trim();
  if (!DIRECT_SIGNAL_PATTERN.test(sourceText)) return null;

  const base: OpportunityInput = {
    company_name: subjectFromTitle(title),
    company_location: null,
    company_country: null,
    company_industry: null,
    company_description: title,
    source_type: "public_buyer_intent_news",
    source_name: input.sourceName,
    source_url: sourceUrl,
    source_title: title,
    source_text: sourceText,
    source_published_at: input.publishedAt || nowIso(),
    captured_at: nowIso(),
    evidence_status: "profile_only",
    niche: null,
    target_location: null,
    is_test_data: false,
  };
  const grounding = groundOpportunityInEvidence(base, profile);
  if (!grounding.profileRelevant) return null;

  return {
    ...grounding.grounded,
    raw_payload: {
      provider: input.provider,
      search_profile_id: profile.id || null,
      customer_email: profile.customer_email,
      product_code: profile.product_code,
      evidence_grounding: {
        matched_location: grounding.matchedLocation,
        exact_phrases: grounding.exactPhrases,
        matched_tokens: grounding.matchedTokens,
      },
      raw: input.raw,
    },
  };
}

export function gdeltArticleToProfileCandidate(article: GdeltArticle, profile: CustomerSearchProfile): Candidate | null {
  return candidateFromEvidence({
    title: String(article.title || ""),
    sourceUrl: String(article.url || article.url_mobile || ""),
    sourceName: article.domain ? `GDELT DOC 2.0 · ${article.domain}` : "GDELT DOC 2.0",
    publishedAt: parseDate(article.seendate),
    provider: "gdelt_doc_2",
    raw: { article, query: buildProfileOpportunityQuery(profile) },
  }, profile);
}

async function fetchGdeltCandidates(profile: CustomerSearchProfile): Promise<SourceResult> {
  const query = buildProfileOpportunityQuery(profile);
  const url = new URL(GDELT_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("timespan", "1month");
  url.searchParams.set("maxrecords", String(Math.max(20, Math.min(profile.opportunity_quantity * 3, 75))));
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "MarketVibeOpportunityEngine/4.0 (+https://marketvibe1.com)" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`GDELT DOC 2.0 returned ${response.status}.`);
    const payload = await response.json().catch(() => null) as { articles?: GdeltArticle[] } | null;
    if (!payload) throw new Error("GDELT DOC 2.0 returned invalid JSON.");
    return {
      sourceName: "GDELT DOC 2.0",
      candidates: (payload.articles || [])
        .map((article) => gdeltArticleToProfileCandidate(article, profile))
        .filter((candidate): candidate is Candidate => Boolean(candidate)),
    };
  } catch (error) {
    return { sourceName: "GDELT DOC 2.0", candidates: [], error: error instanceof Error ? error.message : "GDELT discovery failed." };
  }
}

async function fetchRssUrl(url: string, profile: CustomerSearchProfile, sourceName: string, provider: string): Promise<SourceResult> {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "MarketVibeOpportunityEngine/4.0 (+https://marketvibe1.com)" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`${sourceName} returned ${response.status}.`);
    const xml = await response.text();
    const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    const candidates = items.slice(0, 40).map((item) => candidateFromEvidence({
      title: xmlValue(item, "title"),
      description: xmlValue(item, "description"),
      sourceUrl: publisherUrlFromRssLink(xmlValue(item, "link")),
      sourceName,
      publishedAt: parseDate(xmlValue(item, "pubDate")),
      provider,
      raw: { feed: url },
    }, profile)).filter((candidate): candidate is Candidate => Boolean(candidate));
    return { sourceName, candidates };
  } catch (error) {
    return { sourceName, candidates: [], error: error instanceof Error ? error.message : `${sourceName} failed.` };
  }
}

function configuredFeeds(profile: CustomerSearchProfile) {
  const metadata = profile.metadata || {};
  const profileFeeds = [metadata.rss_feeds, metadata.source_feeds]
    .flatMap((value) => Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [])
    .map(String);
  const globalFeeds = (process.env.OPPORTUNITY_RSS_FEEDS || "").split(",");
  return Array.from(new Set([...profileFeeds, ...globalFeeds].map((value) => normalizeUrl(value)).filter(Boolean))).slice(0, 10);
}

async function discoverFromAllPublicSources(profile: CustomerSearchProfile) {
  const query = buildProfileOpportunityQuery(profile);
  const bingUrl = new URL(BING_NEWS_ENDPOINT);
  bingUrl.searchParams.set("q", query);
  bingUrl.searchParams.set("format", "rss");

  const sourcePromises: Array<Promise<SourceResult>> = [
    fetchGdeltCandidates(profile),
    fetchRssUrl(bingUrl.toString(), profile, "Bing News RSS", "bing_news_rss"),
    ...configuredFeeds(profile).map((feed, index) => fetchRssUrl(feed, profile, `Configured RSS ${index + 1}`, "configured_rss")),
  ];
  const results = await Promise.all(sourcePromises);
  const unique = new Map<string, Candidate>();
  for (const result of results) {
    for (const candidate of result.candidates) {
      const key = buildOpportunityDedupeKey(candidate);
      if (key && !unique.has(key)) unique.set(key, candidate);
    }
  }
  return { results, candidates: Array.from(unique.values()) };
}

async function loadProfiles(supabase: SupabaseClient, profileId?: string) {
  let query = supabase.from("customer_search_profiles").select("*").eq("status", "active").order("created_at", { ascending: true }).limit(100);
  if (profileId) query = query.eq("id", profileId);
  const { data, error } = await query;
  if (error) throw error;
  const profiles = (data || []).map((row) => profileFromRow(row as Record<string, unknown>));
  return filterProfilesWithActiveEntitlements(supabase, profiles);
}

async function automationPaused(supabase: SupabaseClient) {
  const { data } = await supabase.from("opportunity_automation_settings").select("automation_paused").eq("id", "default").maybeSingle();
  return Boolean(data?.automation_paused);
}

async function createRun(supabase: SupabaseClient, trigger: DiscoveryTrigger, profileId?: string) {
  const bucket = trigger === "cron" ? new Date().toISOString().slice(0, 13) : `${nowIso()}:${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await supabase.from("opportunity_source_runs").insert({
    run_type: "customer_profile_discovery",
    trigger_source: trigger,
    idempotency_key: `customer-profile-discovery:${profileId || "all"}:${bucket}`,
    search_profile_id: profileId || null,
  }).select("id").single();
  if (error || !data) throw error || new Error("Discovery run could not be created.");
  return String(data.id);
}

async function finishRun(supabase: SupabaseClient, runId: string, status: "completed" | "failed" | "partial" | "skipped", counters: Counters, errorSummary: Record<string, unknown> = {}) {
  const { error } = await supabase.from("opportunity_source_runs").update({ status, finished_at: nowIso(), ...counters, error_summary: errorSummary }).eq("id", runId);
  if (error) throw error;
}

function insertRow(candidate: Candidate, profile: CustomerSearchProfile, scores: OpportunityScores) {
  const preliminary = qualifyOpportunity(candidate, scores, profile);
  return {
    company_name: candidate.company_name,
    company_domain: null,
    company_website: null,
    company_location: candidate.company_location || null,
    company_country: candidate.company_country || null,
    company_industry: candidate.company_industry || null,
    company_description: candidate.company_description || null,
    contact_full_name: null,
    contact_job_title: null,
    public_email: normalizeEmail(candidate.public_email),
    public_phone: normalizePhone(candidate.public_phone),
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
    evidence_score: scores.evidence_score,
    freshness_score: scores.freshness_score,
    overall_score: scores.overall_score,
    score_reasons: scores.reasons,
    intent_category: scores.intent_category,
    evidence_status: "profile_only",
    verification_status: "VALIDATING",
    review_status: "pending",
    inventory_status: "VALIDATING",
    niche: candidate.niche || null,
    target_location: candidate.target_location || null,
    dedupe_key: buildOpportunityDedupeKey(candidate),
    exclusivity_key: buildExclusivityKey(candidate, profile) || null,
    rejection_reason: preliminary.qualified ? null : preliminary.rejection_reason || "awaiting_source_verification",
    customer_summary: buildCustomerSummary(candidate, scores),
    recommended_action: recommendedAction(candidate, scores),
    is_test_data: false,
    raw_payload: { ...(candidate.raw_payload || {}), search_profile_id: profile.id, customer_email: profile.customer_email, product_code: profile.product_code },
    quality_flags: Array.from(new Set(["awaiting_source_verification", ...preliminary.quality_flags])),
    updated_at: nowIso(),
  };
}

export function isDeliverableBuyerIntentOpportunity(row: Record<string, unknown>) {
  const sourceUrl = normalizeUrl(row.source_url);
  const evidence = normalizeText(`${row.source_title || ""} ${row.source_text || ""}`);
  const intent = String(row.intent_category || "");
  return Boolean(
    sourceUrl
    && evidence
    && String(row.source_type || "") === "public_buyer_intent_news"
    && ["verified_direct_intent", "public_opportunity_signal"].includes(intent)
    && String(row.evidence_status || "") === "public_signal_verified"
    && String(row.verification_status || "") === "QUALIFIED"
    && String(row.review_status || "") === "approved"
    && row.is_test_data !== true
  );
}

export async function runCustomerProfileOpportunityDiscovery({ trigger = "admin", profileId }: { trigger?: DiscoveryTrigger; profileId?: string } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");
  const counters: Counters = { records_discovered: 0, records_rejected: 0, records_qualified: 0, records_added_to_inventory: 0, duplicate_count: 0, stale_records: 0, customer_shortages: 0, source_failures: [] };
  const runId = await createRun(supabase, trigger, profileId);
  const sourcesUsed = new Set<string>();
  try {
    if (await automationPaused(supabase)) {
      await finishRun(supabase, runId, "skipped", counters, { reason: "automation_paused" });
      return { ok: true, skipped: true, runId, ...counters };
    }

    await enforcePropertyOpportunityIntegrity();
    const profiles = await loadProfiles(supabase, profileId);
    for (const profile of profiles) {
      const discovery = await discoverFromAllPublicSources(profile);
      for (const result of discovery.results) {
        sourcesUsed.add(result.sourceName);
        if (result.error) counters.source_failures.push({
          profile_id: profile.id,
          customer_email: profile.customer_email,
          source_name: result.sourceName,
          error: result.error,
        });
      }

      counters.records_discovered += discovery.candidates.length;
      const keys = discovery.candidates.map((candidate) => buildOpportunityDedupeKey(candidate)).filter(Boolean);
      const { data: existingRows, error: existingError } = keys.length ? await supabase.from("opportunities").select("dedupe_key").in("dedupe_key", keys) : { data: [], error: null };
      if (existingError) throw existingError;
      const existing = new Set((existingRows || []).map((row) => String(row.dedupe_key)));

      for (const candidate of discovery.candidates) {
        const key = buildOpportunityDedupeKey(candidate);
        if (!key || existing.has(key)) {
          counters.duplicate_count += 1;
          continue;
        }
        const { grounding, scores } = calculateEvidenceGroundedScores(candidate, profile);
        if (!grounding.profileRelevant || !["verified_direct_intent", "public_opportunity_signal"].includes(scores.intent_category)) {
          counters.records_rejected += 1;
          continue;
        }
        const { error } = await supabase.from("opportunities").insert(insertRow(grounding.grounded as Candidate, profile, scores));
        if (error?.code === "23505") counters.duplicate_count += 1;
        else if (error) throw error;
        else {
          counters.records_qualified += 1;
          existing.add(key);
        }
      }
    }

    for (const failure of counters.source_failures) {
      await supabase.from("opportunity_source_errors").insert({
        run_id: runId,
        source_name: String(failure.source_name || "public source"),
        source_type: "public_buyer_intent_news",
        source_url: String(failure.source_name || "").includes("GDELT") ? GDELT_ENDPOINT : null,
        error_message: String(failure.error || "Public opportunity source failed."),
      });
    }
    const status = counters.source_failures.length ? "partial" : "completed";
    await finishRun(supabase, runId, status, counters, { sources_attempted: Array.from(sourcesUsed) });
    return {
      ok: true,
      skipped: false,
      runId,
      profiles_examined: profiles.length,
      sources_attempted: Array.from(sourcesUsed),
      ...counters,
    };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, { message: error instanceof Error ? error.message : "Customer-profile discovery failed." });
    throw error;
  }
}
