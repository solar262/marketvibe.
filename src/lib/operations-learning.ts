import type { getSupabaseAdmin } from "@/lib/supabase";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type OpportunityMetric = {
  source_type?: string | null;
  inventory_status?: string | null;
  overall_score?: number | null;
};

export function summarizeOpportunityPerformance(rows: OpportunityMetric[]) {
  const sources: Record<string, { discovered: number; qualified: number; delivered: number; rejected: number; scoreTotal: number }> = {};
  for (const row of rows) {
    const source = String(row.source_type || "unknown");
    const bucket = sources[source] ||= { discovered: 0, qualified: 0, delivered: 0, rejected: 0, scoreTotal: 0 };
    bucket.discovered += 1;
    bucket.scoreTotal += Number(row.overall_score || 0);
    const status = String(row.inventory_status || "").toUpperCase();
    if (["QUALIFIED", "IN_INVENTORY", "RESERVED", "ASSIGNED", "PUBLISHED", "DELIVERED"].includes(status)) bucket.qualified += 1;
    if (status === "DELIVERED") bucket.delivered += 1;
    if (status === "REJECTED") bucket.rejected += 1;
  }
  return Object.fromEntries(Object.entries(sources).map(([source, value]) => [source, {
    discovered: value.discovered,
    qualified: value.qualified,
    delivered: value.delivered,
    rejected: value.rejected,
    qualification_rate: value.discovered ? Number((value.qualified / value.discovered).toFixed(4)) : 0,
    delivery_rate: value.discovered ? Number((value.delivered / value.discovered).toFixed(4)) : 0,
    average_score: value.discovered ? Number((value.scoreTotal / value.discovered).toFixed(2)) : 0,
  }]));
}

export async function runOperationsLearning({ supabase }: { supabase: SupabaseClient }) {
  const [opportunities, assignments, replacements, emails, leads] = await Promise.all([
    supabase.from("opportunities").select("source_type,inventory_status,overall_score").eq("is_test_data", false).limit(5_000),
    supabase.from("opportunity_assignments").select("assignment_status,delivery_status").limit(5_000),
    supabase.from("opportunity_replacement_requests").select("reason,status").limit(2_000),
    supabase.from("sales_email_events").select("status").limit(5_000),
    supabase.from("sales_leads").select("stage,fit").limit(5_000),
  ]);
  const firstError = [opportunities.error, assignments.error, replacements.error, emails.error, leads.error].find(Boolean);
  if (firstError) throw firstError;

  const sourcePerformance = summarizeOpportunityPerformance(opportunities.data || []);
  const countBy = (rows: Array<Record<string, unknown>>, field: string) => rows.reduce<Record<string, number>>((result, row) => {
    const key = String(row[field] || "unknown");
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  const metrics = {
    source_performance: sourcePerformance,
    assignments: {
      status: countBy(assignments.data || [], "assignment_status"),
      delivery: countBy(assignments.data || [], "delivery_status"),
    },
    replacement_reasons: countBy(replacements.data || [], "reason"),
    email_status: countBy(emails.data || [], "status"),
    sales_stages: countBy(leads.data || [], "stage"),
    sales_fit: countBy(leads.data || [], "fit"),
  };
  const activeSources = Object.keys(sourcePerformance).length;
  const totalOpportunities = opportunities.data?.length || 0;
  const healthStatus = totalOpportunities && activeSources ? "Operational" : "Degraded";
  const capturedAt = new Date().toISOString();
  const { error } = await supabase.from("marketvibe_system_health_snapshots").insert({
    service_name: "operations_learning",
    health_status: healthStatus,
    health_message: totalOpportunities
      ? `Performance learning measured ${totalOpportunities} opportunities across ${activeSources} sources.`
      : "No production opportunity outcomes are available for learning yet.",
    metrics,
    captured_at: capturedAt,
  });
  if (error) throw error;
  await supabase.from("marketvibe_audit_events").insert({
    event_type: "operations_learning_snapshot_created",
    actor_type: "system",
    reason: "Source, delivery, replacement, email, and sales outcomes were aggregated into an auditable learning snapshot.",
    destination_state: healthStatus,
    event_payload: { captured_at: capturedAt, total_opportunities: totalOpportunities, active_sources: activeSources },
  });
  return { ok: true, healthStatus, totalOpportunities, activeSources, metrics };
}
