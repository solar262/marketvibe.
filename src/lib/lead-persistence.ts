import type { BusinessLead, LeadSearchInput } from "./types";
import { getSupabaseAdmin, supabaseConnectionStatus } from "./supabase";

export type PersistedLeadSearch = {
  searchRunId?: string;
  saved: boolean;
  error?: string;
};

function normalizeJsonArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function leadToRow(lead: BusinessLead, searchRunId: string) {
  return {
    search_run_id: searchRunId,
    external_id: lead.id,
    audit_slug: lead.slug,
    source_status: lead.sourceStatus || "demo",
    business_name: lead.businessName,
    website: lead.website,
    contact_page_url: lead.contactPageUrl || null,
    public_email: lead.publicEmail || null,
    phone: lead.phone || null,
    city: lead.city,
    country: lead.country,
    business_category: lead.businessCategory,
    google_profile_url: lead.googleProfileUrl || null,
    social_links: lead.socialLinks || [],
    source: lead.source,
    source_url: lead.sourceUrl || null,
    raw_data: {
      googleProfileUrl: lead.googleProfileUrl,
      sourceStatus: lead.sourceStatus,
    },
  };
}

function auditToRow(lead: BusinessLead, leadId: string, searchRunId: string) {
  const audit = lead.audit;
  return {
    lead_id: leadId,
    search_run_id: searchRunId,
    audit_slug: lead.slug,
    score: audit.score,
    priority: audit.priority,
    page_title: audit.pageTitle || null,
    meta_description: audit.metaDescription || null,
    mobile_friendly: audit.mobileFriendly,
    page_speed: audit.pageSpeed,
    ssl_present: audit.sslPresent,
    contact_form_present: audit.contactFormPresent,
    booking_button_present: audit.bookingButtonPresent,
    phone_visible: audit.phoneVisible,
    email_visible: audit.emailVisible,
    social_links_visible: audit.socialLinksVisible,
    reviews_visible: audit.reviewsVisible,
    clear_call_to_action_visible: audit.clearCallToActionVisible,
    broken_links: audit.brokenLinks,
    old_copyright_year: audit.oldCopyrightYear || null,
    summary: audit.summary,
    findings: audit.findings,
    issues: audit.issues,
    service_angle: audit.serviceAngle,
    outreach_message: audit.outreachMessage,
    subject_line: audit.subjectLine,
    suggested_offer: audit.suggestedOffer,
    fix_checklist: audit.fixChecklist,
    scan_results: {
      pageTitle: audit.pageTitle,
      metaDescription: audit.metaDescription,
      pageSpeed: audit.pageSpeed,
      brokenLinks: audit.brokenLinks,
    },
  };
}

export async function persistLeadSearch({
  input,
  leads,
  sourceStatus,
  sourceNote,
  sourceUrl,
  errorMessage,
}: {
  input: LeadSearchInput;
  leads: BusinessLead[];
  sourceStatus: "live" | "demo";
  sourceNote?: string;
  sourceUrl?: string;
  errorMessage?: string;
}): Promise<PersistedLeadSearch> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { saved: false, error: "Supabase server writes are not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." };
  }

  const { data: searchRun, error: searchError } = await supabase
    .from("search_runs")
    .insert({
      country: input.country,
      city: input.city,
      business_type: input.businessType,
      service_category: input.serviceCategory,
      source_status: sourceStatus,
      status: errorMessage ? "failed" : "completed",
      source_note: sourceNote || null,
      source_url: sourceUrl || null,
      result_count: leads.length,
      error_message: errorMessage || null,
    })
    .select("id")
    .single();

  if (searchError || !searchRun) {
    return { saved: false, error: searchError?.message || "Search run was not saved." };
  }

  for (const lead of leads) {
    const { data: savedLead, error: leadError } = await supabase
      .from("leads")
      .upsert(leadToRow(lead, searchRun.id), { onConflict: "audit_slug" })
      .select("id")
      .single();

    if (leadError || !savedLead) {
      return { saved: false, searchRunId: searchRun.id, error: leadError?.message || `Lead ${lead.businessName} was not saved.` };
    }

    const { error: auditError } = await supabase
      .from("audits")
      .upsert(auditToRow(lead, savedLead.id, searchRun.id), { onConflict: "audit_slug" });

    if (auditError) {
      return { saved: false, searchRunId: searchRun.id, error: auditError.message };
    }
  }

  return { saved: true, searchRunId: searchRun.id };
}

