import { scoreImportedFacebookPosts, type ImportedFacebookPost, type ScoredFacebookPost } from "@/lib/facebook-radar-import";
import { getSupabaseAdmin } from "@/lib/supabase";

export type InternalMarketingLeadResponse = {
  source: "internal_marketing_leads";
  counts: {
    imported: number;
    scored: number;
    good: number;
    manualOnly: number;
    skipped: number;
  };
  results: ScoredFacebookPost[];
  skipped: ScoredFacebookPost[];
  importedAt: string;
  storage: "supabase" | "memory" | "unavailable";
  error?: string;
};

export type InternalMarketingLeadPayload = {
  posts?: ImportedFacebookPost[];
  searchPhrase?: string;
  targetBuyer?: string;
  painKeywords?: string;
  runId?: string;
};

export type InternalMarketingLeadStatus = {
  runId?: string;
  active: boolean;
  paused: boolean;
  recoveryNeeded?: boolean;
  query: string;
  source: string;
  currentUrl: string;
  currentItem: number;
  totalQueued: number;
  completed: number;
  imported: number;
  skipped: number;
  ignoredLowConfidence?: number;
  duplicates: number;
  failed: number;
  status: string;
  lastError: string;
  errors: string[];
  updatedAt: string;
  extensionVersion?: string;
};

export type LeadHuntEventPayload = {
  runId?: string;
  eventType: string;
  message?: string;
  reason?: string;
  sourceUrl?: string;
  query?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

export type LeadHuntEventRecord = LeadHuntEventPayload & {
  createdAt?: string;
};

export type ProcessedUrlPayload = {
  runId?: string;
  sourceUrl: string;
  status: "imported" | "skipped" | "duplicate" | "failed";
  reason?: string;
  query?: string;
  score?: number;
};

const memoryLeads: ScoredFacebookPost[] = [];
const memoryEvents: LeadHuntEventRecord[] = [];
const memoryProcessedUrls = new Map<string, ProcessedUrlPayload>();

let latestImport: InternalMarketingLeadResponse | null = null;

export let latestInternalMarketingLeadStatus: InternalMarketingLeadStatus = {
  active: false,
  paused: false,
  query: "Not started",
  source: "Not started",
  currentUrl: "",
  currentItem: 0,
  totalQueued: 0,
  completed: 0,
  imported: 0,
  skipped: 0,
  ignoredLowConfidence: 0,
  duplicates: 0,
  failed: 0,
  status: "Ready.",
  lastError: "",
  errors: [],
  updatedAt: "",
};

const RUN_STALE_MS = 120000;

function allowMemoryStore() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_INTERNAL_MEMORY_STORE === "true";
}

function requireInternalStore() {
  const supabase = getSupabaseAdmin();
  if (supabase) return supabase;
  if (allowMemoryStore()) return null;
  throw new Error("Supabase service role is required for internal marketing leads in production. No memory-store fallback is allowed.");
}

