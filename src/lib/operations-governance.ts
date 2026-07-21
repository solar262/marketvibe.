import { createHash } from "node:crypto";
import type { getSupabaseAdmin } from "@/lib/supabase";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

export const dataRequestTypes = ["access", "correction", "deletion", "objection", "suppression"] as const;
export type DataRequestType = typeof dataRequestTypes[number];

function clean(value: unknown, max = 2_000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizedEmail(value: unknown) {
  return clean(value, 254).toLowerCase();
}

export function validateDataRequest(payload: unknown) {
  const input = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const email = normalizedEmail(input.email);
  const requestType = dataRequestTypes.includes(input.requestType as DataRequestType) ? input.requestType as DataRequestType : "access";
  const name = clean(input.name, 200);
  const company = clean(input.company, 300);
  const message = clean(input.message, 4_000);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false as const, error: "A valid email address is required." };
  if (message.length < 10) return { ok: false as const, error: "Please identify the affected data or source and the action requested." };
  return { ok: true as const, value: { email, requestType, name, company, message } };
}

function requestSubjectKey(email: string) {
  return createHash("sha256").update(email).digest("hex");
}

export async function createDataRequestCase({ supabase, payload }: { supabase: SupabaseClient; payload: unknown }) {
  const validation = validateDataRequest(payload);
  if (!validation.ok) throw new Error(validation.error);
  const request = validation.value;
  const immediateSuppression = request.requestType === "objection" || request.requestType === "suppression" || request.requestType === "deletion";
  if (immediateSuppression) {
    await Promise.all([
      supabase.from("marketvibe_suppression_records").upsert({
        suppression_key: request.email,
        suppression_type: "customer",
        reason: `Data subject ${request.requestType} request received.`,
        source: "data_request_form",
        active: true,
      }, { onConflict: "suppression_key" }),
      supabase.from("sales_suppression_list").upsert({
        normalized_email: request.email,
        reason: `data_${request.requestType}_request`,
        region: "OTHER",
        source: "data_request_form",
      }, { onConflict: "normalized_email" }),
      supabase.from("sales_leads").update({ is_suppressed: true, outbound_sequence_status: "stopped", updated_at: new Date().toISOString() }).eq("normalized_email", request.email),
      supabase.from("sales_email_events").update({ status: "skipped", failure_reason: "data_subject_suppression" }).eq("normalized_email", request.email).eq("status", "queued"),
    ]);
  }
  const subjectKey = requestSubjectKey(request.email);
  const { data, error } = await supabase.from("marketvibe_exceptions").insert({
    category: "data_subject_request",
    title: `${request.requestType} request received`,
    explanation: request.message,
    affected_record_type: "data_subject",
    supporting_evidence: {
      request_type: request.requestType,
      subject_key: subjectKey,
      email: request.email,
      name: request.name,
      company: request.company,
      immediate_suppression_applied: immediateSuppression,
      identity_verification_status: "pending",
    },
    recommended_action: immediateSuppression
      ? "Keep suppression active. Verify identity before exporting, correcting, or deleting stored records."
      : "Verify identity before exporting or correcting stored records.",
    commercial_impact: "Marketing remains stopped for suppression-class requests; fulfilment awaits identity verification where legally required.",
    severity: immediateSuppression ? "high" : "medium",
  }).select("id,created_at").single();
  if (error) throw error;
  await supabase.from("marketvibe_audit_events").insert({
    event_type: "data_subject_request_received",
    actor_type: "customer",
    related_record_type: "marketvibe_exception",
    related_record_id: data.id,
    destination_state: immediateSuppression ? "suppressed_pending_verification" : "verification_pending",
    reason: `${request.requestType} request recorded with a tamper-evident audit trail.`,
    event_payload: { request_type: request.requestType, subject_key: subjectKey, immediate_suppression_applied: immediateSuppression },
  });
  return { id: data.id, createdAt: data.created_at, requestType: request.requestType, immediateSuppression };
}

export async function runGovernanceControl({ supabase }: { supabase: SupabaseClient }) {
  const retentionDays = Math.min(Math.max(Number(process.env.OPERATIONS_RETENTION_DAYS || 365), 30), 3650);
  const cutoff = new Date(Date.now() - retentionDays * 86_400_000).toISOString();
  const [providers, pendingRequests, oldReplies, oldOutreach] = await Promise.all([
    supabase.from("marketvibe_provider_configurations").select("provider_identifier,enabled,settings,health_status"),
    supabase.from("marketvibe_exceptions").select("id", { count: "exact", head: true }).eq("category", "data_subject_request").eq("status", "open"),
    supabase.from("marketvibe_replies").select("id", { count: "exact", head: true }).lt("received_at", cutoff),
    supabase.from("marketvibe_outreach_drafts").select("id", { count: "exact", head: true }).lt("created_at", cutoff),
  ]);
  const firstError = [providers.error, pendingRequests.error, oldReplies.error, oldOutreach.error].find(Boolean);
  if (firstError) throw firstError;
  const unlicensedEnabled = (providers.data || []).filter((provider) => {
    const settings = provider.settings && typeof provider.settings === "object" ? provider.settings as Record<string, unknown> : {};
    return provider.enabled && provider.provider_identifier.includes("licensed") && !String(settings.license_basis || "").trim();
  });
  for (const provider of unlicensedEnabled) {
    await supabase.from("marketvibe_provider_configurations").update({
      enabled: false,
      health_status: "Blocked",
      health_message: "Automatically disabled because no documented license basis is recorded.",
      updated_at: new Date().toISOString(),
    }).eq("provider_identifier", provider.provider_identifier);
  }
  const metrics = {
    retention_days: retentionDays,
    pending_data_requests: pendingRequests.count || 0,
    records_due_for_retention_review: (oldReplies.count || 0) + (oldOutreach.count || 0),
    unlicensed_providers_disabled: unlicensedEnabled.length,
  };
  const degraded = unlicensedEnabled.length > 0 || metrics.records_due_for_retention_review > 0;
  await supabase.from("marketvibe_system_health_snapshots").insert({
    service_name: "data_governance",
    health_status: degraded ? "Degraded" : "Operational",
    health_message: degraded
      ? "Governance controls blocked unlicensed automation or identified records for retention review."
      : "Source licensing, data-request, suppression, and retention controls passed.",
    metrics,
  });
  return { ok: true, healthStatus: degraded ? "Degraded" : "Operational", metrics };
}
