import { createHmac, timingSafeEqual } from "node:crypto";
import { runNerveCenterOutbox } from "@/lib/nerve-center-outbox";
import { assertSafePublicUrl } from "@/lib/sales-navigator-import";
import type { getSupabaseAdmin } from "@/lib/supabase";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type CustomerWebhook = { email: string; url: string; secret: string };

function clean(value: unknown, max = 2_000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeEmail(value: unknown) {
  return clean(value, 254).toLowerCase();
}

function customerWebhooks() {
  try {
    const parsed = JSON.parse(process.env.CUSTOMER_DELIVERY_WEBHOOKS || "[]") as CustomerWebhook[];
    return Array.isArray(parsed)
      ? parsed.filter((item) => normalizeEmail(item.email) && clean(item.url) && clean(item.secret))
      : [];
  } catch {
    return [];
  }
}

function apiKeyEntries() {
  try {
    const parsed = JSON.parse(process.env.MARKETVIBE_CUSTOMER_API_KEYS || "{}") as Record<string, string>;
    return Object.entries(parsed).filter(([key, email]) => key.length >= 20 && normalizeEmail(email));
  } catch {
    return [] as Array<[string, string]>;
  }
}

export function customerEmailForApiKey(supplied: string) {
  for (const [key, email] of apiKeyEntries()) {
    if (key.length === supplied.length && timingSafeEqual(Buffer.from(key), Buffer.from(supplied))) return normalizeEmail(email);
  }
  return "";
}

export async function listCustomerOpportunityData({
  supabase,
  customerEmail,
  limit = 50,
  before,
}: {
  supabase: SupabaseClient;
  customerEmail: string;
  limit?: number;
  before?: string;
}) {
  let query = supabase
    .from("opportunity_assignments")
    .select("id,product_code,assignment_status,delivery_status,delivered_at,match_reason,opportunities(*)")
    .eq("customer_email", normalizeEmail(customerEmail))
    .in("assignment_status", ["published", "delivered"])
    .order("delivered_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  if (before) query = query.lt("delivered_at", before);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((assignment) => {
    const opportunity = Array.isArray(assignment.opportunities) ? assignment.opportunities[0] : assignment.opportunities;
    return {
      id: assignment.id,
      product: assignment.product_code,
      delivered_at: assignment.delivered_at,
      company: {
        name: opportunity?.company_name,
        website: opportunity?.company_website,
        location: opportunity?.company_location,
        country: opportunity?.company_country,
        industry: opportunity?.company_industry,
        size: opportunity?.company_size,
      },
      contact: {
        name: opportunity?.contact_full_name,
        title: opportunity?.contact_job_title,
        email: opportunity?.public_email,
        phone: opportunity?.public_phone,
      },
      why_now: {
        category: opportunity?.intent_category,
        summary: opportunity?.customer_summary,
        evidence: opportunity?.source_text,
        source_url: opportunity?.source_url,
        source_title: opportunity?.source_title,
        published_at: opportunity?.source_published_at,
        last_verified_at: opportunity?.last_verified_at,
      },
      what_to_say: opportunity?.recommended_action,
      scores: {
        overall: opportunity?.overall_score,
        fit: opportunity?.fit_score,
        intent: opportunity?.intent_score,
        evidence: opportunity?.evidence_score,
        freshness: opportunity?.freshness_score,
      },
      match: assignment.match_reason,
    };
  });
}

async function auditExists(supabase: SupabaseClient, eventType: string, idempotencyKey: string) {
  const { count } = await supabase.from("marketvibe_audit_events").select("id", { count: "exact", head: true }).eq("event_type", eventType).contains("event_payload", { idempotency_key: idempotencyKey });
  return Boolean(count);
}