function clean(value: unknown, limit = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function asNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sourceUrlKey(value: unknown) {
  return clean(value, 700).toLowerCase();
}

function toRow(lead: ScoredFacebookPost, runId?: string) {
  return {
    run_id: runId || null,
    source: "lead_hunt_autopilot",
    platform: "facebook",
    label: lead.label,
    fit_rank: lead.fitRank,
    score: lead.fitRank,
    post_text: lead.text,
    source_name: lead.sourceName || null,
    group_name: lead.sourceName || null,
    author: lead.author || null,
    date_text: lead.dateText || null,
    source_url: lead.url || null,
    query_used: lead.queryUsed || null,
    source_used: lead.sourceUsed || null,
    pain_point: lead.painPoint || null,
    intent_reason: lead.analysis?.reason || null,
    reply_draft: lead.replyDraft || lead.analysis?.quickReply || null,
    outreach_mode: lead.outreachMode || null,
    outreach_status: "new",
    status: "new",
    analysis: lead.analysis,
    raw_data: lead,
    imported_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function fromRow(row: Record<string, unknown>): ScoredFacebookPost {
  const raw = row.raw_data && typeof row.raw_data === "object" ? row.raw_data as Partial<ScoredFacebookPost> : {};
  return {
    ...raw,
    id: String(row.id || raw.id || row.source_url || row.post_text || Date.now()),
    text: String(row.post_text || raw.text || ""),
    sourceName: row.source_name ? String(row.source_name) : row.group_name ? String(row.group_name) : raw.sourceName,
    author: row.author ? String(row.author) : raw.author,
    dateText: row.date_text ? String(row.date_text) : raw.dateText,
    url: row.source_url ? String(row.source_url) : raw.url,
    queryUsed: row.query_used ? String(row.query_used) : raw.queryUsed,
    sourceUsed: row.source_used ? String(row.source_used) : raw.sourceUsed,
    painPoint: row.pain_point ? String(row.pain_point) : raw.painPoint,
    replyDraft: row.reply_draft ? String(row.reply_draft) : raw.replyDraft,
    outreachMode: row.outreach_mode ? String(row.outreach_mode) : raw.outreachMode,
    status: row.status ? String(row.status) : raw.status,
    outreachStatus: row.outreach_status ? String(row.outreach_status) : raw.outreachStatus,
    fitRank: Number(row.fit_rank || row.score || raw.fitRank || 0),
    label: row.label === "Good" || row.label === "ManualOnly" || row.label === "Skip" || row.label === "Bad fit" ? row.label : raw.label || "ManualOnly",
    analysis: row.analysis && typeof row.analysis === "object" ? row.analysis as ScoredFacebookPost["analysis"] : raw.analysis as ScoredFacebookPost["analysis"],
  };
}

function emptyResponse(storage: InternalMarketingLeadResponse["storage"]): InternalMarketingLeadResponse {
  return {
    source: "internal_marketing_leads",
    counts: { imported: 0, scored: 0, good: 0, manualOnly: 0, skipped: 0 },
    results: [],
    skipped: [],
    importedAt: "",
    storage,
  };
}

async function listFromSupabase(limit = 100) {
  const supabase = requireInternalStore();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("internal_marketing_leads")
    .select("*")
    .order("imported_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => fromRow(row as Record<string, unknown>));
}

async function saveToSupabase(leads: ScoredFacebookPost[], runId?: string) {
  const supabase = requireInternalStore();
  if (!supabase || !leads.length) return false;
  const rows = leads.map((lead) => toRow(lead, runId));
  const { error } = await supabase.from("internal_marketing_leads").upsert(rows, { onConflict: "source_url" });
  if (error) throw new Error(error.message);
  return true;
}

export async function getInternalMarketingLeads(): Promise<InternalMarketingLeadResponse> {
  const supabaseLeads = await listFromSupabase();
  const leads = supabaseLeads || memoryLeads;
  const results = leads.filter((post) => post.label === "Good" || post.label === "ManualOnly").slice(0, 100);
  const skipped = leads.filter((post) => post.label === "Skip" || post.label === "Bad fit").slice(0, 100);
  const storage = supabaseLeads ? "supabase" : "memory";
  return latestImport
    ? { ...latestImport, results, skipped, storage }
    : { ...emptyResponse(storage), results, skipped };
}

export async function importInternalMarketingLeads(payload: InternalMarketingLeadPayload): Promise<InternalMarketingLeadResponse> {
  const scored = scoreImportedFacebookPosts({
    posts: Array.isArray(payload.posts) ? payload.posts : [],
    searchPhrase: payload.searchPhrase,
    targetBuyer: payload.targetBuyer,
    painKeywords: payload.painKeywords,
  });
  const visible = scored.filter((post) => post.label === "Good" || post.label === "ManualOnly").slice(0, 20);
  const skipped = scored.filter((post) => post.label === "Skip" || post.label === "Bad fit");
  const savedToSupabase = await saveToSupabase(visible, payload.runId);

  if (!savedToSupabase) {
    const existing = new Set(memoryLeads.map((lead) => sourceUrlKey(lead.url) || (lead.text || "").toLowerCase().slice(0, 180)));
    for (const lead of visible) {
      const key = sourceUrlKey(lead.url) || (lead.text || "").toLowerCase().slice(0, 180);
      if (!existing.has(key)) memoryLeads.unshift(lead);
    }
    memoryLeads.splice(100);
  }

  await logLeadHuntEvent({
    runId: payload.runId,
    eventType: "import",
    message: `Imported ${visible.length} internal marketing lead(s).`,
    query: payload.searchPhrase,
    metadata: { scored: scored.length, skipped: skipped.length, storage: savedToSupabase ? "supabase" : "memory" },
  });

  latestImport = {
    source: "internal_marketing_leads",
    counts: {
      imported: visible.length,
      scored: scored.length,
      good: scored.filter((post) => post.label === "Good").length,
      manualOnly: scored.filter((post) => post.label === "ManualOnly").length,
      skipped: skipped.length,
    },
    results: visible,
    skipped,
    importedAt: new Date().toISOString(),
    storage: savedToSupabase ? "supabase" : "memory",
  };

  return latestImport;
}

export async function updateInternalMarketingLeadStatus(payload: Partial<InternalMarketingLeadStatus>) {
  latestInternalMarketingLeadStatus = {
    runId: clean(payload.runId, 80) || latestInternalMarketingLeadStatus.runId,
    active: Boolean(payload.active),
    paused: Boolean(payload.paused),
    recoveryNeeded: Boolean(payload.recoveryNeeded),
    query: clean(payload.query || "Not started", 180),
    source: clean(payload.source || "Not started", 120),
    currentUrl: clean(payload.currentUrl, 700),
    currentItem: asNumber(payload.currentItem),
    totalQueued: asNumber(payload.totalQueued),
    completed: asNumber(payload.completed),
    imported: asNumber(payload.imported),
    skipped: asNumber(payload.skipped),
    ignoredLowConfidence: asNumber(payload.ignoredLowConfidence),
    duplicates: asNumber(payload.duplicates),
    failed: asNumber(payload.failed),
    status: clean(payload.status, 300),
    lastError: clean(payload.lastError, 180),
    errors: Array.isArray(payload.errors) ? payload.errors.map((item) => clean(item, 180)).slice(0, 8) : [],
    updatedAt: clean(payload.updatedAt || new Date().toISOString(), 80),
    extensionVersion: clean(payload.extensionVersion, 40),
  };

  const supabase = requireInternalStore();
  if (supabase && latestInternalMarketingLeadStatus.runId) {
    const { error } = await supabase.from("lead_hunt_runs").upsert({
      id: latestInternalMarketingLeadStatus.runId,
      active: latestInternalMarketingLeadStatus.active,
      paused: latestInternalMarketingLeadStatus.paused,
      status: latestInternalMarketingLeadStatus.status,
      current_query: latestInternalMarketingLeadStatus.query,
      current_source: latestInternalMarketingLeadStatus.source,
      current_url: latestInternalMarketingLeadStatus.currentUrl,
      imported_count: latestInternalMarketingLeadStatus.imported,
      skipped_count: latestInternalMarketingLeadStatus.skipped,
      duplicate_count: latestInternalMarketingLeadStatus.duplicates,
      failed_count: latestInternalMarketingLeadStatus.failed,
      errors: latestInternalMarketingLeadStatus.errors,
      extension_version: latestInternalMarketingLeadStatus.extensionVersion || null,
      updated_at: new Date().toISOString(),
      stopped_at: latestInternalMarketingLeadStatus.active ? null : new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  return latestInternalMarketingLeadStatus;
}

export async function getInternalMarketingLeadStatus() {
  const supabase = requireInternalStore();
  if (!supabase) return latestInternalMarketingLeadStatus;
  const { data, error } = await supabase
    .from("lead_hunt_runs")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return latestInternalMarketingLeadStatus;
  const updatedAt = String(data.updated_at || "");
  const updatedAtMs = updatedAt ? Date.parse(updatedAt) : 0;
  const recoveryNeeded = Boolean(data.active) && (!updatedAtMs || Date.now() - updatedAtMs > RUN_STALE_MS);
  const cachedSameRun = latestInternalMarketingLeadStatus.runId === String(data.id || "");
  const errors = Array.isArray(data.errors) ? data.errors.map(String).slice(0, 8) : [];
  const imported = Number(data.imported_count || 0);
  const skipped = Number(data.skipped_count || 0);
  const duplicates = Number(data.duplicate_count || 0);
  const failed = Number(data.failed_count || 0);
  const cachedIgnoredLowConfidence = latestInternalMarketingLeadStatus.runId === String(data.id || "") ? Number(latestInternalMarketingLeadStatus.ignoredLowConfidence || 0) : 0;
  return {
    runId: String(data.id || ""),
    active: recoveryNeeded ? false : Boolean(data.active),
    paused: recoveryNeeded ? false : Boolean(data.paused),
    recoveryNeeded,
    query: String(data.current_query || "Not started"),
    source: String(data.current_source || "Not started"),
    currentUrl: String(data.current_url || ""),
    currentItem: cachedSameRun ? latestInternalMarketingLeadStatus.currentItem : imported + skipped + cachedIgnoredLowConfidence + duplicates + failed,
    totalQueued: cachedSameRun ? latestInternalMarketingLeadStatus.totalQueued : 0,
    completed: cachedSameRun ? latestInternalMarketingLeadStatus.completed : imported + skipped + cachedIgnoredLowConfidence + duplicates + failed,
    imported,
    skipped,
    ignoredLowConfidence: cachedIgnoredLowConfidence,
    duplicates,
    failed,
    status: recoveryNeeded ? "Recovery needed. The previous run stopped updating before it was marked stopped." : String(data.status || "Ready."),
    lastError: cachedSameRun ? latestInternalMarketingLeadStatus.lastError : errors[0] || "",
    errors,
    updatedAt,
    extensionVersion: data.extension_version ? String(data.extension_version) : "",
  };
}

export async function logLeadHuntEvent(payload: LeadHuntEventPayload) {
  const event = {
    ...payload,
    eventType: clean(payload.eventType, 80),
    message: clean(payload.message, 300),
    reason: clean(payload.reason, 240),
    sourceUrl: clean(payload.sourceUrl, 700),
    query: clean(payload.query, 180),
    score: asNumber(payload.score),
    createdAt: new Date().toISOString(),
  };
  const supabase = requireInternalStore();
  if (!supabase) {
    memoryEvents.unshift(event);
    memoryEvents.splice(100);
    return event;
  }
  const { error } = await supabase.from("lead_hunt_events").insert({
    run_id: event.runId || null,
    event_type: event.eventType,
    message: event.message,
    reason: event.reason,
    source_url: event.sourceUrl,
    query: event.query,
    score: event.score,
    metadata: event.metadata || {},
  });
  if (error) throw new Error(error.message);
  return event;
}

export async function getLeadHuntEvents(limit = 25): Promise<LeadHuntEventRecord[]> {
  const safeLimit = Math.max(1, Math.min(100, asNumber(limit) || 25));
  const supabase = requireInternalStore();
  if (!supabase) return memoryEvents.slice(0, safeLimit);
  const { data, error } = await supabase
    .from("lead_hunt_events")
    .select("run_id,event_type,message,reason,source_url,query,score,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    runId: row.run_id ? String(row.run_id) : "",
    eventType: String(row.event_type || ""),
    message: row.message ? String(row.message) : "",
    reason: row.reason ? String(row.reason) : "",
    sourceUrl: row.source_url ? String(row.source_url) : "",
    query: row.query ? String(row.query) : "",
    score: asNumber(row.score),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {},
    createdAt: row.created_at ? String(row.created_at) : "",
  }));
}

export async function recordProcessedUrl(payload: ProcessedUrlPayload) {
  const sourceUrl = clean(payload.sourceUrl, 700);
  if (!sourceUrl) throw new Error("sourceUrl is required");
  const supabase = requireInternalStore();
  if (!supabase) {
    memoryProcessedUrls.set(`${payload.runId || "local"}:${sourceUrl}`, payload);
    return payload;
  }
  const { error } = await supabase.from("lead_hunt_processed_urls").upsert({
    run_id: payload.runId || null,
    source_url: sourceUrl,
    status: payload.status,
    reason: clean(payload.reason, 240),
    query: clean(payload.query, 180),
    score: asNumber(payload.score),
    updated_at: new Date().toISOString(),
  }, { onConflict: "run_id,source_url" });
  if (error) throw new Error(error.message);
  return payload;
}

export async function updateInternalMarketingLead(id: string, patch: { status?: string; outreachStatus?: string }) {
  const status = clean(patch.status, 40);
  const outreachStatus = clean(patch.outreachStatus, 40);
  const supabase = requireInternalStore();
  if (!supabase) return { id, status, outreachStatus, storage: "memory" };
  const update: Record<string, string> = { updated_at: new Date().toISOString() };
  if (status) update.status = status;
  if (outreachStatus) update.outreach_status = outreachStatus;
  const { error } = await supabase.from("internal_marketing_leads").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  return { id, status, outreachStatus, storage: "supabase" };
}

export async function exportInternalMarketingLeadsCsv() {
  const data = await getInternalMarketingLeads();
  const rows = data.results.map((lead) => [
    lead.sourceName || "",
    lead.author || "",
    lead.text || "",
    lead.fitRank || 0,
    lead.painPoint || "",
    lead.url || "",
    lead.queryUsed || "",
    lead.sourceUsed || "",
    lead.replyDraft || lead.analysis?.quickReply || "",
  ]);
  const header = ["group_or_page", "author", "post_text", "score", "pain_point", "url", "query_used", "source_used", "reply_draft"];
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

export async function createTestInternalMarketingLead() {
  return importInternalMarketingLeads({
    runId: `test-${Date.now()}`,
    searchPhrase: "test buyer radar item survives refresh",
    posts: [{
      text: "I run a small web design service and cold outreach is not working. How do I find local business leads without spamming people?",
      sourceName: "MarketVibe Internal Test",
      author: "Internal QA",
      url: `https://www.facebook.com/groups/marketvibe-test/posts/${Date.now()}`,
      queryUsed: "test buyer radar item survives refresh",
      sourceUsed: "internal test",
    }],
  });
}

export function internalMemoryFallbackAllowedForTestsOnly() {
  return allowMemoryStore();
}
