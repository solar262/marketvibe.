import { readFileSync } from "node:fs";
import { basename } from "node:path";
import * as nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { buildImportPreviewFromWorkbookBuffer } from "../src/lib/sales-navigator-import";
import {
  backfillImportedBuyerCompanies,
  buildBuyerCompanyIdentity,
  mappedRowsFromPreview,
  runBuyerPipelineWorker,
} from "../src/lib/operations-pipeline";
import { importProspectsFromRows } from "../src/lib/sales-navigator-persistence";

nextEnv.loadEnvConfig(process.cwd());

const workbookPath = process.env.MARKETVIBE_XLSX_ACCEPTANCE_FILE || "C:\\Users\\qwerty\\Downloads\\marketvibe_us_builder_buyers_50.xlsx";

type LiveResult = {
  data?: unknown;
  count?: number | null;
  error?: { message: string } | null;
};
type LiveQuery = PromiseLike<LiveResult> & {
  select: (columns?: string, options?: Record<string, unknown>) => LiveQuery;
  eq: (column: string, value: unknown) => LiveQuery;
  in: (column: string, values: readonly unknown[]) => LiveQuery;
  update: (values: Record<string, unknown>) => LiveQuery;
  order: (column: string, options?: Record<string, unknown>) => LiveQuery;
  limit: (count: number) => LiveQuery;
};
type LiveSupabase = { from: (table: string) => LiveQuery };
type LiveCompany = {
  id: string;
  identity_key: string;
  company_name: string;
  buyer_status: string;
  qualification_reason?: string | null;
  rejection_reason?: string | null;
};
type LiveJob = {
  id: string;
  related_record_id: string;
  queue_status: string;
};

if (process.env.LIVE_BUYER_PIPELINE_ACCEPTANCE !== "1") {
  throw new Error("Set LIVE_BUYER_PIPELINE_ACCEPTANCE=1 to run the live Supabase acceptance check.");
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
}

async function countRows(supabase: LiveSupabase, table: string, build: (query: LiveQuery) => LiveQuery) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  query = build(query);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function fetchCompanies(supabase: LiveSupabase, identities: string[]) {
  const { data, error } = await supabase
    .from("marketvibe_buyer_companies")
    .select("id,identity_key,company_name,buyer_status,qualification_reason,rejection_reason")
    .in("identity_key", identities);
  if (error) throw error;
  return (data || []) as LiveCompany[];
}

async function fetchJobs(supabase: LiveSupabase, companyIds: string[]) {
  if (companyIds.length === 0) return [];
  const { data, error } = await supabase
    .from("marketvibe_job_queue")
    .select("id,related_record_id,queue_status")
    .eq("job_name", "website_verification")
    .eq("related_record_type", "buyer_company")
    .in("related_record_id", companyIds);
  if (error) throw error;
  return (data || []) as LiveJob[];
}

async function snapshot(supabase: LiveSupabase, identities: string[]) {
  const companies = await fetchCompanies(supabase, identities);
  const jobs = await fetchJobs(supabase, companies.map((company) => String(company.id)));
  return {
    workbookCompanies: companies.length,
    workbookStateCounts: countBy(companies.map((company) => String(company.buyer_status))),
    workbookJobCounts: countBy(jobs.map((job) => String(job.queue_status))),
    workbookReasonsRecorded: companies.filter((company) => company.qualification_reason || company.rejection_reason).length,
    operationsQualifiedTotal: await countRows(supabase, "marketvibe_buyer_companies", (query) =>
      query.in("buyer_status", ["qualified", "active"]).eq("is_test_data", false)),
    buyerCompaniesTotal: await countRows(supabase, "marketvibe_buyer_companies", (query) => query.eq("is_test_data", false)),
  };
}

async function main() {
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as LiveSupabase;

  const preview = await buildImportPreviewFromWorkbookBuffer({
    buffer: readFileSync(workbookPath),
    filename: basename(workbookPath),
  });
  const mappedRows = mappedRowsFromPreview(preview);
  const identities = Array.from(new Set(mappedRows.map(buildBuyerCompanyIdentity)));
  if (preview.stats.totalRows !== 50 || preview.stats.validRows !== 50 || preview.stats.rejectedRows !== 0 || identities.length !== 50) {
    throw new Error(`Unexpected workbook validation result: ${JSON.stringify({ stats: preview.stats, identities: identities.length })}`);
  }

  const before = await snapshot(supabase, identities);
  const backfill = await backfillImportedBuyerCompanies({ supabase: supabase as never, limit: 500 });

  let firstImportMode = "fresh-import";
  const companiesBeforeFirstImport = await fetchCompanies(supabase, identities);
  if (companiesBeforeFirstImport.length === identities.length) {
    firstImportMode = "existing-company-refresh";
    const { error } = await supabase
      .from("marketvibe_buyer_companies")
      .update({
        buyer_status: "refresh_queued",
        website_status: "queued",
        updated_at: new Date().toISOString(),
      })
      .in("id", companiesBeforeFirstImport.map((company) => company.id));
    if (error) throw error;
  }

  const firstImport = await importProspectsFromRows({
    filename: basename(workbookPath),
    rows: preview.rows,
    mapping: preview.mapping,
    sourceFormat: preview.sourceFormat,
    worksheetName: preview.worksheetName,
    fileChecksum: preview.fileChecksum,
    rowFingerprints: preview.rowFingerprints,
  });
  const afterFirstImport = await snapshot(supabase, identities);

  const worker = await runBuyerPipelineWorker({ supabase: supabase as never, workerId: "live-acceptance-buyer-pipeline", limit: 100 });
  const afterWorker = await snapshot(supabase, identities);

  const duplicateImport = await importProspectsFromRows({
    filename: basename(workbookPath),
    rows: preview.rows,
    mapping: preview.mapping,
    sourceFormat: preview.sourceFormat,
    worksheetName: preview.worksheetName,
    fileChecksum: preview.fileChecksum,
    rowFingerprints: preview.rowFingerprints,
  });
  const afterDuplicateImport = await snapshot(supabase, identities);

  console.log(JSON.stringify({
    workbook: {
      path: workbookPath,
      sourceFormat: preview.sourceFormat,
      worksheetName: preview.worksheetName,
      totalRows: preview.stats.totalRows,
      validRows: preview.stats.validRows,
      rejectedRows: preview.stats.rejectedRows,
      duplicateRowsInFile: preview.stats.duplicateRows,
      uniqueBuyerIdentities: identities.length,
    },
    before,
    backfill,
    firstImportMode,
    firstImport,
    afterFirstImport,
    worker,
    afterWorker,
    duplicateImport,
    afterDuplicateImport,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