export async function getAuditBySlugFromSupabase(slug: string): Promise<BusinessLead | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("audits")
    .select("*, leads(*)")
    .eq("audit_slug", slug)
    .maybeSingle();

  if (error || !data || !data.leads) return null;
  const leadRow = data.leads as Record<string, unknown>;

  return {
    id: String(leadRow.external_id || leadRow.id),
    slug: String(data.audit_slug),
    businessName: String(leadRow.business_name),
    website: String(leadRow.website),
    contactPageUrl: String(leadRow.contact_page_url || ""),
    publicEmail: leadRow.public_email ? String(leadRow.public_email) : undefined,
    phone: leadRow.phone ? String(leadRow.phone) : undefined,
    city: String(leadRow.city),
    country: String(leadRow.country),
    businessCategory: String(leadRow.business_category),
    googleProfileUrl: leadRow.google_profile_url ? String(leadRow.google_profile_url) : undefined,
    socialLinks: Array.isArray(leadRow.social_links) ? leadRow.social_links.map(String) : [],
    source: String(leadRow.source),
    sourceStatus: leadRow.source_status === "live" ? "live" : "demo",
    sourceUrl: leadRow.source_url ? String(leadRow.source_url) : undefined,
    audit: {
      pageTitle: String(data.page_title || ""),
      metaDescription: String(data.meta_description || ""),
      mobileFriendly: Boolean(data.mobile_friendly),
      pageSpeed: data.page_speed === "slow" || data.page_speed === "average" ? data.page_speed : "fast",
      sslPresent: Boolean(data.ssl_present),
      contactFormPresent: Boolean(data.contact_form_present),
      bookingButtonPresent: Boolean(data.booking_button_present),
      phoneVisible: Boolean(data.phone_visible),
      emailVisible: Boolean(data.email_visible),
      socialLinksVisible: Boolean(data.social_links_visible),
      reviewsVisible: Boolean(data.reviews_visible),
      clearCallToActionVisible: Boolean(data.clear_call_to_action_visible),
      brokenLinks: Number(data.broken_links || 0),
      oldCopyrightYear: data.old_copyright_year ? Number(data.old_copyright_year) : undefined,
      score: Number(data.score || 0),
      findings: normalizeJsonArray(data.findings) as BusinessLead["audit"]["findings"],
      summary: String(data.summary || ""),
      issues: normalizeJsonArray(data.issues).map(String),
      serviceAngle: String(data.service_angle || ""),
      outreachMessage: String(data.outreach_message || ""),
      subjectLine: String(data.subject_line || ""),
      priority: data.priority === "high" || data.priority === "medium" ? data.priority : "low",
      suggestedOffer: String(data.suggested_offer || ""),
      fixChecklist: normalizeJsonArray(data.fix_checklist).map(String),
    },
  };
}

export async function getLatestSavedLeads(limit = 10): Promise<BusinessLead[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("audits")
    .select("audit_slug")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  const leads = await Promise.all(data.map((row) => getAuditBySlugFromSupabase(String(row.audit_slug))));
  return leads.filter(Boolean) as BusinessLead[];
}

export async function getPersistenceStats() {
  const supabase = getSupabaseAdmin();
  const status = supabaseConnectionStatus();
  if (!supabase) {
    return {
      connected: false,
      status,
      latestSearches: [],
      savedLeadsCount: 0,
      savedAuditsCount: 0,
      error: "Supabase is not connected for server-side writes.",
    };
  }

  const [searches, leadsCount, auditsCount] = await Promise.all([
    supabase.from("search_runs").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("audits").select("id", { count: "exact", head: true }),
  ]);

  return {
    connected: !searches.error && !leadsCount.error && !auditsCount.error,
    status,
    latestSearches: searches.data || [],
    savedLeadsCount: leadsCount.count || 0,
    savedAuditsCount: auditsCount.count || 0,
    error: searches.error?.message || leadsCount.error?.message || auditsCount.error?.message,
  };
}
