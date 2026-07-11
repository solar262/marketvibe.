import { getSupabaseAdmin } from "@/lib/supabase";
import { sendSendGridEmail } from "@/lib/sendgrid";
import type { LeadVaultRow } from "@/lib/proof-pack-delivery";

export const DAILY_RADAR_SQL = "SELECT * FROM lead_vault WHERE created_at >= now() - interval '24 hours' AND intent_score >= 85 ORDER BY intent_score DESC LIMIT 30";

function radarRecipient() {
  return (
    process.env.DAILY_RADAR_EMAIL_TO ||
    process.env.RADAR_DAILY_EMAIL_TO ||
    process.env.ADMIN_EMAIL ||
    process.env.OUTREACH_FROM_EMAIL ||
    ""
  ).trim();
}

function dayAgo(now = new Date()) {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
}

export async function getDailyRadarLeads(now = new Date()) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { leads: [] as LeadVaultRow[], since: dayAgo(now), skipped: true, reason: "Supabase server writes are not configured." };

  const since = dayAgo(now);
  const { data, error } = await supabase
    .from("lead_vault")
    .select("*")
    .gte("created_at", since)
    .gte("intent_score", 85)
    .order("intent_score", { ascending: false })
    .limit(30);

  if (error) throw error;
  return { leads: (data || []) as LeadVaultRow[], since, skipped: false, reason: "" };
}

async function recordRadarEmailRun(input: {
  status: "sent" | "failed" | "skipped";
  leadCount: number;
  recipientEmail: string;
  templateId: string;
  providerMessageId?: string;
  error?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from("radar_email_runs").insert({
    status: input.status,
    lead_count: input.leadCount,
    recipient_email: input.recipientEmail || null,
    template_id: input.templateId || null,
    provider_message_id: input.providerMessageId || null,
    query_sql: DAILY_RADAR_SQL,
    error_summary: input.error ? { message: input.error } : {},
    sent_at: input.status === "sent" ? new Date().toISOString() : null,
  });
}

export async function sendDailyRadarEmail(now = new Date()) {
  const templateId = (process.env.SENDGRID_DAILY_RADAR_TEMPLATE_ID || process.env.DAILY_RADAR_SENDGRID_TEMPLATE_ID || "").trim();
  const recipientEmail = radarRecipient();
  const radar = await getDailyRadarLeads(now);

  if (radar.skipped) {
    return { ok: false, skipped: true, sent: false, leadCount: 0, reason: radar.reason };
  }

  if (!templateId) {
    await recordRadarEmailRun({
      status: "skipped",
      leadCount: radar.leads.length,
      recipientEmail,
      templateId,
      error: "SENDGRID_DAILY_RADAR_TEMPLATE_ID is not configured.",
    });
    return { ok: false, skipped: true, sent: false, leadCount: radar.leads.length, reason: "SENDGRID_DAILY_RADAR_TEMPLATE_ID is not configured." };
  }

  const result = await sendSendGridEmail({
    to: recipientEmail,
    templateId,
    dynamicTemplateData: {
      generated_at: now.toISOString(),
      since: radar.since,
      lead_count: radar.leads.length,
      leads: radar.leads,
    },
  });

  if (result.ok) {
    await recordRadarEmailRun({
      status: "sent",
      leadCount: radar.leads.length,
      recipientEmail,
      templateId,
      providerMessageId: result.messageId,
    });
    return { ok: true, skipped: false, sent: true, leadCount: radar.leads.length, messageId: result.messageId };
  }

  await recordRadarEmailRun({
    status: result.skipped ? "skipped" : "failed",
    leadCount: radar.leads.length,
    recipientEmail,
    templateId,
    error: result.error,
  });
  return { ok: false, skipped: result.skipped, sent: false, leadCount: radar.leads.length, reason: result.error };
}
