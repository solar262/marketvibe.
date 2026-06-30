import crypto from "crypto";
import { getSupabaseAdmin, supabaseConnectionStatus } from "./supabase";

export type OutreachProvider = "resend" | "brevo" | "sendgrid";

type QueueInput = {
  leadId?: string;
  auditId?: string;
  recipientEmail: string;
  recipientName?: string;
  businessName?: string;
  website?: string;
  contactPageUrl?: string;
  subject: string;
  bodyText: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

const MESSAGE_SEND_TIMEOUT_MS = 15000;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || "http://localhost:3000";
}

function unsubscribeToken(email: string) {
  const secret = process.env.OUTREACH_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "marketvibe-dev";
  return crypto.createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex").slice(0, 32);
}

function unsubscribeUrl(email: string) {
  const url = new URL("/api/outreach/unsubscribe", appUrl());
  url.searchParams.set("email", normalizeEmail(email));
  url.searchParams.set("token", unsubscribeToken(email));
  return url.toString();
}

export function verifyUnsubscribeToken(email: string, token: string) {
  return unsubscribeToken(email) === token;
}

export function outreachConfig() {
  const provider = (process.env.OUTREACH_EMAIL_PROVIDER || "").toLowerCase() as OutreachProvider | "";
  const providerKeys = {
    resend: Boolean(process.env.RESEND_API_KEY),
    brevo: Boolean(process.env.BREVO_API_KEY),
    sendgrid: Boolean(process.env.SENDGRID_API_KEY),
  };
  const providerReady = provider === "resend" || provider === "brevo" || provider === "sendgrid" ? providerKeys[provider] : false;
  const fromEmail = process.env.OUTREACH_FROM_EMAIL || "";
  const fromName = process.env.OUTREACH_FROM_NAME || "MarketVibe";
  const replyTo = process.env.OUTREACH_REPLY_TO || fromEmail;
  const dailyLimit = Number(process.env.OUTREACH_DAILY_SEND_LIMIT || "0");
  const enabled = process.env.OUTREACH_EMAIL_ENABLED === "true" && providerReady && Boolean(fromEmail) && dailyLimit > 0;

  return {
    enabled,
    provider: provider || null,
    providerReady,
    fromEmail,
    fromName,
    replyTo,
    dailyLimit,
    supabase: supabaseConnectionStatus(),
    automaticSendingDefault: false,
    missing: {
      provider: !provider,
      providerKey: Boolean(provider) && !providerReady,
      fromEmail: !fromEmail,
      dailyLimit: dailyLimit <= 0,
      enabledFlag: process.env.OUTREACH_EMAIL_ENABLED !== "true",
    },
  };
}

function appendComplianceFooter(bodyText: string, email: string) {
  return `${bodyText.trim()}\n\nYou are receiving this because this address appears as a public business contact. If you do not want further emails, unsubscribe here: ${unsubscribeUrl(email)}`;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = MESSAGE_SEND_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function addSuppression(email: string, reason = "unsubscribe", source = "api") {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Supabase server writes are not configured." };
  const normalized = normalizeEmail(email);
  const { error } = await supabase.from("outreach_suppression").upsert({
    email,
    email_normalized: normalized,
    reason,
    source,
  }, { onConflict: "email_normalized" });

  if (!error) {
    await supabase.from("buyer_prospects").update({ status: "suppressed" }).eq("email_normalized", normalized);
  }

  return { ok: !error, error: error?.message };
}

export async function queueOutreach(input: QueueInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { queued: false, skipped: true, reason: "Supabase server writes are not configured." };

  const normalized = normalizeEmail(input.recipientEmail);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return { queued: false, skipped: true, reason: "Invalid email address." };
  }

  const { data: suppressed } = await supabase
    .from("outreach_suppression")
    .select("id")
    .eq("email_normalized", normalized)
    .maybeSingle();
  if (suppressed) return { queued: false, skipped: true, reason: "Contact is suppressed or unsubscribed." };

  const { data: existingQueue } = await supabase
    .from("outreach_queue")
    .select("id,status")
    .eq("recipient_email_normalized", normalized)
    .in("status", ["pending", "sending", "sent"])
    .limit(1);
  if (existingQueue && existingQueue.length > 0) {
    return { queued: false, skipped: true, reason: "Duplicate outreach already exists for this contact." };
  }

  const { data: prospect, error: prospectError } = await supabase
    .from("buyer_prospects")
    .upsert({
      lead_id: input.leadId || null,
      email: input.recipientEmail,
      email_normalized: normalized,
      business_name: input.businessName || input.recipientName || null,
      website: input.website || null,
      contact_page_url: input.contactPageUrl || null,
      source: input.source || "saved_lead",
      status: "active",
      metadata: input.metadata || {},
    }, { onConflict: "email_normalized" })
    .select("id")
    .single();

  if (prospectError || !prospect) return { queued: false, skipped: false, reason: prospectError?.message || "Prospect could not be saved." };

  const { data: queueRow, error: queueError } = await supabase
    .from("outreach_queue")
    .insert({
      prospect_id: prospect.id,
      lead_id: input.leadId || null,
      audit_id: input.auditId || null,
      recipient_email: input.recipientEmail,
      recipient_email_normalized: normalized,
      recipient_name: input.recipientName || input.businessName || null,
      subject: input.subject,
      body_text: appendComplianceFooter(input.bodyText, normalized),
      status: "pending",
      metadata: input.metadata || {},
    })
    .select("id")
    .single();

  if (queueError || !queueRow) return { queued: false, skipped: false, reason: queueError?.message || "Outreach could not be queued." };
  return { queued: true, skipped: false, queueId: queueRow.id };
}

