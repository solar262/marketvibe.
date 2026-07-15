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
  qualifyOpportunity,
  recommendedAction,
  type CustomerSearchProfile,
  type OpportunityInput,
  type OpportunityScores,
} from "@/lib/opportunity-quality";
import type { PremiumProductCode } from "@/lib/premium-products";
import { getSupabaseAdmin } from "@/lib/supabase";

export const PROPERTY_PROFILE_NICHE = "High-value property and construction opportunities";

const REVIEWABLE_STATUSES = ["DISCOVERED", "VALIDATING", "QUALIFIED", "IN_INVENTORY"];
const NON_OPPORTUNITY_SOURCE_TYPES = new Set(["public_business_website"]);
const PROPERTY_CONTEXT_PATTERN = /\b(property|real estate|construction|building|builder|contractor|developer|development|renovation|planning|permit|land|housing|residential|commercial|architecture|infrastructure)\b/i;
const OPPORTUNITY_SIGNAL_PATTERN = /\b(looking for|seeking|request(?:ing)?|request for proposal|rfp|tender|procurement|invitation to bid|bid opportunity|contract (?:award|awarded|opportunity)|planning application|planning permission|permit (?:application|approved|issued)|land for sale|site acquired|development proposal|new build|renovation project|construction project|buyer requirement|seller instruction|investment opportunity)\b/i;
const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";
const GDELT_SIGNAL_QUERY = "(\"planning application\" OR \"planning permission\" OR \"construction tender\" OR \"development proposal\" OR \"land for sale\" OR \"site acquired\" OR \"contract awarded\" OR \"invitation to bid\" OR \"buyer requirement\" OR \"seller instruction\" OR \"investment opportunity\" OR \"new build\")";
const GDELT_PROPERTY_QUERY = "(property OR construction OR building OR developer OR housing OR residential OR commercial OR renovation OR infrastructure)";

type DiscoveryTrigger = "admin" | "cron" | "test";
type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type OpportunityRow = {
  id: string;
  company_name?: string | null;
  company_industry?: string | null;
  source_type?: string | null;
  source_name?: string | null;
  source_title?: string | null;
  source_text?: string | null;
  niche?: string | null;
  inventory_status?: string | null;
};

type GdeltArticle = {
  url?: string;
  url_mobile?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
  socialimage?: string;
};

type PropertyCandidate = OpportunityInput & {
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

function isPropertyProfile(profile: CustomerSearchProfile) {
  const context = [
    profile.niche,
    profile.target_service,
    ...profile.target_industries,
  ].join(" ");
  return PROPERTY_CONTEXT_PATTERN.test(context);
}

function specificLocationTerm(profile: CustomerSearchProfile) {
  const genericCountries = /^(united states|usa|united kingdom|uk|ireland|germany|austria|france|spain|italy|canada|australia|europe)$/i;
  for (const raw of profile.target_locations) {
    const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.length >= 3 && !genericCountries.test(part)) return part;
    }
  }
  return profile.target_locations.find((value) => value.trim().length >= 3)?.trim() || "";
}

function gdeltPhrase(value: string) {
  return `"${value.replace(/["()]/g, " ").replace(/\s+/g, " ").trim()}"`;
}

export function buildGdeltPropertyQuery(profile: CustomerSearchProfile) {
  const location = specificLocationTerm(profile);
  return `${GDELT_SIGNAL_QUERY} ${GDELT_PROPERTY_QUERY}${location ? ` ${gdeltPhrase(location)}` : ""}`;
}

function parseGdeltDate(value: string | undefined) {
  const text = String(value || "").trim();
  if (!text) return nowIso();
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 14) {
    const [year, month, day, hour, minute, second] = [
      digits.slice(0, 4),
      digits.slice(4, 6),
      digits.slice(6, 8),
      digits.slice(8, 10),
      digits.slice(10, 12),
      digits.slice(12, 14),
    ];
    const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString();
}