async function recordIntegrationAudit(supabase: SupabaseClient, input: {
  eventType: string;
  relatedType: string;
  relatedId: string;
  state: string;
  reason: string;
  payload: Record<string, unknown>;
}) {
  await supabase.from("marketvibe_audit_events").insert({
    event_type: input.eventType,
    actor_type: "system",
    related_record_type: input.relatedType,
    related_record_id: input.relatedId,
    destination_state: input.state,
    reason: input.reason,
    event_payload: input.payload,
  });
}

async function deliverCustomerWebhooks(supabase: SupabaseClient) {
  const hooks = customerWebhooks();
  if (!hooks.length) return { configured: 0, attempted: 0, delivered: 0, failed: 0 };
  let attempted = 0;
  let delivered = 0;
  let failed = 0;
  for (const hook of hooks) {
    const items = await listCustomerOpportunityData({ supabase, customerEmail: hook.email, limit: 100 });
    for (const item of items) {
      const idempotencyKey = `customer_webhook:${normalizeEmail(hook.email)}:${item.id}`;
      if (await auditExists(supabase, "customer_delivery_webhook_sent", idempotencyKey)) continue;
      attempted += 1;
      try {
        const url = await assertSafePublicUrl(hook.url);
        const body = JSON.stringify({ event: "marketvibe.opportunity.delivered", idempotency_key: idempotencyKey, customer_email: normalizeEmail(hook.email), opportunity: item });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signature = createHmac("sha256", hook.secret).update(`${timestamp}.${body}`).digest("hex");
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-marketvibe-timestamp": timestamp,
            "x-marketvibe-signature": `sha256=${signature}`,
            "x-marketvibe-idempotency-key": idempotencyKey,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error(`customer_webhook_http_${response.status}`);
        await recordIntegrationAudit(supabase, {
          eventType: "customer_delivery_webhook_sent",
          relatedType: "opportunity_assignment",
          relatedId: item.id,
          state: "delivered",
          reason: "Opportunity data delivered to the configured customer webhook.",
          payload: { idempotency_key: idempotencyKey, endpoint_host: new URL(url).host },
        });
        delivered += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "customer_webhook_failed";
        await recordIntegrationAudit(supabase, {
          eventType: "customer_delivery_webhook_failed",
          relatedType: "opportunity_assignment",
          relatedId: item.id,
          state: "retry_required",
          reason: message,
          payload: { idempotency_key: idempotencyKey },
        });
        const existing = await supabase.from("marketvibe_exceptions").select("id").eq("category", "customer_integration").eq("affected_record_id", item.id).eq("status", "open").maybeSingle();
        if (!existing.data) await supabase.from("marketvibe_exceptions").insert({
          category: "customer_integration",
          title: `Customer delivery webhook failed for ${normalizeEmail(hook.email)}`,
          explanation: message,
          affected_record_type: "opportunity_assignment",
          affected_record_id: item.id,
          supporting_evidence: { idempotency_key: idempotencyKey },
          recommended_action: "Verify the customer endpoint and signing secret; the next integration run will retry.",
          commercial_impact: "Customer API delivery is delayed; dashboard and email delivery remain available.",
          severity: "high",
        });
      }
    }
  }
  return { configured: hooks.length, attempted, delivered, failed };
}

async function syncLeadToHubSpot(lead: Record<string, unknown>) {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN || "";
  if (!token) return { skipped: true };
  const email = normalizeEmail(lead.email);
  if (!email) return { skipped: true };
  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ properties: {
      email,
      firstname: clean(lead.name).split(" ")[0] || "",
      lastname: clean(lead.name).split(" ").slice(1).join(" "),
      company: clean(lead.company_name),
      website: clean(lead.website),
      lifecyclestage: lead.stage === "interested" ? "salesqualifiedlead" : "lead",
    } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) {
    const create = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ properties: { email, firstname: clean(lead.name).split(" ")[0] || "", lastname: clean(lead.name).split(" ").slice(1).join(" "), company: clean(lead.company_name), website: clean(lead.website) } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!create.ok && create.status !== 409) throw new Error(`hubspot_http_${create.status}`);
    return { skipped: false };
  }
  if (!response.ok) throw new Error(`hubspot_http_${response.status}`);
  return { skipped: false };
}

