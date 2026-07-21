import type { getSupabaseAdmin } from "@/lib/supabase";
import {
  buildCustomerSummary,
  buildOpportunityDedupeKey,
  calculateOpportunityScores,
  domainFromUrl,
  normalizeDomain,
  normalizeEmail,
  normalizePhone,
  normalizeUrl,
  qualifyOpportunity,
  recommendedAction,
  type CustomerSearchProfile,
  type OpportunityInput,
} from "@/lib/opportunity-quality";
import {
  runOpportunityVerification,
  syncApprovedNavigatorProspectsToOpportunities,
} from "@/lib/opportunity-engine";
import { runPropertyDiscoveryWithIntegrity } from "@/lib/property-opportunity-integrity";
import { assertSafePublicUrl } from "@/lib/sales-navigator-import";
import { enrichOpportunityBacklog } from "@/lib/operations-enrichment";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

export type LicensedOpportunityInput = Partial<OpportunityInput> & {
  company_name: string;
  source_url: string;
  source_text: string;
  source_name?: string;
  source_type?: string;
  license_basis?: string;
};

const PROVIDERS = [
  {
    provider_identifier: "public_rss_opportunities",
    provider_name: "Configured public opportunity RSS feeds",
    provider_type: "opportunity_discovery",
    enabled: Boolean(process.env.OPPORTUNITY_RSS_FEEDS?.trim()),
    credential_state: "not_required",
    health_message: process.env.OPPORTUNITY_RSS_FEEDS?.trim() ? "Public RSS opportunity feeds are configured." : "No public RSS feeds are configured.",
    settings: { license_basis: "public_business_source", automated: true },
  },
  {
    provider_identifier: "public_company_websites",
    provider_name: "Public company website verification",
    provider_type: "website_verification",
    enabled: true,
    credential_state: "not_required",
    health_message: "Public website verification and contact-page discovery are enabled.",
    settings: { license_basis: "public_business_source", automated: true },
  },
  {
    provider_identifier: "sales_navigator_owner_import",
    provider_name: "Owner-initiated Sales Navigator visible-card import",
    provider_type: "buyer_stock",
    enabled: true,
    credential_state: "not_required",
    health_message: "Owner-initiated visible-card imports are accepted; unattended LinkedIn automation is disabled.",
    settings: { license_basis: "owner_supplied_visible_export", automated_access: false, owner_initiated_only: true },
  },
  {
    provider_identifier: "licensed_json_opportunities",
    provider_name: "Licensed JSON opportunity feeds",
    provider_type: "opportunity_discovery",
    enabled: Boolean(process.env.OPPORTUNITY_JSON_FEEDS?.trim() && process.env.OPPORTUNITY_JSON_FEED_LICENSE_BASIS?.trim()),
    credential_state: process.env.OPPORTUNITY_JSON_FEED_TOKEN ? "configured" : "not_required",
    health_message: process.env.OPPORTUNITY_JSON_FEEDS?.trim() && process.env.OPPORTUNITY_JSON_FEED_LICENSE_BASIS?.trim()
      ? "Licensed JSON opportunity feeds are configured."
      : "A feed URL and documented license basis are required before automated JSON ingestion.",
    settings: { license_basis: process.env.OPPORTUNITY_JSON_FEED_LICENSE_BASIS || "not_configured", automated: true },
  },
  {
    provider_identifier: "licensed_opportunity_webhook",
    provider_name: "Licensed opportunity webhook",
    provider_type: "opportunity_discovery",
    enabled: Boolean(process.env.OPPORTUNITY_SOURCE_WEBHOOK_SECRET?.trim()),
    credential_state: process.env.OPPORTUNITY_SOURCE_WEBHOOK_SECRET ? "configured" : "not_configured",
    health_message: process.env.OPPORTUNITY_SOURCE_WEBHOOK_SECRET
      ? "Authenticated licensed-source webhook ingestion is enabled."
      : "Configure a source webhook secret before accepting automated partner data.",
    settings: { license_basis: "supplied_per_batch", automated: true },
  },
  {
    provider_identifier: "contact_enrichment_waterfall",
    provider_name: "Public and licensed contact enrichment waterfall",
    provider_type: "decision_maker_resolution",
    enabled: true,
    credential_state: process.env.ENRICHMENT_PROVIDER_URL ? "configured" : "not_required",
    health_message: process.env.ENRICHMENT_PROVIDER_URL
      ? "Public website discovery and a licensed enrichment provider are enabled."
      : "Public website discovery is enabled; no optional licensed enrichment provider is configured.",
    settings: { public_website: true, mx_verification: true, licensed_provider: Boolean(process.env.ENRICHMENT_PROVIDER_URL) },
  },
] as const;

function nowIso() {
  return new Date().toISOString();
}