function subjectFromTitle(title: string) {
  const clean = title.replace(/\s+/g, " ").trim();
  const publisherTrimmed = clean.split(/\s[-|]\s/)[0]?.trim() || clean;
  const actor = publisherTrimmed.match(/^(.{2,90}?)\s+(?:wins?|secures?|seeks?|plans?|submits?|launches?|awarded|acquires?|proposes?|unveils?|files?|requests?|appoints?)\b/i)?.[1]?.trim();
  if (actor && actor.length >= 2) return actor.slice(0, 160);
  return publisherTrimmed.slice(0, 160);
}

export function gdeltArticleToCandidate(article: GdeltArticle, profile: CustomerSearchProfile): PropertyCandidate | null {
  const title = String(article.title || "").replace(/\s+/g, " ").trim();
  const sourceUrl = normalizeUrl(article.url || article.url_mobile);
  if (!title || !sourceUrl) return null;

  let urlText = "";
  try {
    urlText = decodeURIComponent(new URL(sourceUrl).pathname.replace(/[-_/]+/g, " "));
  } catch {
    urlText = "";
  }
  const evidence = `${title} ${urlText}`;
  if (!PROPERTY_CONTEXT_PATTERN.test(evidence) || !OPPORTUNITY_SIGNAL_PATTERN.test(evidence)) return null;

  const targetLocation = profile.target_locations.join(", ");
  const sourceDomain = String(article.domain || domainFromUrl(sourceUrl));
  return {
    company_name: subjectFromTitle(title),
    company_domain: null,
    company_website: null,
    company_location: targetLocation || article.sourcecountry || null,
    company_country: article.sourcecountry || null,
    company_industry: profile.niche || PROPERTY_PROFILE_NICHE,
    company_description: title,
    source_type: "public_property_news",
    source_name: sourceDomain ? `GDELT DOC 2.0 · ${sourceDomain}` : "GDELT DOC 2.0",
    source_url: sourceUrl,
    source_title: title,
    source_text: title,
    source_published_at: parseGdeltDate(article.seendate),
    captured_at: nowIso(),
    evidence_status: "public_signal_verified",
    niche: profile.niche || PROPERTY_PROFILE_NICHE,
    target_location: targetLocation || article.sourcecountry || null,
    is_test_data: false,
    raw_payload: {
      provider: "gdelt_doc_2",
      query: buildGdeltPropertyQuery(profile),
      article,
    },
  };
}

