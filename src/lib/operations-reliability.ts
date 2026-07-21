import type { getSupabaseAdmin } from "@/lib/supabase";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export async function runOperationsControl({ supabase }: { supabase: SupabaseClient }) {
  const now = new Date().toISOString();
  const staleJobCutoff = minutesAgo(25);
  const staleProviderCutoff = minutesAgo(90);

  const staleJobs = await supabase.from("marketvibe_job_queue").select("id,retry_count").eq("queue_status", "running").lt("locked_at", staleJobCutoff).limit(500);
  if (staleJobs.error) throw staleJobs.error;
  let recoveredJobs = 0;
  for (const job of staleJobs.data || []) {
    const retryCount = Number(job.retry_count || 0) + 1;
    const permanent = retryCount >= 4;
    const { error } = await supabase.from("marketvibe_job_queue").update({
      queue_status: permanent ? "permanent_failure" : "retry_scheduled",
      retry_count: retryCount,
      run_after: permanent ? now : new Date(Date.now() + Math.min(60, 2 ** retryCount * 5) * 60_000).toISOString(),
      last_error: "Recovered after worker lock exceeded 25 minutes.",
      locked_by: null,
      locked_at: null,
      updated_at: now,
    }).eq("id", job.id);
    if (error) throw error;
    recoveredJobs += 1;
  }

  const locks = await supabase.from("marketvibe_job_locks").delete().lt("expires_at", now).select("job_name");
  if (locks.error) throw locks.error;
  const providers = await supabase.from("marketvibe_provider_runs").update({
    status: "failed",
    completed_at: now,
    error_summary: { message: "Provider run exceeded 90-minute watchdog window." },
  }).eq("status", "running").lt("started_at", staleProviderCutoff).select("id");
  if (providers.error) throw providers.error;

  const [inventoryResult, overdueEmailsResult, openExceptionsResult, permanentFailuresResult, queuedJobsResult] = await Promise.all([
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("is_test_data", false).eq("inventory_status", "IN_INVENTORY"),
    supabase.from("sales_email_events").select("id", { count: "exact", head: true }).eq("status", "queued").lt("scheduled_at", minutesAgo(30)),
    supabase.from("marketvibe_exceptions").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("marketvibe_job_queue").select("id", { count: "exact", head: true }).eq("queue_status", "permanent_failure"),
    supabase.from("marketvibe_job_queue").select("id", { count: "exact", head: true }).in("queue_status", ["queued", "retry_scheduled"]),
  ]);
  const countError = [inventoryResult.error, overdueEmailsResult.error, openExceptionsResult.error, permanentFailuresResult.error, queuedJobsResult.error].find(Boolean);
  if (countError) throw countError;
  const inventory = inventoryResult.count || 0;
  const overdueEmails = overdueEmailsResult.count || 0;
  const openExceptions = openExceptionsResult.count || 0;
  const permanentFailures = permanentFailuresResult.count || 0;
  const queuedJobs = queuedJobsResult.count || 0;
  const degraded = overdueEmails > 0 || permanentFailures > 0 || inventory === 0;
  const metrics = {
    inventory,
    overdue_emails: overdueEmails,
    open_exceptions: openExceptions,
    permanent_failures: permanentFailures,
    queued_jobs: queuedJobs,
    recovered_stale_jobs: recoveredJobs,
    released_expired_locks: locks.data?.length || 0,
    failed_stale_provider_runs: providers.data?.length || 0,
  };
  await supabase.from("marketvibe_system_health_snapshots").insert({
    service_name: "operations_control",
    health_status: degraded ? "Degraded" : "Operational",
    health_message: degraded
      ? "The watchdog found an inventory, email, or permanent-job condition requiring attention. Safe retries continue automatically."
      : "Watchdog checks passed and stale locks were recovered safely.",
    metrics,
    captured_at: now,
  });
  if (recoveredJobs || providers.data?.length || locks.data?.length) {
    await supabase.from("marketvibe_audit_events").insert({
      event_type: "operations_watchdog_recovery",
      actor_type: "system",
      reason: "Expired worker state was recovered and retry policy was applied.",
      destination_state: degraded ? "Degraded" : "Operational",
      event_payload: metrics,
    });
  }
  return { ok: true, healthStatus: degraded ? "Degraded" : "Operational", metrics };
}
