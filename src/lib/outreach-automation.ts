import { addContactToMarketVibeList } from "./brevo";
import { sendQueuedOutreachHardCapped } from "./outreach-hard-cap";
import { queueOutreach } from "./outreach";
import { getSupabaseAdmin } from "./supabase";

function brevoSyncFailed(brevo: Record<string, unknown>) {
  return brevo.synced === false && typeof brevo.error === "string" && brevo.error.length > 0;
}

function boundedLimit(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(Math.floor(value), 100));
}

function configureAutonomousOutreach() {
  process.env.OUTREACH_EMAIL_PROVIDER = "brevo";
  process.env.OUTREACH_EMAIL_ENABLED = "true";
  process.env.OUTREACH_FROM_EMAIL = process.env.OUTREACH_FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || "hello@marketvibe1.com";
  process.env.OUTREACH_FROM_NAME = process.env.OUTREACH_FROM_NAME || process.env.BREVO_SENDER_NAME || "MarketVibe";
  process.env.OUTREACH_REPLY_TO = process.env.OUTREACH_REPLY_TO || process.env.OUTREACH_FROM_EMAIL;
  process.env.OUTREACH_DAILY_SEND_LIMIT = "50";
}

export async function queueEligibleSavedLeads(limit = 50) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      ok: false,
      queued: 0,
      skipped: 0,
      brevoSynced: 0,
      brevoFailed: 0,
      error: "Supabase server writes are not configured.",
      results: [],
    };
  }

  const safeLimit = boundedLimit(limit, 50);
  const { data, error } = await supabase
    .from("leads")
    .select("id,business_name,website,contact_page_url,public_email,source_status,created_at,audits(id,subject_line,outreach_message)")
    .eq("source_status", "live")
    .not("public_email", "is", null)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error || !data) {
    return {
      ok: false,
      queued: 0,
      skipped: 0,
      brevoSynced: 0,
      brevoFailed: 0,
      error: error?.message || "Saved live leads could not be read.",
      results: [],
    };
  }

  const results = [];
  for (const lead of data) {
    const audit = Array.isArray(lead.audits) ? lead.audits[0] : lead.audits;
    const email = String(lead.public_email || "").trim().toLowerCase();

    if (!email || !audit?.outreach_message) {
      results.push({
        email,
        businessName: lead.business_name,
        queued: false,
        skipped: true,
        reason: !email ? "Missing public email." : "Missing outreach message.",
        brevo: { synced: false, skipped: true },
      });
      continue;
    }

    let brevo: Record<string, unknown>;
    try {
      const response = await addContactToMarketVibeList(email);
      brevo = { synced: true, response };
    } catch (brevoError) {
      brevo = {
        synced: false,
        error: brevoError instanceof Error ? brevoError.message : "Brevo contact sync failed.",
      };
    }

    const queue = await queueOutreach({
      leadId: String(lead.id),
      auditId: audit.id ? String(audit.id) : undefined,
      recipientEmail: email,
      recipientName: String(lead.business_name || ""),
      businessName: String(lead.business_name || ""),
      website: String(lead.website || ""),
      contactPageUrl: String(lead.contact_page_url || ""),
      subject: String(audit.subject_line || `Quick website audit for ${lead.business_name}`),
      bodyText: String(audit.outreach_message),
      source: "saved_live_lead",
      metadata: { queuedFrom: "autonomous_live_leads", sourceStatus: "live" },
    });

    results.push({ email, businessName: lead.business_name, ...queue, brevo });
  }

  return {
    ok: true,
    queued: results.filter((result) => result.queued).length,
    skipped: results.filter((result) => result.skipped).length,
    brevoSynced: results.filter((result) => result.brevo?.synced === true).length,
    brevoFailed: results.filter((result) => brevoSyncFailed(result.brevo)).length,
    results,
  };
}

export async function runOutreachAutomation(options: { queueLimit?: number; sendLimit?: number } = {}) {
  configureAutonomousOutreach();
  const queueLimit = boundedLimit(options.queueLimit ?? Number(process.env.OUTREACH_AUTOMATION_QUEUE_LIMIT || "50"), 50);
  const sendLimit = boundedLimit(options.sendLimit ?? Number(process.env.OUTREACH_AUTOMATION_SEND_LIMIT || String(queueLimit)), queueLimit);

  const queue = await queueEligibleSavedLeads(queueLimit);
  const delivery = await sendQueuedOutreachHardCapped(sendLimit);

  return {
    ok: queue.ok && !delivery.error,
    queue,
    delivery,
  };
}
