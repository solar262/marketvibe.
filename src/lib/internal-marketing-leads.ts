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
  storage: "supabase" | "memory";
};

export type InternalMarketingLeadPayload = {
  posts?: ImportedFacebookPost[];
  searchPhrase?: string;
  targetBuyer?: string;
  painKeywords?: string;
};

export type InternalMarketingLeadStatus = {
  active: boolean;
  paused: boolean;
  query: string;
  source: string;
  currentUrl: string;
  imported: number;
  skipped: number;
  duplicates: number;
  failed: number;
  status: string;
  errors: string[];
  updatedAt: string;
};

const memoryLeads: ScoredFacebookPost[] = [];

let latestImport: InternalMarketingLeadResponse | null = null;

export let latestInternalMarketingLeadStatus: InternalMarketingLeadStatus = {
  active: false,
  paused: false,
  query: "Not started",
  source: "Not started",
  currentUrl: "",
  imported: 0,
  skipped: 0,
  duplicates: 0,
  failed: 0,
  status: "Ready.",
  errors: [],
  updatedAt: "",
};

function clean(value: unknown, limit = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function asNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toRow(lead: ScoredFacebookPost) {
  return {
    source: "lead_hunt_autopilot",
    platform: "facebook",
    label: lead.label,
    fit_rank: lead.fitRank,
    post_text: lead.text,
    source_name: lead.sourceName || null,
    author: lead.author || null,
    date_text: lead.dateText || null,
    source_url: lead.url || null,
    query_used: lead.queryUsed || null,
    source_used: lead.sourceUsed || null,
    pain_point: lead.painPoint || null,
    reply_draft: lead.replyDraft || null,
    outreach_mode: lead.outreachMode || null,
    analysis: lead.analysis,
    raw_data: lead,
    imported_at: new Date().toISOString(),
  };
}

function fromRow(row: Record<string, unknown>): ScoredFacebookPost {
  const raw = row.raw_data && typeof row.raw_data === "object" ? row.raw_data as Partial<ScoredFacebookPost> : {};
  return {
    ...raw,
    id: String(row.id || raw.id || row.source_url || row.post_text || Date.now()),
    text: String(row.post_text || raw.text || ""),
    sourceName: row.source_name ? String(row.source_name) : raw.sourceName,
    author: row.author ? String(row.author) : raw.author,
    dateText: row.date_text ? String(row.date_text) : raw.dateText,
    url: row.source_url ? String(row.source_url) : raw.url,
    queryUsed: row.query_used ? String(row.query_used) : raw.queryUsed,
    sourceUsed: row.source_used ? String(row.source_used) : raw.sourceUsed,
    painPoint: row.pain_point ? String(row.pain_point) : raw.painPoint,
    replyDraft: row.reply_draft ? String(row.reply_draft) : raw.replyDraft,
    outreachMode: row.outreach_mode ? String(row.outreach_mode) : raw.outreachMode,
    fitRank: Number(row.fit_rank || raw.fitRank || 0),
    label: row.label === "Good" || row.label === "ManualOnly" || row.label === "Skip" || row.label === "Bad fit" ? row.label : raw.label || "ManualOnly",
    analysis: row.analysis && typeof row.analysis === "object" ? row.analysis as ScoredFacebookPost["analysis"] : raw.analysis as ScoredFacebookPost["analysis"],
  };
}

function emptyResponse(): InternalMarketingLeadResponse {
  return {
    source: "internal_marketing_leads",
    counts: { imported: 0, scored: 0, good: 0, manualOnly: 0, skipped: 0 },
    results: [],
    skipped: [],
    importedAt: "",
    storage: getSupabaseAdmin() ? "supabase" : "memory",
  };
}

async function listFromSupabase(limit = 50) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("internal_marketing_leads")
    .select("*")
    .order("imported_at", { ascending: false })
    .limit(limit);
  if (error || !data) return null;
  return data.map((row) => fromRow(row as Record<string, unknown>));
}

async function saveToSupabase(leads: ScoredFacebookPost[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !leads.length) return false;
  const rows = leads.map(toRow);
  const { error } = await supabase.from("internal_marketing_leads").upsert(rows, { onConflict: "source_url" });
  return !error;
}

export async function getInternalMarketingLeads(): Promise<InternalMarketingLeadResponse> {
  const supabaseLeads = await listFromSupabase();
  const leads = supabaseLeads || memoryLeads;
  const results = leads.filter((post) => post.label === "Good" || post.label === "ManualOnly").slice(0, 50);
  const skipped = leads.filter((post) => post.label === "Skip" || post.label === "Bad fit").slice(0, 50);
  return latestImport
    ? { ...latestImport, results, skipped, storage: supabaseLeads ? "supabase" : "memory" }
    : { ...emptyResponse(), results, skipped };
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
  const savedToSupabase = await saveToSupabase(visible);

  if (!savedToSupabase) {
    const existing = new Set(memoryLeads.map((lead) => lead.url || (lead.text || "").slice(0, 180)));
    for (const lead of visible) {
      const key = lead.url || (lead.text || "").slice(0, 180);
      if (!existing.has(key)) memoryLeads.unshift(lead);
    }
    memoryLeads.splice(100);
  }

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

export function updateInternalMarketingLeadStatus(payload: Partial<InternalMarketingLeadStatus>) {
  latestInternalMarketingLeadStatus = {
    active: Boolean(payload.active),
    paused: Boolean(payload.paused),
    query: clean(payload.query || "Not started", 180),
    source: clean(payload.source || "Not started", 120),
    currentUrl: clean(payload.currentUrl, 700),
    imported: asNumber(payload.imported),
    skipped: asNumber(payload.skipped),
    duplicates: asNumber(payload.duplicates),
    failed: asNumber(payload.failed),
    status: clean(payload.status, 300),
    errors: Array.isArray(payload.errors) ? payload.errors.map((item) => clean(item, 180)).slice(0, 8) : [],
    updatedAt: clean(payload.updatedAt || new Date().toISOString(), 80),
  };
  return latestInternalMarketingLeadStatus;
}