async function fetchGdeltArticles(query: string, maxRecords = 50): Promise<GdeltArticle[]> {
  const url = new URL(GDELT_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("timespan", "1month");
  url.searchParams.set("maxrecords", String(Math.max(10, Math.min(maxRecords, 75))));

  const response = await fetch(url, {
    headers: { "user-agent": "MarketVibePropertyOpportunityEngine/1.0 (+https://marketvibe1.com)" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`GDELT DOC 2.0 returned ${response.status}.`);
  const payload = await response.json().catch(() => null) as { articles?: GdeltArticle[] } | null;
  return Array.isArray(payload?.articles) ? payload.articles : [];
}

async function loadPropertyProfiles(supabase: SupabaseClient, profileId?: string) {
  let query = supabase
    .from("customer_search_profiles")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(25);
  if (profileId) query = query.eq("id", profileId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || [])
    .map((row) => profileFromRow(row as Record<string, unknown>))
    .filter(isPropertyProfile);
}

async function automationPaused(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("opportunity_automation_settings")
    .select("automation_paused")
    .eq("id", "default")
    .maybeSingle();
  return Boolean(data?.automation_paused);
}

async function createRun(supabase: SupabaseClient, trigger: DiscoveryTrigger, profileId?: string) {
  const bucket = trigger === "cron" ? new Date().toISOString().slice(0, 13) : `${nowIso()}:${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await supabase
    .from("opportunity_source_runs")
    .insert({
      run_type: "property_discovery",
      trigger_source: trigger,
      idempotency_key: `property-discovery:${profileId || "all"}:${bucket}`,
      search_profile_id: profileId || null,
      niche: PROPERTY_PROFILE_NICHE,
    })
    .select("id")
    .single();
  if (error || !data) throw error || new Error("Property discovery run could not be created.");
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
    .update({
      status,
      finished_at: nowIso(),
      ...counters,
      error_summary: errorSummary,
    })
    .eq("id", runId);
  if (error) throw error;
}

function opportunityInsertRow(candidate: PropertyCandidate, profile: CustomerSearchProfile, scores: OpportunityScores, qualification: ReturnType<typeof qualifyOpportunity>) {
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
    last_verified_at: scores.evidence_status === "public_signal_verified" ? nowIso() : null,
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
    dedupe_key: buildOpportunityDedupeKey(candidate),
    exclusivity_key: buildExclusivityKey(candidate, profile) || null,
    rejection_reason: qualification.rejection_reason || null,
    customer_summary: buildCustomerSummary(candidate, scores),
    recommended_action: recommendedAction(candidate, scores),
    is_test_data: false,
    raw_payload: candidate.raw_payload || {},
    quality_flags: qualification.quality_flags,
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

async function runDedicatedPropertyDiscovery({
  trigger,
  profileId,
}: {
  trigger: DiscoveryTrigger;
  profileId?: string;
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
  const runId = await createRun(supabase, trigger, profileId);

  try {
    if (await automationPaused(supabase)) {
      await finishRun(supabase, runId, "skipped", counters, { reason: "automation_paused" });
      return { ok: true, skipped: true, runId, ...counters };
    }

    const profiles = await loadPropertyProfiles(supabase, profileId);
    const grouped = new Map<string, CustomerSearchProfile[]>();
    for (const profile of profiles) {
      const query = buildGdeltPropertyQuery(profile);
      grouped.set(query, [...(grouped.get(query) || []), profile]);
    }

    const articleResults = new Map<string, GdeltArticle[]>();
    const groupedEntries = Array.from(grouped.entries());
    for (let index = 0; index < groupedEntries.length; index += 5) {
      const chunk = groupedEntries.slice(index, index + 5);
      const results = await Promise.allSettled(chunk.map(async ([query, queryProfiles]) => ({
        query,
        articles: await fetchGdeltArticles(
          query,
          Math.max(...queryProfiles.map((profile) => profile.opportunity_quantity * 3), 30),
        ),
      })));
      for (const [resultIndex, result] of results.entries()) {
        const [query, queryProfiles] = chunk[resultIndex];
        if (result.status === "fulfilled") {
          articleResults.set(query, result.value.articles);
        } else {
          const message = result.reason instanceof Error ? result.reason.message : "GDELT property discovery failed.";
          for (const profile of queryProfiles) {
            counters.source_failures.push({
              source_name: "GDELT DOC 2.0",
              source_type: "public_property_news",
              profile_id: profile.id || null,
              query,
              error: message,
            });
          }
        }
      }
    }

    for (const profile of profiles) {
      const query = buildGdeltPropertyQuery(profile);
      const candidates = (articleResults.get(query) || [])
        .map((article) => gdeltArticleToCandidate(article, profile))
        .filter((candidate): candidate is PropertyCandidate => Boolean(candidate));
      counters.records_discovered += candidates.length;

      const existing = await existingDedupeKeys(supabase, candidates.map((candidate) => buildOpportunityDedupeKey(candidate)));
      for (const candidate of candidates) {
        const dedupeKey = buildOpportunityDedupeKey(candidate);
        if (!dedupeKey || existing.has(dedupeKey)) {
          counters.duplicate_count += 1;
          continue;
        }
        if (!isGenuinePropertyOpportunity(candidate)) {
          counters.records_rejected += 1;
          continue;
        }

        const scores = calculateOpportunityScores(candidate, profile);
        const qualification = qualifyOpportunity(candidate, scores, profile);
        if (qualification.qualified) counters.records_qualified += 1;
        else counters.records_rejected += 1;
        if (qualification.inventory_status === "IN_INVENTORY") counters.records_added_to_inventory += 1;

        const { error } = await supabase
          .from("opportunities")
          .insert(opportunityInsertRow(candidate, profile, scores, qualification));
        if (error?.code === "23505") counters.duplicate_count += 1;
        else if (error) throw error;
        else existing.add(dedupeKey);
      }
    }

    for (const failure of counters.source_failures) {
      await supabase.from("opportunity_source_errors").insert({
        run_id: runId,
        source_name: String(failure.source_name || "GDELT DOC 2.0"),
        source_type: String(failure.source_type || "public_property_news"),
        source_url: GDELT_ENDPOINT,
        error_message: String(failure.error || "Property source failed."),
      });
    }

    const status = counters.source_failures.length ? "partial" : "completed";
    await finishRun(supabase, runId, status, counters);
    return { ok: true, skipped: false, runId, profiles_examined: profiles.length, source: "GDELT DOC 2.0", ...counters };
  } catch (error) {
    await finishRun(supabase, runId, "failed", counters, {
      message: error instanceof Error ? error.message : "Dedicated property discovery failed.",
    });
    throw error;
  }
}

export function isGenuinePropertyOpportunity(row: OpportunityRow) {
  const sourceType = String(row.source_type || "");
  if (NON_OPPORTUNITY_SOURCE_TYPES.has(sourceType)) return false;

  const evidence = [
    row.company_name,
    row.company_industry,
    row.source_title,
    row.source_text,
    row.niche,
  ].filter(Boolean).join(" ");

  return PROPERTY_CONTEXT_PATTERN.test(evidence) && OPPORTUNITY_SIGNAL_PATTERN.test(evidence);
}

export async function enforcePropertyOpportunityIntegrity() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const { data, error } = await supabase
    .from("opportunities")
    .select("id,company_name,company_industry,source_type,source_name,source_title,source_text,niche,inventory_status")
    .eq("niche", PROPERTY_PROFILE_NICHE)
    .in("inventory_status", REVIEWABLE_STATUSES)
    .limit(1000);

  if (error) throw error;

  const rows = (data || []) as OpportunityRow[];
  const rejectedIds = rows.filter((row) => !isGenuinePropertyOpportunity(row)).map((row) => row.id);

  if (rejectedIds.length > 0) {
    const { error: updateError } = await supabase
      .from("opportunities")
      .update({
        inventory_status: "REJECTED",
        verification_status: "REJECTED",
        review_status: "rejected",
        rejection_reason: "not_a_verified_property_opportunity_signal",
        quality_flags: ["property_integrity_guard", "legacy_lead_engine_quarantined", "not_opportunity_signal"],
        updated_at: nowIso(),
      })
      .in("id", rejectedIds);

    if (updateError) throw updateError;
  }

  return {
    examined: rows.length,
    rejected: rejectedIds.length,
    retained: rows.length - rejectedIds.length,
  };
}

export async function runPropertyDiscoveryWithIntegrity({
  trigger = "admin",
  profileId,
}: {
  trigger?: DiscoveryTrigger;
  profileId?: string;
} = {}) {
  const before = await enforcePropertyOpportunityIntegrity();
  const discovery = await runDedicatedPropertyDiscovery({ trigger, profileId });
  const after = await enforcePropertyOpportunityIntegrity();

  return {
    ...discovery,
    trigger,
    profileId: profileId || null,
    source_policy: "dedicated_property_sources_only",
    discovery_status: discovery.skipped ? "skipped" : "completed",
    integrity: { before, after },
    message: discovery.skipped
      ? "Property discovery is paused."
      : `Dedicated property discovery completed: ${discovery.records_discovered} signals found and ${discovery.records_added_to_inventory} qualified opportunities added to inventory.`,
  };
}
