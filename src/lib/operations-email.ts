import { createHmac, timingSafeEqual } from "node:crypto";
import { sendTransactionalEmail } from "@/lib/brevo";
import { processDueSalesEmails, stopSalesFollowUps } from "@/lib/sales-pipeline";
import type { getSupabaseAdmin } from "@/lib/supabase";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
type EmailPayload = Record<string, unknown> & { data?: Record<string, unknown> };

export type ReplyClassification = "positive" | "meeting_request" | "objection" | "negative" | "unsubscribe" | "out_of_office" | "referral" | "unknown";

function clean(value: unknown, max = 8_000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeEmail(value: unknown) {
  const text = clean(value, 320).toLowerCase();
  const bracket = text.match(/<([^>]+)>/)?.[1];
  return clean(bracket || text, 254).toLowerCase();
}

function bearerAuthorized(request: Request) {
  const expected = process.env.EMAIL_WEBHOOK_SECRET || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

function verifySvix(request: Request, rawBody: string) {
  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  const id = request.headers.get("svix-id") || "";
  const timestamp = request.headers.get("svix-timestamp") || "";
  const signatureHeader = request.headers.get("svix-signature") || "";
  if (!secret || !id || !timestamp || !signatureHeader) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;
  try {
    const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
    return signatureHeader.split(" ").some((entry) => {
      const supplied = entry.replace(/^v1,/, "");
      return supplied.length === expected.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
    });
  } catch {
    return false;
  }
}

export function emailWebhookAuthorized(request: Request, rawBody: string) {
  return bearerAuthorized(request) || verifySvix(request, rawBody);
}

export function classifyReply(bodyValue: unknown): ReplyClassification {
  const body = clean(bodyValue).toLowerCase();
  if (!body) return "unknown";
  if (/\b(unsubscribe|remove me|stop emailing|do not contact|don't contact|opt out)\b/.test(body)) return "unsubscribe";
  if (/\b(out of (?:the )?office|automatic reply|auto[ -]?reply|on (?:annual )?leave|away until)\b/.test(body)) return "out_of_office";
  if (/\b(book|calendar|calendly|meeting|call|demo|schedule|available (?:on|at)|speak)\b/.test(body) && /\b(yes|interested|please|let'?s|can we|could we|would like)\b/.test(body)) return "meeting_request";
  if (/\b(not interested|no thanks|no thank you|not for us|wrong person|don't need|do not need)\b/.test(body)) return "negative";
  if (/\b(yes|interested|sounds good|tell me more|send (?:me )?(?:details|information)|worth a look|happy to discuss)\b/.test(body)) return "positive";
  if (/\b(contact|speak to|reach out to|forwarded|cc'?d|colleague|handles this)\b/.test(body)) return "referral";
  if (/\b(price|pricing|budget|already use|competitor|how does|what does|concern|but|however)\b/.test(body)) return "objection";
  return "unknown";
}

function webhookEventType(payload: EmailPayload) {
  return clean(payload.event || payload.type || payload["event-type"] || payload.data?.event, 100);
}

function webhookMessageId(payload: EmailPayload) {
  return clean(payload["message-id"] || payload.messageId || payload.message_id || payload.data?.email_id || payload.data?.message_id, 500);
}

function webhookRecipient(payload: EmailPayload) {
  const to = payload.email || payload.to || payload.data?.to;
  return normalizeEmail(Array.isArray(to) ? to[0] : to);
}

function webhookExternalId(request: Request, payload: EmailPayload) {
  return clean(request.headers.get("svix-id") || payload.id || `${webhookEventType(payload)}:${webhookMessageId(payload)}:${payload.ts_event || payload.created_at || ""}`, 500);
}

async function alreadyProcessed(supabase: SupabaseClient, externalId: string) {
  if (!externalId) return false;
  const { count } = await supabase
    .from("marketvibe_audit_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "email_provider_webhook_received")
    .contains("event_payload", { external_id: externalId });
  return Boolean(count);
}

async function findSalesEmailEvent(supabase: SupabaseClient, messageId: string, email: string) {
  if (messageId) {
    const exact = await supabase.from("sales_email_events").select("*").eq("provider_message_id", messageId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (exact.data) return exact.data;
  }
  if (!email) return null;
  const fallback = await supabase.from("sales_email_events").select("*").eq("normalized_email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return fallback.data || null;
}

async function suppressAddress(supabase: SupabaseClient, input: { email: string; reason: string; source: string; leadId?: string | null }) {
  if (!input.email) return;
  const lead = input.leadId
    ? await supabase.from("sales_leads").select("region").eq("id", input.leadId).maybeSingle()
    : { data: null };
  await supabase.from("sales_suppression_list").upsert({
    normalized_email: input.email,
    reason: input.reason,
    region: lead.data?.region || "OTHER",
    source: input.source,
  }, { onConflict: "normalized_email" });
  await supabase.from("marketvibe_suppression_records").upsert({
    suppression_key: `email:${input.email}`,
    suppression_type: input.reason === "hard_bounce" ? "hard_bounce" : input.reason === "spam" ? "complaint" : "unsubscribe",
    reason: input.reason,
    source: input.source,
    active: true,
  }, { onConflict: "suppression_key" });
  await supabase.from("sales_email_events").update({ status: "skipped", failure_reason: input.reason }).eq("normalized_email", input.email).eq("status", "queued");
  await supabase.from("sales_leads").update({
    is_suppressed: true,
    outbound_sequence_status: "stopped",
    updated_at: new Date().toISOString(),
  }).eq("normalized_email", input.email);
}

async function recordProviderEvent(supabase: SupabaseClient, input: {
  externalId: string;
  eventType: string;
  messageId: string;
  email: string;
  event: Record<string, unknown> | null;
  payload: EmailPayload;
}) {
  await supabase.from("marketvibe_outreach_events").insert({
    outreach_draft_id: null,
    event_type: input.eventType || "unknown",
    event_payload: {
      external_id: input.externalId,
      provider_message_id: input.messageId,
      email: input.email,
      sales_email_event_id: input.event?.id || null,
      payload: input.payload,
    },
  });
  await supabase.from("marketvibe_audit_events").insert({
    event_type: "email_provider_webhook_received",
    actor_type: "provider",
    related_record_type: input.event?.lead_id ? "sales_lead" : null,
    related_record_id: input.event?.lead_id || null,
    source_state: String(input.event?.status || "unknown"),
    destination_state: input.eventType,
    reason: `Email provider reported ${input.eventType || "an unknown event"}.`,
    event_payload: {
      external_id: input.externalId,
      provider_message_id: input.messageId,
      email: input.email,
      sales_email_event_id: input.event?.id || null,
    },
  });
}

async function retrieveResendInbound(payload: EmailPayload) {
  const id = clean(payload.data?.email_id, 500);
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || "";
  if (!id || !apiKey) return null;
  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  return await response.json() as Record<string, unknown>;
}

function inboundMessage(payload: EmailPayload, retrieved?: Record<string, unknown> | null) {
  const data = retrieved || payload.data || payload;
  const from = normalizeEmail(data.from || payload.from || payload.sender);
  const body = clean(data.text || data.textBody || data.RawTextBody || data.html || data.HtmlBody || data.RawHtmlBody || payload.text || payload.body);
  const subject = clean(data.subject || payload.subject, 500);
  return { from, body, subject };
}

async function processInboundReply(supabase: SupabaseClient, payload: EmailPayload) {
  const retrieved = webhookEventType(payload) === "email.received" ? await retrieveResendInbound(payload) : null;
  const inbound = inboundMessage(payload, retrieved);
  if (!inbound.from || !inbound.body) return { processed: false, reason: "inbound_message_missing_sender_or_body" };
  const { data: lead } = await supabase.from("sales_leads").select("*").eq("normalized_email", inbound.from).maybeSingle();
  const classification = classifyReply(inbound.body);
  await supabase.from("marketvibe_replies").insert({
    outreach_draft_id: null,
    sender: inbound.from,
    body: inbound.body,
    classification,
    received_at: new Date().toISOString(),
  });

  if (!lead) {
    await supabase.from("marketvibe_exceptions").insert({
      category: "unmatched_reply",
      title: `Unmatched email reply from ${inbound.from}`,
      explanation: "An authenticated inbound email could not be matched to a MarketVibe sales lead.",
      supporting_evidence: { sender: inbound.from, subject: inbound.subject, classification },
      recommended_action: "Review the sender and connect the reply to the correct sales record if appropriate.",
      commercial_impact: "A potential buyer reply may otherwise be missed.",
      severity: classification === "positive" || classification === "meeting_request" ? "high" : "medium",
    });
    return { processed: true, matched: false, classification };
  }

  const stopSequence = classification !== "out_of_office";
  if (stopSequence) {
    await stopSalesFollowUps({ email: inbound.from, reason: `reply:${classification}` });
  }
  if (classification === "unsubscribe") {
    await suppressAddress(supabase, { email: inbound.from, reason: "unsubscribed", source: "inbound_reply", leadId: lead.id });
  } else if (classification === "negative") {
    await supabase.from("sales_leads").update({ stage: "lost", lost_reason: "negative_reply", outbound_sequence_status: "stopped", updated_at: new Date().toISOString() }).eq("id", lead.id);
  } else if (["positive", "meeting_request", "objection", "referral"].includes(classification)) {
    await supabase.from("sales_leads").update({ stage: "interested", outbound_sequence_status: "stopped", last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", lead.id);
  }

  const bookingUrl = clean(process.env.MARKETVIBE_BOOKING_URL, 1000);
  if ((classification === "positive" || classification === "meeting_request") && bookingUrl) {
    await sendTransactionalEmail({
      to: inbound.from,
      subject: inbound.subject ? `Re: ${inbound.subject.replace(/^re:\s*/i, "")}` : "Choose a time with MarketVibe",
      htmlContent: `<p>Thanks for getting back to me.</p><p>You can choose a suitable time here: <a href="${bookingUrl}">${bookingUrl}</a></p><p>MarketVibe</p>`,
      textContent: `Thanks for getting back to me.\n\nChoose a suitable time: ${bookingUrl}\n\nMarketVibe`,
    });
  } else if (["unknown", "objection", "referral"].includes(classification)) {
    await supabase.from("marketvibe_exceptions").insert({
      category: "sales_reply",
      title: `${classification.replaceAll("_", " ")} reply from ${inbound.from}`,
      explanation: inbound.body.slice(0, 1500),
      affected_record_type: "sales_lead",
      affected_record_id: lead.id,
      supporting_evidence: { subject: inbound.subject, classification },
      recommended_action: "Review the reply context before sending a non-standard response.",
      commercial_impact: "A qualified prospect has replied and may require contextual handling.",
      severity: classification === "objection" || classification === "referral" ? "high" : "medium",
    });
  }
  await supabase.from("marketvibe_audit_events").insert({
    event_type: "sales_reply_classified",
    actor_type: "system",
    related_record_type: "sales_lead",
    related_record_id: lead.id,
    source_state: lead.stage,
    destination_state: classification,
    reason: `Authenticated inbound email classified as ${classification}.`,
    event_payload: { subject: inbound.subject, sender: inbound.from },
  });
  return { processed: true, matched: true, classification };
}

export async function processEmailProviderWebhook({
  supabase,
  request,
  payload,
}: {
  supabase: SupabaseClient;
  request: Request;
  payload: EmailPayload;
}) {
  const externalId = webhookExternalId(request, payload);
  if (await alreadyProcessed(supabase, externalId)) return { ok: true, duplicate: true };
  const type = webhookEventType(payload);
  if (["inbound", "inboundEmailProcessed", "email.received"].includes(type)) {
    const reply = await processInboundReply(supabase, payload);
    await recordProviderEvent(supabase, { externalId, eventType: type, messageId: webhookMessageId(payload), email: inboundMessage(payload).from, event: null, payload });
    return { ok: true, duplicate: false, type, reply };
  }

  const messageId = webhookMessageId(payload);
  const email = webhookRecipient(payload);
  const event = await findSalesEmailEvent(supabase, messageId, email);
  const normalizedType = type.toLowerCase();
  if (event && /hardbounce|hard_bounce|bounced|invalid|blocked|failed|spam|complained/.test(normalizedType)) {
    await supabase.from("sales_email_events").update({ status: "failed", failure_reason: type }).eq("id", event.id);
    if (/hardbounce|hard_bounce|bounced|invalid|spam|complained/.test(normalizedType)) {
      await suppressAddress(supabase, {
        email: normalizeEmail(event.normalized_email || event.email || email),
        reason: /spam|complained/.test(normalizedType) ? "spam" : "hard_bounce",
        source: "email_provider_webhook",
        leadId: event.lead_id,
      });
    }
  }
  if (event && /unsubscribed|suppressed/.test(normalizedType)) {
    await suppressAddress(supabase, { email: normalizeEmail(event.normalized_email || event.email || email), reason: "unsubscribed", source: "email_provider_webhook", leadId: event.lead_id });
  }
  await recordProviderEvent(supabase, { externalId, eventType: type, messageId, email, event, payload });
  return { ok: true, duplicate: false, type, matched: Boolean(event) };
}

function transientFailure(reason: unknown) {
  return /timeout|429|rate|temporar|network|fetch|5\d\d|deferred|quota/i.test(clean(reason));
}

export async function retryTransientEmailFailures({ supabase, limit = 25 }: { supabase: SupabaseClient; limit?: number }) {
  const since = new Date(Date.now() - 72 * 60 * 60_000).toISOString();
  const { data, error } = await supabase.from("sales_email_events").select("*").eq("status", "failed").gte("created_at", since).order("created_at", { ascending: true }).limit(limit);
  if (error) throw error;
  let scheduled = 0;
  let permanent = 0;
  for (const event of data || []) {
    const { count } = await supabase.from("marketvibe_audit_events").select("id", { count: "exact", head: true }).eq("event_type", "sales_email_retry_scheduled").eq("related_record_id", event.id);
    const attempts = count || 0;
    if (transientFailure(event.failure_reason) && attempts < 3) {
      await supabase.from("sales_email_events").update({
        status: "queued",
        scheduled_at: new Date(Date.now() + 2 ** attempts * 30 * 60_000).toISOString(),
        failure_reason: null,
      }).eq("id", event.id);
      await supabase.from("marketvibe_audit_events").insert({
        event_type: "sales_email_retry_scheduled",
        actor_type: "system",
        related_record_type: "sales_email_event",
        related_record_id: event.id,
        source_state: "failed",
        destination_state: "queued",
        reason: "Transient email-provider failure scheduled with exponential backoff.",
        retry_count: attempts + 1,
      });
      scheduled += 1;
    } else {
      await stopSalesFollowUps({
        email: String(event.normalized_email || event.email || ""),
        reason: `permanent_failure:${clean(event.failure_reason, 300) || "email_delivery"}`,
      });
      const existing = await supabase.from("marketvibe_exceptions").select("id").eq("category", "email_delivery").eq("affected_record_id", event.id).eq("status", "open").maybeSingle();
      if (!existing.data) await supabase.from("marketvibe_exceptions").insert({
        category: "email_delivery",
        title: `Email delivery permanently failed for ${event.normalized_email}`,
        explanation: clean(event.failure_reason) || "Email provider returned a permanent failure.",
        affected_record_type: "sales_email_event",
        affected_record_id: event.id,
        supporting_evidence: { provider_message_id: event.provider_message_id, attempts },
        recommended_action: "Review sender reputation, provider status and recipient suppression before retrying.",
        commercial_impact: "A scheduled sales or lifecycle message was not delivered.",
        severity: "high",
      });
      permanent += 1;
    }
  }
  return { examined: data?.length || 0, scheduled, permanent };
}

export async function runEmailOperations({ supabase, limit = 50 }: { supabase: SupabaseClient; limit?: number }) {
  const retries = await retryTransientEmailFailures({ supabase, limit: Math.min(limit, 25) });
  const execution = await processDueSalesEmails({ limit });
  const health = execution.failed > 0 ? "Degraded" : "Operational";
  await supabase.from("marketvibe_system_health_snapshots").insert({
    service_name: "email_operations",
    health_status: health,
    health_message: `${execution.sent} sent, ${execution.skipped} skipped, ${execution.failed} failed in this run.`,
    metrics: { execution, retries },
  });
  await supabase.from("marketvibe_provider_configurations").update({
    enabled: true,
    credential_state: "configured",
    health_status: health,
    health_message: `${execution.sent} sent, ${execution.failed} failed in latest execution.`,
    last_attempted_run: new Date().toISOString(),
    ...(execution.failed === 0 ? { last_successful_run: new Date().toISOString() } : {}),
    updated_at: new Date().toISOString(),
  }).eq("provider_identifier", "email_provider");
  return { ok: execution.failed === 0, retries, execution };
}