async function syncLeadToPipedrive(lead: Record<string, unknown>) {
  const token = process.env.PIPEDRIVE_API_TOKEN || "";
  const domain = clean(process.env.PIPEDRIVE_COMPANY_DOMAIN, 200).replace(/[^a-z0-9-]/gi, "");
  if (!token || !domain) return { skipped: true };
  const email = normalizeEmail(lead.email);
  if (!email) return { skipped: true };
  const search = await fetch(`https://${domain}.pipedrive.com/api/v1/persons/search?term=${encodeURIComponent(email)}&fields=email&exact_match=true&api_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(10_000) });
  if (!search.ok) throw new Error(`pipedrive_search_http_${search.status}`);
  const result = await search.json() as { data?: { items?: Array<{ item?: { id?: number } }> } };
  const id = result.data?.items?.[0]?.item?.id;
  const endpoint = id ? `https://${domain}.pipedrive.com/api/v1/persons/${id}?api_token=${encodeURIComponent(token)}` : `https://${domain}.pipedrive.com/api/v1/persons?api_token=${encodeURIComponent(token)}`;
  const response = await fetch(endpoint, {
    method: id ? "PUT" : "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: clean(lead.name) || email, email: [{ value: email, primary: true }], org_name: clean(lead.company_name) || undefined }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`pipedrive_http_${response.status}`);
  return { skipped: false };
}

async function syncOwnSalesCrm(supabase: SupabaseClient) {
  const configured = Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN || (process.env.PIPEDRIVE_API_TOKEN && process.env.PIPEDRIVE_COMPANY_DOMAIN));
  if (!configured) return { configured: false, examined: 0, synced: 0, failed: 0 };
  const { data, error } = await supabase.from("sales_leads").select("*").order("updated_at", { ascending: false }).limit(100);
  if (error) throw error;
  let synced = 0;
  let failed = 0;
  for (const lead of data || []) {
    const key = `sales_crm:${lead.id}:${lead.updated_at}`;
    if (await auditExists(supabase, "sales_crm_synced", key)) continue;
    try {
      const [hubspot, pipedrive] = await Promise.all([syncLeadToHubSpot(lead), syncLeadToPipedrive(lead)]);
      await recordIntegrationAudit(supabase, {
        eventType: "sales_crm_synced",
        relatedType: "sales_lead",
        relatedId: lead.id,
        state: "synced",
        reason: "Sales lead synchronized to configured CRM integrations.",
        payload: { idempotency_key: key, hubspot, pipedrive },
      });
      synced += 1;
    } catch (error) {
      failed += 1;
      await recordIntegrationAudit(supabase, {
        eventType: "sales_crm_sync_failed",
        relatedType: "sales_lead",
        relatedId: lead.id,
        state: "retry_required",
        reason: error instanceof Error ? error.message : "crm_sync_failed",
        payload: { idempotency_key: key },
      });
    }
  }
  return { configured: true, examined: data?.length || 0, synced, failed };
}

export async function runIntegrationDelivery({ supabase }: { supabase: SupabaseClient }) {
  const [customerWebhooksResult, crm, nerveCenter] = await Promise.all([
    deliverCustomerWebhooks(supabase),
    syncOwnSalesCrm(supabase),
    runNerveCenterOutbox({ supabase }),
  ]);
  const failed = customerWebhooksResult.failed + crm.failed + nerveCenter.failed;
  await supabase.from("marketvibe_system_health_snapshots").insert({
    service_name: "integration_delivery",
    health_status: failed ? "Degraded" : "Operational",
    health_message: failed ? `${failed} integration deliveries require retry.` : "Configured integrations completed without errors.",
    metrics: { customer_webhooks: customerWebhooksResult, crm, nerve_center: nerveCenter },
  });
  return { ok: failed === 0, customerWebhooks: customerWebhooksResult, crm, nerveCenter };
}
