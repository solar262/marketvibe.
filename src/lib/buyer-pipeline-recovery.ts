import type { getSupabaseAdmin } from "@/lib/supabase";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type RecoverableBuyerCompany = {
  id: string;
  buyer_status: string;
  website_status: string;
};

type ExistingPipelineJob = {
  id: string;
  related_record_id: string;
  queue_status: string;
};

const RECOVERABLE_BUYER_STATES = [
  "discovered",
  "structurally_validated",
  "deduplicated",
  "website_verification_queued",
  "retry_scheduled",
  "refresh_queued",
] as const;

const REQUEUEABLE_JOB_STATES = new Set(["completed", "failed", "permanent_failure"]);

function nowIso() {
  return new Date().toISOString();
}

export async function ensureBuyerPipelineJobs({
  supabase,
  limit = 500,
}: {
  supabase: SupabaseClient;
  limit?: number;
}) {
  const { data: companies, error: companiesError } = await supabase
    .from("marketvibe_buyer_companies")
    .select("id,buyer_status,website_status")
    .in("buyer_status", [...RECOVERABLE_BUYER_STATES])
    .order("created_at", { ascending: true })
    .limit(limit);

  if (companiesError) throw companiesError;

  const recoverableCompanies = (companies || []) as RecoverableBuyerCompany[];
  if (recoverableCompanies.length === 0) {
    return { examined: 0, queued: 0, reactivated: 0, alreadyActive: 0 };
  }

  const companyIds = recoverableCompanies.map((company) => company.id);
  const { data: jobs, error: jobsError } = await supabase
    .from("marketvibe_job_queue")
    .select("id,related_record_id,queue_status")
    .eq("job_name", "website_verification")
    .eq("related_record_type", "buyer_company")
    .in("related_record_id", companyIds);

  if (jobsError) throw jobsError;

  const jobsByCompanyId = new Map<string, ExistingPipelineJob>();
  for (const job of (jobs || []) as ExistingPipelineJob[]) {
    jobsByCompanyId.set(job.related_record_id, job);
  }

  const timestamp = nowIso();
  const missingJobs = recoverableCompanies
    .filter((company) => !jobsByCompanyId.has(company.id))
    .map((company) => ({
      job_name: "website_verification",
      related_record_type: "buyer_company",
      related_record_id: company.id,
      queue_status: "queued",
      run_after: timestamp,
      updated_at: timestamp,
    }));

  if (missingJobs.length > 0) {
    const { error } = await supabase.from("marketvibe_job_queue").insert(missingJobs);
    if (error) throw error;
  }

  const requeueableJobs = recoverableCompanies
    .map((company) => jobsByCompanyId.get(company.id))
    .filter((job): job is ExistingPipelineJob => Boolean(job && REQUEUEABLE_JOB_STATES.has(job.queue_status)));

  for (const job of requeueableJobs) {
    const { error } = await supabase
      .from("marketvibe_job_queue")
      .update({
        queue_status: "queued",
        run_after: timestamp,
        last_error: null,
        locked_by: null,
        locked_at: null,
        updated_at: timestamp,
      })
      .eq("id", job.id);
    if (error) throw error;
  }

  const alreadyActive = recoverableCompanies.length - missingJobs.length - requeueableJobs.length;

  return {
    examined: recoverableCompanies.length,
    queued: missingJobs.length,
    reactivated: requeueableJobs.length,
    alreadyActive,
  };
}