async function sendViaProvider({
  provider,
  to,
  subject,
  text,
}: {
  provider: OutreachProvider;
  to: string;
  subject: string;
  text: string;
}) {
  const config = outreachConfig();
  const from = `${config.fromName} <${config.fromEmail}>`;

  if (provider === "resend") {
    const response = await fetchWithTimeout("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to, subject, text, reply_to: config.replyTo }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || `Resend error ${response.status}`);
    return String(data?.id || "");
  }

  if (provider === "brevo") {
    const response = await fetchWithTimeout("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY || "", "content-type": "application/json" },
      body: JSON.stringify({
        sender: { name: config.fromName, email: config.fromEmail },
        to: [{ email: to }],
        replyTo: { email: config.replyTo },
        subject,
        textContent: text,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || `Brevo error ${response.status}`);
    return String(data?.messageId || "");
  }

  const response = await fetchWithTimeout("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: config.fromEmail, name: config.fromName },
      reply_to: { email: config.replyTo },
      subject,
      content: [{ type: "text/plain", value: text }],
    }),
  });
  if (!response.ok) {
    const textBody = await response.text().catch(() => "");
    throw new Error(textBody || `SendGrid error ${response.status}`);
  }
  return response.headers.get("x-message-id") || "";
}

export async function sendQueuedOutreach(maxToSend?: number) {
  const config = outreachConfig();
  if (!config.enabled || !config.provider) {
    return { sent: 0, skipped: true, error: "Email sending is disabled until provider key, sender email/domain, daily limit, and OUTREACH_EMAIL_ENABLED=true are configured." };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { sent: 0, skipped: true, error: "Supabase server writes are not configured." };

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await supabase
    .from("outreach_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", since.toISOString());
  const remaining = Math.max(0, config.dailyLimit - (sentToday || 0));
  const limit = Math.min(remaining, maxToSend || remaining);
  if (limit <= 0) return { sent: 0, skipped: true, error: "Daily send limit reached." };

  const { data: rows, error } = await supabase
    .from("outreach_queue")
    .select("*")
    .eq("status", "pending")
    .order("queued_at", { ascending: true })
    .limit(limit);
  if (error || !rows) return { sent: 0, skipped: true, error: error?.message || "Queue could not be read." };

  let sent = 0;
  for (const row of rows) {
    const normalized = String(row.recipient_email_normalized);
    const { data: suppressed } = await supabase.from("outreach_suppression").select("id").eq("email_normalized", normalized).maybeSingle();
    if (suppressed) {
      await supabase.from("outreach_queue").update({ status: "skipped", error_message: "Suppressed contact", last_attempt_at: new Date().toISOString() }).eq("id", row.id);
      continue;
    }

    await supabase.from("outreach_queue").update({ status: "sending", provider: config.provider, last_attempt_at: new Date().toISOString() }).eq("id", row.id);
    try {
      const providerMessageId = await sendViaProvider({
        provider: config.provider,
        to: String(row.recipient_email),
        subject: String(row.subject),
        text: String(row.body_text),
      });
      await supabase.from("outreach_queue").update({
        status: "sent",
        provider: config.provider,
        provider_message_id: providerMessageId,
        sent_at: new Date().toISOString(),
      }).eq("id", row.id);
      sent += 1;
    } catch (sendError) {
      await supabase.from("outreach_queue").update({
        status: "failed",
        error_message: sendError instanceof Error ? sendError.message : "Unknown provider error",
        last_attempt_at: new Date().toISOString(),
      }).eq("id", row.id);
    }
  }

  return { sent, skipped: false };
}

export async function getOutreachStats() {
  const supabase = getSupabaseAdmin();
  const config = outreachConfig();
  if (!supabase) {
    return { config, connected: false, counts: {}, latest: [], error: "Supabase server writes are not configured." };
  }

  const [pending, sent, failed, suppressed, prospects, latest] = await Promise.all([
    supabase.from("outreach_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("outreach_queue").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("outreach_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("outreach_suppression").select("id", { count: "exact", head: true }),
    supabase.from("buyer_prospects").select("id", { count: "exact", head: true }),
    supabase.from("outreach_queue").select("id,recipient_email,subject,status,error_message,queued_at,sent_at").order("queued_at", { ascending: false }).limit(8),
  ]);

  return {
    config,
    connected: !pending.error && !sent.error && !failed.error && !suppressed.error && !prospects.error,
    counts: {
      pending: pending.count || 0,
      sent: sent.count || 0,
      failed: failed.count || 0,
      suppressed: suppressed.count || 0,
      prospects: prospects.count || 0,
    },
    latest: latest.data || [],
    error: pending.error?.message || sent.error?.message || failed.error?.message || suppressed.error?.message || prospects.error?.message || latest.error?.message,
  };
}

