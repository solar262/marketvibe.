export * from "./sales-pipeline";

import { getSupabaseAdmin } from "./supabase";
import {
  assessColdOutboundLead,
  createOutboundSalesProspect as createOutboundSalesProspectBase,
  listOutboundSalesLeads as listOutboundSalesLeadsBase,
  queueSalesEmailSequence,
  type SalesLeadListRow,
} from "./sales-pipeline";

type AnyRow = Record<string, unknown>;

function toRecord(value: unknown): AnyRow {
  return value && typeof value === "object" && !Array.isArray(value) ? value as AnyRow : {};
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function outboundMetadata(row: Partial<SalesLeadListRow>) {
  const metadata = toRecord(row.metadata);
  return toRecord(metadata.marketvibeOutbound);
}

function mergeOutboundMetadata(row: Partial<SalesLeadListRow>, patch: AnyRow) {
  const metadata = toRecord(row.metadata);
  return {
    ...metadata,
    marketvibeOutbound: {
      ...outboundMetadata(row),
      ...patch,
    },
  };
}

function inferredRecipientType(lead: Partial<SalesLeadListRow>) {
  const current = firstText(outboundMetadata(lead).recipient_type, lead.recipient_type);
  if (current && current !== "unknown") return current;
  if (lead.region === "UK" && lead.company_name) return "uk_corporate_subscriber";
  if (lead.region === "US" && lead.company_name) return "us_b2b_contact";
  return current || "unknown";
}

function inferredLawfulBasis(lead: Partial<SalesLeadListRow>) {
  const current = firstText(outboundMetadata(lead).lawful_basis, lead.lawful_basis);
  if (current && current !== "not_applicable" && current !== "manual_review") return current;
  if (lead.region === "UK") return "legitimate_interest";
  if (lead.region === "US") return "can_spam_business_context";
  return current || "manual_review";
}

export function normalizeOutboundSalesLead(row: SalesLeadListRow): SalesLeadListRow {
  const meta = outboundMetadata(row);
  return {
    ...row,
    lead_origin: firstText(meta.lead_origin, row.lead_origin) as SalesLeadListRow["lead_origin"],
    source_url: firstText(meta.source_url, row.source_url) || null,
    source_evidence: firstText(meta.source_evidence, row.source_evidence) || null,
    recipient_type: firstText(meta.recipient_type, row.recipient_type, "unknown") as SalesLeadListRow["recipient_type"],
    lawful_basis: firstText(meta.lawful_basis, row.lawful_basis, "not_applicable") as SalesLeadListRow["lawful_basis"],
    compliance_status: firstText(meta.compliance_status, row.compliance_status, "not_checked") as SalesLeadListRow["compliance_status"],
    email_permission_status: firstText(meta.email_permission_status, row.email_permission_status, "not_checked") as SalesLeadListRow["email_permission_status"],
    cold_outbound_approved_at: firstText(meta.cold_outbound_approved_at, row.cold_outbound_approved_at) || null,
    cold_outbound_approved_by: firstText(meta.cold_outbound_approved_by, row.cold_outbound_approved_by) || null,
    outbound_sequence_status: firstText(meta.outbound_sequence_status, row.outbound_sequence_status, "not_started") as SalesLeadListRow["outbound_sequence_status"],
  };
}

export async function createOutboundSalesProspect(payload: unknown) {
  const result = await createOutboundSalesProspectBase(payload);
  const lead = normalizeOutboundSalesLead(result.lead);
  return {
    ...result,
    lead,
    complianceStatus: lead.compliance_status,
    emailPermissionStatus: lead.email_permission_status,
    canQueue: assessColdOutboundLead(lead, { requireEnabled: false }).allowed,
  };
}

export async function listOutboundSalesLeads(filters: { status?: string; q?: string; limit?: number }) {
  const result = await listOutboundSalesLeadsBase(filters);
  const leads = result.leads
    .map(normalizeOutboundSalesLead)
    .filter((lead) => !filters.status || lead.compliance_status === filters.status);
  return { ...result, leads };
}

export async function approveOutboundLead(id: string, approvedBy = "admin") {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const currentResult = await supabase.from("sales_leads").select("*").eq("id", id).single();
  if (currentResult.error || !currentResult.data) throw new Error(currentResult.error?.message || "Outbound lead was not found.");

  const current = normalizeOutboundSalesLead(currentResult.data as SalesLeadListRow);
  const recipientType = inferredRecipientType(current) as SalesLeadListRow["recipient_type"];
  const lawfulBasis = inferredLawfulBasis(current) as SalesLeadListRow["lawful_basis"];
  const proposed: SalesLeadListRow = {
    ...current,
    recipient_type: recipientType,
    lawful_basis: lawfulBasis,
    compliance_status: "approved",
    email_permission_status: "can_email",
  };
  const gate = assessColdOutboundLead(proposed, { requireEnabled: false });
  if (!gate.allowed) throw new Error(`Outbound lead cannot be approved: ${gate.reason}`);

  const now = new Date().toISOString();
  const updateResult = await supabase.from("sales_leads").update({
    metadata: mergeOutboundMetadata(current, {
      recipient_type: recipientType,
      lawful_basis: lawfulBasis,
      compliance_status: "approved",
      email_permission_status: "can_email",
      cold_outbound_approved_at: now,
      cold_outbound_approved_by: approvedBy,
      outbound_sequence_status: "approved",
    }),
    stage: current.stage === "new_lead" ? "qualified" : current.stage,
    updated_at: now,
    last_activity_at: now,
  }).eq("id", id).select("*").single();
  if (updateResult.error || !updateResult.data) throw new Error(updateResult.error?.message || "Outbound approval did not persist.");

  await supabase.from("sales_lead_status_history").insert({
    lead_id: id,
    from_stage: current.stage,
    to_stage: current.stage === "new_lead" ? "qualified" : current.stage,
    changed_by: approvedBy,
    note: "Cold outbound prospect approved for automated UK/US B2B sequence.",
  });

  return normalizeOutboundSalesLead(updateResult.data as SalesLeadListRow);
}

export async function queueColdOutboundForLead(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const currentResult = await supabase.from("sales_leads").select("*").eq("id", id).single();
  if (currentResult.error || !currentResult.data) throw new Error(currentResult.error?.message || "Outbound lead was not found.");

  let lead = normalizeOutboundSalesLead(currentResult.data as SalesLeadListRow);
  if (!lead.cold_outbound_approved_at || lead.compliance_status !== "approved" || lead.email_permission_status !== "can_email") {
    lead = await approveOutboundLead(id, "autopilot_queue");
  }

  const gate = assessColdOutboundLead(lead, { requireEnabled: false });
  if (!gate.allowed) throw new Error(`Outbound lead cannot be queued: ${gate.reason}`);
  return queueSalesEmailSequence(lead, "cold_outbound");
}

export async function getOutboundSalesOverview() {
  const outbound = await listOutboundSalesLeads({ limit: 250 });
  const leads = outbound.leads;
  return {
    config: (await import("./sales-pipeline")).salesOutboundConfig(),
    imported: leads.length,
    approved: leads.filter((lead) => lead.compliance_status === "approved").length,
    manualReview: leads.filter((lead) => lead.compliance_status === "manual_review").length,
    blocked: leads.filter((lead) => lead.compliance_status === "blocked").length,
    queued: leads.filter((lead) => lead.outbound_sequence_status === "queued").length,
  };
}
