import { createHmac, randomUUID } from "node:crypto";

import { assertSafePublicUrl } from "@/lib/sales-navigator-import";
import type { getSupabaseAdmin } from "@/lib/supabase";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

export const MARKETVIBE_NERVE_TOPICS = [
  "opportunity.qualified",
  "navigator.import.completed",
  "navigator.import.failed",
  "import.completed",
  "import.failed",
  "delivery.completed",
  "delivery.failed",
  "revenue.recorded",
  "automation.failed",
] as const;

export type MarketVibeNerveTopic = (typeof MARKETVIBE_NERVE_TOPICS)[number];

type OutboxRow = {
  id: string;
  event_key: string;
  topic: MarketVibeNerveTopic;
  schema_version: number;
  payload: Record<string, unknown>;
  attempt_count: number;
  max_attempts: number;
  occurred_at: string;
};

type NerveCenterEnvelope = {
  event_id: string;
  topic: MarketVibeNerveTopic;
  occurred_at: string;
  schema_version: 1;
  data: Record<string, unknown>;
};

type DispatchResult = {
  configured: boolean;
  enabled: boolean;
  claimed: number;
  delivered: number;
  retryScheduled: number;
  deadLetters: number;
  failed: number;
};

function clean(value: unknown, max = 2_000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function databaseError(context: string, error: { message?: string } | null | undefined): never {
  throw new Error(`${context}: ${clean(error?.message || "database operation failed", 500)}`);
}

export function signNerveCenterPayload(rawBody: string, timestamp: string, secret: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function buildNerveCenterEnvelope(row: OutboxRow): NerveCenterEnvelope {
  return {
    event_id: row.event_key,
    topic: row.topic,
    occurred_at: row.occurred_at,
    schema_version: 1,
    data: asRecord(row.payload),
  };
}

export function nerveCenterRetryDelayMs(attemptCount: number) {
  const attempt = Math.max(1, Math.trunc(attemptCount));
  return Math.min(30_000 * 2 ** (attempt - 1), 6 * 60 * 60_000);
}

export function responseRequiresDeadLetter(status: number) {
  if (status === 408 || status === 409 || status === 425 || status === 429) return false;
  return status >= 400 && status < 500;
}

function configuration() {
  const url = clean(process.env.MARKETVIBE_NERVE_CENTER_WEBHOOK_URL, 1_000);
  const secret = String(process.env.MARKETVIBE_NERVE_CENTER_SECRET ?? "").trim();
  const enabled = process.env.MARKETVIBE_NERVE_CENTER_ENABLED === "true";
  return { url, secret, enabled, configured: Boolean(url && secret) };
}

async function recordAudit(supabase: SupabaseClient, input: {
  eventType: string;
  row: OutboxRow;
  state: string;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  const result = await supabase.from("marketvibe_audit_events").insert({
    event_type: input.eventType,
    actor_type: "system",
    related_record_type: "operations_outbox",
    related_record_id: input.row.id,
    destination_state: input.state,
    reason: input.reason,
    retry_count: input.row.attempt_count,
    event_payload: {
      event_key: input.row.event_key,
      topic: input.row.topic,
      ...(input.metadata ?? {}),
    },
  });
  if (result.error) databaseError("Could not write nerve-center audit", result.error);
}

async function updateProviderHealth(supabase: SupabaseClient, input: {
  status: "Operational" | "Degraded" | "Blocked";
  message: string;
  success?: boolean;
}) {
  const now = new Date().toISOString();
  const result = await supabase.from("marketvibe_provider_configurations").update({
    enabled: input.status !== "Blocked",
    credential_state: input.status === "Blocked" ? "not_configured" : "configured",
    health_status: input.status,
    health_message: input.message,
    last_attempted_run: now,
    ...(input.success ? { last_successful_run: now } : {}),
    updated_at: now,
  }).eq("provider_identifier", "business_nerve_center");
  if (result.error) databaseError("Could not update nerve-center provider health", result.error);
}

async function markDelivered(supabase: SupabaseClient, row: OutboxRow, responseStatus: number) {
  const now = new Date().toISOString();
  const result = await supabase.from("marketvibe_operations_outbox").update({
    status: "delivered",
    delivered_at: now,
    response_status: responseStatus,
    last_error: null,
    locked_at: null,
    locked_by: null,
    updated_at: now,
  }).eq("id", row.id).eq("status", "sending");
  if (result.error) databaseError("Could not complete nerve-center outbox event", result.error);
  await recordAudit(supabase, {
    eventType: "nerve_center_event_delivered",
    row,
    state: "delivered",
    reason: "Signed MarketVibe operations event was accepted by the owner control plane.",
    metadata: { response_status: responseStatus },
  });
  await supabase.from("marketvibe_exceptions").update({
    status: "resolved",
    updated_at: now,
  }).eq("category", "nerve_center_delivery").eq("affected_record_id", row.id).eq("status", "open");
}

async function markFailed(supabase: SupabaseClient, row: OutboxRow, input: {
  message: string;
  responseStatus?: number;
  permanent?: boolean;
}) {
  const exhausted = row.attempt_count >= row.max_attempts;
  const deadLetter = Boolean(input.permanent || exhausted);
  const now = new Date();
  const nextAttemptAt = new Date(now.getTime() + nerveCenterRetryDelayMs(row.attempt_count)).toISOString();
  const message = clean(input.message || "nerve_center_delivery_failed", 2_000);
  const result = await supabase.from("marketvibe_operations_outbox").update({
    status: deadLetter ? "dead_letter" : "retry_scheduled",
    next_attempt_at: nextAttemptAt,
    response_status: input.responseStatus ?? null,
    last_error: message,
    locked_at: null,
    locked_by: null,
    updated_at: now.toISOString(),
  }).eq("id", row.id).eq("status", "sending");
  if (result.error) databaseError("Could not reschedule nerve-center outbox event", result.error);

  await recordAudit(supabase, {
    eventType: deadLetter ? "nerve_center_event_dead_lettered" : "nerve_center_event_retry_scheduled",
    row,
    state: deadLetter ? "dead_letter" : "retry_scheduled",
    reason: message,
    metadata: {
      response_status: input.responseStatus ?? null,
      next_attempt_at: deadLetter ? null : nextAttemptAt,
    },
  });

  if (deadLetter) {
    const existing = await supabase.from("marketvibe_exceptions")
      .select("id")
      .eq("category", "nerve_center_delivery")
      .eq("affected_record_id", row.id)
      .eq("status", "open")
      .maybeSingle();
    if (existing.error) databaseError("Could not inspect nerve-center exception", existing.error);
    if (!existing.data) {
      const exception = await supabase.from("marketvibe_exceptions").insert({
        category: "nerve_center_delivery",
        title: `Owner control-plane event could not be delivered (${row.topic})`,
        explanation: message,
        affected_record_type: "operations_outbox",
        affected_record_id: row.id,
        supporting_evidence: {
          event_key: row.event_key,
          topic: row.topic,
          response_status: input.responseStatus ?? null,
          attempts: row.attempt_count,
        },
        recommended_action: "Verify the control-plane URL and shared signing secret, then replay this outbox event.",
        commercial_impact: "The owner dashboard may temporarily miss an operations observation; customer delivery continues independently.",
        severity: row.topic === "automation.failed" || row.topic === "delivery.failed" ? "high" : "medium",
      });
      if (exception.error) databaseError("Could not create nerve-center exception", exception.error);
    }
  }
  return deadLetter;
}

export async function runNerveCenterOutbox({
  supabase,
  limit = 25,
  workerId = `nerve-center:${randomUUID()}`,
  fetchImpl = fetch,
}: {
  supabase: SupabaseClient;
  limit?: number;
  workerId?: string;
  fetchImpl?: typeof fetch;
}): Promise<DispatchResult> {
  const config = configuration();
  const empty = { claimed: 0, delivered: 0, retryScheduled: 0, deadLetters: 0, failed: 0 };
  if (!config.enabled || !config.configured) {
    await updateProviderHealth(supabase, {
      status: "Blocked",
      message: config.configured
        ? "Signed operations feed is configured but intentionally disabled."
        : "Signed operations feed requires its webhook URL and shared secret.",
    });
    return { configured: config.configured, enabled: config.enabled, ...empty };
  }

  const destination = await assertSafePublicUrl(config.url);
  const claim = await supabase.rpc("claim_marketvibe_operations_outbox", {
    p_worker_id: workerId,
    p_limit: Math.min(Math.max(Math.trunc(limit), 1), 100),
    p_lease_seconds: 300,
  });
  if (claim.error) databaseError("Could not claim nerve-center outbox events", claim.error);
  const rows = (Array.isArray(claim.data) ? claim.data : []).map((value): OutboxRow => {
    const record = asRecord(value);
    return {
      id: clean(record.id, 100),
      event_key: clean(record.event_key, 300),
      topic: clean(record.topic, 100) as MarketVibeNerveTopic,
      schema_version: Number(record.schema_version || 1),
      payload: asRecord(record.payload),
      attempt_count: Number(record.attempt_count || 0),
      max_attempts: Number(record.max_attempts || 8),
      occurred_at: clean(record.occurred_at, 100),
    };
  });

  let delivered = 0;
  let retryScheduled = 0;
  let deadLetters = 0;
  for (const row of rows) {
    try {
      const body = JSON.stringify(buildNerveCenterEnvelope(row));
      const timestamp = String(Date.now());
      const response = await fetchImpl(destination, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-nerve-timestamp": timestamp,
          "x-nerve-signature": signNerveCenterPayload(body, timestamp, config.secret),
          "x-nerve-idempotency-key": row.event_key,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        const deadLetter = await markFailed(supabase, row, {
          message: `nerve_center_http_${response.status}`,
          responseStatus: response.status,
          permanent: responseRequiresDeadLetter(response.status),
        });
        if (deadLetter) deadLetters += 1;
        else retryScheduled += 1;
        continue;
      }
      await markDelivered(supabase, row, response.status);
      delivered += 1;
    } catch (error) {
      const deadLetter = await markFailed(supabase, row, {
        message: error instanceof Error ? error.message : "nerve_center_delivery_failed",
      });
      if (deadLetter) deadLetters += 1;
      else retryScheduled += 1;
    }
  }

  const failed = retryScheduled + deadLetters;
  await updateProviderHealth(supabase, {
    status: failed ? "Degraded" : "Operational",
    message: failed
      ? `${failed} owner control-plane event deliveries require retry or review.`
      : "Signed owner control-plane events are delivering successfully.",
    success: failed === 0,
  });
  const health = await supabase.from("marketvibe_system_health_snapshots").insert({
    service_name: "nerve_center_outbox",
    health_status: failed ? "Degraded" : "Operational",
    health_message: failed
      ? `${failed} signed operations events require retry or review.`
      : "Signed operations outbox completed without errors.",
    metrics: { claimed: rows.length, delivered, retry_scheduled: retryScheduled, dead_letters: deadLetters },
  });
  if (health.error) databaseError("Could not record nerve-center health", health.error);
  return {
    configured: true,
    enabled: true,
    claimed: rows.length,
    delivered,
    retryScheduled,
    deadLetters,
    failed,
  };
}