function clean(value: unknown, max = 2_000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function jsonFeedUrls() {
  return (process.env.OPPORTUNITY_JSON_FEEDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export async function synchronizeProviderRegistry(supabase: SupabaseClient) {
  const rows = PROVIDERS.map((provider) => ({
    ...provider,
    health_status: provider.enabled ? "Operational" : "Blocked",
    updated_at: nowIso(),
  }));
  const { error } = await supabase.from("marketvibe_provider_configurations").upsert(rows, { onConflict: "provider_identifier" });
  if (error) throw error;
  return { synchronized: rows.length, enabled: rows.filter((row) => row.enabled).length };
}

async function startProviderRun(supabase: SupabaseClient, identifier: string, runType: string) {
  const key = `${identifier}:${runType}:${new Date().toISOString().slice(0, 13)}`;
  const { data, error } = await supabase.from("marketvibe_provider_runs").upsert({
    provider_identifier: identifier,
    run_type: runType,
    idempotency_key: key,
    status: "running",
    started_at: nowIso(),
  }, { onConflict: "idempotency_key" }).select("id,status").single();
  if (error) throw error;
  return data;
}

async function finishProviderRun(supabase: SupabaseClient, input: {
  id: string;
  identifier: string;
  status: "completed" | "partial" | "failed" | "skipped";
  attempted: number;
  succeeded: number;
  failed: number;
  error?: string;
}) {
  await supabase.from("marketvibe_provider_runs").update({
    status: input.status,
    completed_at: nowIso(),
    records_attempted: input.attempted,
    records_succeeded: input.succeeded,
    records_failed: input.failed,
    error_summary: input.error ? { message: input.error } : {},
  }).eq("id", input.id);
  await supabase.from("marketvibe_provider_configurations").update({
    last_attempted_run: nowIso(),
    ...(input.status === "completed" || input.status === "partial" ? { last_successful_run: nowIso() } : {}),
    health_status: input.status === "completed" ? "Operational" : input.status === "partial" ? "Degraded" : "Blocked",
    health_message: input.error || `${input.succeeded}/${input.attempted} records accepted in the latest run.`,
    updated_at: nowIso(),
  }).eq("provider_identifier", input.identifier);
}

export function automatedSourceAllowed(item: LicensedOpportunityInput) {
  try {
    const host = new URL(normalizeUrl(item.source_url)).hostname.toLowerCase();
    if (host === "linkedin.com" || host.endsWith(".linkedin.com")) return false;
  } catch {
    return false;
  }
  return Boolean(clean(item.company_name) && clean(item.source_text) && clean(item.license_basis));
}

async function activeProfiles(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("customer_search_profiles").select("*").eq("status", "active").limit(50);
  if (error) throw error;
  return (data || []) as CustomerSearchProfile[];
}

function profileForItem(profiles: CustomerSearchProfile[], item: LicensedOpportunityInput) {
  const evidence = clean(`${item.niche || ""} ${item.company_industry || ""} ${item.source_text}`).toLowerCase();
  return profiles.find((profile) => {
    const terms = [profile.niche, profile.target_service, ...profile.target_industries].map((value) => clean(value).toLowerCase()).filter(Boolean);
    return terms.some((term) => evidence.includes(term) || term.split(/\s+/).some((token) => token.length >= 5 && evidence.includes(token)));
  }) || profiles[0];
}

function opportunityRow(item: LicensedOpportunityInput, profile: CustomerSearchProfile) {
  const candidate: OpportunityInput = {
    company_name: clean(item.company_name, 160),
    company_domain: normalizeDomain(item.company_domain || domainFromUrl(item.company_website)),
    company_website: normalizeUrl(item.company_website),
    company_location: clean(item.company_location, 300) || null,
    company_country: clean(item.company_country, 120) || null,
    company_industry: clean(item.company_industry, 200) || null,
    company_size: clean(item.company_size, 100) || null,
    company_description: clean(item.company_description, 1000) || null,
    contact_first_name: clean(item.contact_first_name, 100) || null,
    contact_last_name: clean(item.contact_last_name, 100) || null,
    contact_full_name: clean(item.contact_full_name, 200) || null,
    contact_job_title: clean(item.contact_job_title, 200) || null,
    public_email: normalizeEmail(item.public_email),
    public_phone: normalizePhone(item.public_phone),
    source_type: clean(item.source_type, 100) || "licensed_partner_feed",
    source_name: clean(item.source_name, 300) || "Licensed partner opportunity feed",
    source_url: normalizeUrl(item.source_url),
    source_title: clean(item.source_title, 500) || clean(item.company_name, 160),
    source_text: clean(item.source_text, 12_000),
    source_published_at: item.source_published_at || nowIso(),
    captured_at: nowIso(),
    last_verified_at: null,
    evidence_status: "public_signal_verified",
    niche: clean(item.niche, 300) || profile.niche,
    target_location: clean(item.target_location, 300) || profile.target_locations.join(", ") || null,
  };
  const scores = calculateOpportunityScores(candidate, profile);
  const qualification = qualifyOpportunity(candidate, scores, profile);
  return {
    candidate,
    scores,
    qualification,
    row: {
      ...candidate,
      company_linkedin_url: null,
      contact_linkedin_url: null,
      next_verification_at: nowIso(),
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
      assignment_status: "unassigned",
      delivery_status: "not_delivered",
      replacement_status: "none",
      customer_id: null,
      customer_email: null,
      product_code: null,
      dedupe_key: buildOpportunityDedupeKey(candidate),
      exclusivity_key: null,
      rejection_reason: qualification.rejection_reason || null,
      customer_summary: buildCustomerSummary(candidate, scores),
      recommended_action: recommendedAction(candidate, scores),
      is_test_data: false,
      quality_flags: qualification.quality_flags,
      updated_at: nowIso(),
    },
  };
}

export async function ingestLicensedOpportunityBatch({
  supabase,
  items,
  providerIdentifier,
}: {
  supabase: SupabaseClient;
  items: LicensedOpportunityInput[];
  providerIdentifier: string;
}) {
  const profiles = await activeProfiles(supabase);
  if (profiles.length === 0) return { attempted: items.length, accepted: 0, rejected: items.length, duplicates: 0, reason: "no_active_profiles" };
  let accepted = 0;
  let rejected = 0;
  let duplicates = 0;
  for (const supplied of items.slice(0, 250)) {
    const item = { ...supplied, license_basis: supplied.license_basis || process.env.OPPORTUNITY_JSON_FEED_LICENSE_BASIS || "" };
    if (!automatedSourceAllowed(item)) {
      rejected += 1;
      continue;
    }
    try {
      await assertSafePublicUrl(item.source_url);
      const profile = profileForItem(profiles, item);
      const prepared = opportunityRow(item, profile);
      if (!prepared.row.dedupe_key) {
        rejected += 1;
        continue;
      }
      const { error } = await supabase.from("opportunities").insert(prepared.row);
      if (error?.code === "23505") duplicates += 1;
      else if (error) throw error;
      else {
        accepted += 1;
        await supabase.from("marketvibe_opportunity_evidence").insert({
          canonical_source_url: prepared.candidate.source_url,
          source_provider: providerIdentifier,
          source_category: prepared.candidate.source_type,
          source_publication_date: prepared.candidate.source_published_at,
          source_organisation: prepared.candidate.source_name,
          evidence_excerpt: prepared.candidate.source_text.slice(0, 1000),
          evidence_summary: prepared.candidate.source_text.slice(0, 2000),
          compliance_classification: `licensed_or_public:${item.license_basis}`,
          raw_payload: { supplied: item, license_basis: item.license_basis },
        });
      }
    } catch {
      rejected += 1;
    }
  }
  return { attempted: Math.min(items.length, 250), accepted, rejected, duplicates };
}

async function fetchLicensedJsonFeeds(supabase: SupabaseClient) {
  const identifier = "licensed_json_opportunities";
  const urls = jsonFeedUrls();
  if (!urls.length || !process.env.OPPORTUNITY_JSON_FEED_LICENSE_BASIS) {
    return { attempted: 0, accepted: 0, rejected: 0, duplicates: 0, skipped: true };
  }
  const run = await startProviderRun(supabase, identifier, "scheduled_ingestion");
  const items: LicensedOpportunityInput[] = [];
  let fetchFailures = 0;
  for (const configuredUrl of urls) {
    try {
      const url = await assertSafePublicUrl(configuredUrl);
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          ...(process.env.OPPORTUNITY_JSON_FEED_TOKEN ? { authorization: `Bearer ${process.env.OPPORTUNITY_JSON_FEED_TOKEN}` } : {}),
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`json_feed_http_${response.status}`);
      const payload = await response.json() as LicensedOpportunityInput[] | { items?: LicensedOpportunityInput[] };
      const rows = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
      items.push(...rows.map((item) => ({
        ...item,
        source_name: item.source_name || url,
        license_basis: item.license_basis || process.env.OPPORTUNITY_JSON_FEED_LICENSE_BASIS,
      })));
    } catch {
      fetchFailures += 1;
    }
  }
  const result = await ingestLicensedOpportunityBatch({ supabase, items, providerIdentifier: identifier });
  await finishProviderRun(supabase, {
    id: String(run.id),
    identifier,
    status: fetchFailures ? (result.accepted ? "partial" : "failed") : "completed",
    attempted: result.attempted + fetchFailures,
    succeeded: result.accepted,
    failed: result.rejected + fetchFailures,
    error: fetchFailures ? `${fetchFailures} configured JSON feed(s) failed.` : undefined,
  });
  return { ...result, fetchFailures, skipped: false };
}

export async function runContinuousSupply({ supabase }: { supabase: SupabaseClient }) {
  const registry = await synchronizeProviderRegistry(supabase);
  const json = await fetchLicensedJsonFeeds(supabase);
  const navigator = await syncApprovedNavigatorProspectsToOpportunities({ trigger: "cron", limit: 100 });
  const publicDiscovery = await runPropertyDiscoveryWithIntegrity({ trigger: "cron" });
  const verification = await runOpportunityVerification({ trigger: "cron", limit: 50 });
  const enrichment = await enrichOpportunityBacklog({ supabase, limit: 25 });
  return { ok: true, registry, json, navigator, publicDiscovery, verification, enrichment };
}
