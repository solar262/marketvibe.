import { addContactToMarketVibeList } from "./brevo";
import { queueOutreach, sendQueuedOutreach } from "./outreach";
import { getSupabaseAdmin } from "./supabase";

function boundedLimit(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(Math.floor(value), 100));
}

export async function queueEligibleSavedLeads(limit = 25) {
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

  const safeLimit = boundedLimit(limit, 25);
  const { data, error } = await supabase
    .from("leads")
    .select("id,business_name,website,contact_page_url,public_email,audits(id,subject_line,outreach_message)")
    .not("public_email", "is", null)
    .limit(safeLimit);

  if (error || !data) {
    return {
      ok: false,
      queued: 0,
      skipped: 0,
      brevoSynced: 0,
      brevoFailed: 0,
      error: error?.message || "Saved leads could not be read.",
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
      source: "saved_lead",
      metadata: { queuedFrom: "autonomous_saved_leads" },
    });

    results.push({ email, businessName: lead.business_name, ...queue, brevo });
  }

  return {
    ok: true,
    queued: results.filter((result) => result.queued).length,
    skipped: results.filter((result) => result.skipped).length,
    brevoSynced: results.filter((result) => result.brevo?.synced === true).length,
    brevoFailed: results.filter((result) => result.brevo?.synced === false && result.brevo?.error).length,
    results,
  };
}

export async function runOutreachAutomation(options: { queueLimit?: number; sendLimit?: number } = {}) {
  const queueLimit = boundedLimit(options.queueLimit ?? Number(process.env.OUTREACH_AUTOMATION_QUEUE_LIMIT || "25"), 25);
  const sendLimit = boundedLimit(options.sendLimit ?? Number(process.env.OUTREACH_AUTOMATION_SEND_LIMIT || String(queueLimit)), queueLimit);

  const queue = await queueEligibleSavedLeads(queueLimit);
  const delivery = await sendQueuedOutreach(sendLimit);

  return {
    ok: queue.ok && !delivery.error,
    queue,
    delivery,
  };
}
