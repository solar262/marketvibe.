import type { getSupabaseAdmin } from "@/lib/supabase";
import { enrichBuyerCompanyRecord } from "@/lib/operations-enrichment";
import {
  buildDedupeKey,
  domainFromUrl,
  enrichComputedFields,
  fingerprintRawRow,
  hasAnyUsableSourceReference,
  mapRow,
  normalizeDomain,
  normalizeHttpUrl,
  normalizeLinkedInUrl,
  normalizeText,
  validateMappedRow,
  type ImportField,
  type ImportedProspectInput,
  type ImportPreview,
} from "@/lib/sales-navigator-import";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

export type BuyerPipelineState =
  | "discovered"
  | "structurally_validated"
  | "deduplicated"
  | "website_verification_queued"
  | "website_verified"
  | "enriched"
  | "scored"
  | "qualified"
  | "active"
  | "stale"
  | "refresh_queued"
  | "refreshed"
  | "rejected"
  | "quarantined"
  | "archived"
  | "contact_unresolved"
  | "retry_scheduled";

export type BuyerScore = {
  sectorFit: number;
  geographyFit: number;
  capacity: number;
  commercialFit: number;
  freshness: number;
  overall: number;
  qualificationReason: string;
  rejectionReason: string;
};

export type PersistedImportMetadata = {
  batchId: string;
  filename: string;
  sourceFormat: "csv" | "xlsx" | "quick_paste";
  worksheetName?: string;
  fileChecksum?: string;
  rowFingerprints?: string[];
};

export type ImportPersistenceRow = {
  row: ImportedProspectInput;
  prospectId?: string;
  dedupeKey: string;
  rowFingerprint?: string;
};

export type MemoryImportResult = {
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  duplicateRows: number;
  companiesCreated: number;
  companiesRemaining: number;
  queuedJobs: number;
  summary: string;
};

export type MemoryBuyerCompany = {
  id: string;
  identityKey: string;
  companyName: string;
  website: string;
  canonicalDomain: string;
  country: string;
  city: string;
  sector: string;
  companySize: string;
  buyerStatus: BuyerPipelineState;
  contactStatus: "unresolved" | "resolved" | "suppressed" | "not_required";
  websiteStatus: "queued" | "verified" | "failed" | "skipped" | "blocked";
  score: BuyerScore;
  auditEventIds: string[];
};

export type MemoryAuditEvent = {
  id: string;
  eventType: string;
  relatedRecordId: string;
  sourceState: string;
  destinationState: string;
  reason: string;
  actorType: "system" | "admin" | "owner" | "customer" | "provider";
  retryCount: number;
  createdAt: string;
};

export type MemoryJob = {
  id: string;
  jobName: string;
  relatedRecordId: string;
  status: "queued" | "running" | "completed" | "failed" | "retry_scheduled" | "permanent_failure";
  retryCount: number;
  lastError: string;
};

type BuyerCompanyLookup = {
  id: string;
  buyer_status: BuyerPipelineState | string | null;
  source_imported_prospect_id?: string | null;
  source_import_batch_id?: string | null;
  original_filename?: string | null;
  file_checksum?: string | null;
  row_fingerprint?: string | null;
};

type ExistingPipelineJob = {
  id: string;
  queue_status: string;
};

type ImportedProspectDbRow = Partial<Record<ImportField, string | null>> & {
  id: string;
  batch_id: string;
  dedupe_key?: string | null;
  raw_row?: Record<string, unknown> | null;
  fit_score?: number | null;
  intent_score?: number | null;
  evidence_status?: string | null;
  evidence_summary?: string | null;
  enrichment_status?: string | null;
  website_scan?: Record<string, unknown> | null;
};

type ImportBatchDbRow = {
  id: string;
  original_filename?: string | null;
  source_format?: string | null;
  worksheet_name?: string | null;
  file_checksum?: string | null;
  row_fingerprints?: string[] | null;
};

const ACTIVE_PIPELINE_JOB_STATES = new Set(["queued", "running", "retry_scheduled"]);
const RECOVERABLE_PIPELINE_JOB_STATES = new Set(["completed", "failed", "permanent_failure"]);
const BUYER_STATES_THAT_NEED_PIPELINE_JOB = new Set<BuyerPipelineState>([
  "discovered",
  "structurally_validated",
  "deduplicated",
  "website_verification_queued",
  "retry_scheduled",
  "refresh_queued",
]);

function nowIso() {
  return new Date().toISOString();
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

export function canonicalCompanyName(value: string) {
  return normalizeText(value).replace(/[^a-z0-9\s&.'-]+/g, "").replace(/\s+/g, " ").trim();
}

export function buildBuyerCompanyIdentity(row: Pick<ImportedProspectInput, "company_name" | "company_domain" | "company_website" | "company_linkedin_url" | "country">) {
  const domain = normalizeDomain(row.company_domain || domainFromUrl(row.company_website));
  if (domain) return `domain:${domain}`;
  const companyLinkedIn = normalizeLinkedInUrl(row.company_linkedin_url);
  if (companyLinkedIn) return `company_linkedin:${companyLinkedIn}`;
  const website = normalizeHttpUrl(row.company_website);
  if (website) return `website:${website}`;
  return `name_country:${canonicalCompanyName(row.company_name)}:${normalizeText(row.country)}`;
}

export function scoreBuyerCompany(row: Pick<ImportedProspectInput, "company_name" | "company_domain" | "company_website" | "country" | "city" | "location" | "industry" | "company_size" | "public_signal_url" | "public_signal_text">): BuyerScore {
  const sectorText = normalizeText(`${row.industry} ${row.public_signal_text}`);
  const geographyText = normalizeText(`${row.country} ${row.city} ${row.location}`);
  const sizeText = normalizeText(row.company_size);
  const domain = normalizeDomain(row.company_domain || domainFromUrl(row.company_website));

  const sectorFit = /\b(construction|builder|building|real estate|property|developer|contractor|architecture|roofing|renovation|homes?)\b/.test(sectorText) ? 85 : sectorText ? 55 : 35;
  const geographyFit = geographyText ? 75 : 35;
  const capacity = /\b(51-200|201-500|500|enterprise|mid|large)\b/.test(sizeText) ? 80 : /\b(11-50|small|smb)\b/.test(sizeText) ? 65 : sizeText ? 50 : 40;
  const commercialFit = domain ? 75 : row.public_signal_url ? 65 : 45;
  const freshness = 80;
  const overall = Math.round((sectorFit * 0.25) + (geographyFit * 0.2) + (capacity * 0.2) + (commercialFit * 0.25) + (freshness * 0.1));
  const qualificationReason = overall >= 55
    ? `Company has enough sector, geography, capacity, and public-reference evidence for buyer-stock processing (${overall}/100).`
    : "";
  const rejectionReason = overall < 55
    ? `Buyer score ${overall}/100 is below the default 55 threshold.`
    : "";

  return { sectorFit, geographyFit, capacity, commercialFit, freshness, overall, qualificationReason, rejectionReason };
}

function initialBuyerState(row: ImportedProspectInput): BuyerPipelineState {
  return row.company_website || row.company_domain || row.public_signal_url || row.company_linkedin_url || row.linkedin_profile_url
    ? "website_verification_queued"
    : "contact_unresolved";
}

function buyerEvidenceUrls(row: ImportedProspectInput) {
  return [row.company_website, row.public_signal_url, row.company_linkedin_url, row.linkedin_profile_url].filter(Boolean);
}

export function shouldQueueBuyerPipelineJobForState(state: string | null | undefined) {
  return BUYER_STATES_THAT_NEED_PIPELINE_JOB.has((state || "website_verification_queued") as BuyerPipelineState);
}

export function shouldReactivateBuyerPipelineJob(queueStatus: string | null | undefined) {
  return RECOVERABLE_PIPELINE_JOB_STATES.has(queueStatus || "");
}

function sourceFormatFromBatch(value: string | null | undefined): PersistedImportMetadata["sourceFormat"] {
  if (value === "xlsx" || value === "quick_paste") return value;
  return "csv";
}

function rawRowFromProspect(prospect: ImportedProspectDbRow) {
  if (!prospect.raw_row || typeof prospect.raw_row !== "object" || Array.isArray(prospect.raw_row)) return {};
  return Object.fromEntries(Object.entries(prospect.raw_row).map(([key, value]) => [key, String(value ?? "")]));
}

function mappedRowFromProspect(prospect: ImportedProspectDbRow): Record<ImportField, string> {
  return {
    first_name: String(prospect.first_name || ""),
    last_name: String(prospect.last_name || ""),
    full_name: String(prospect.full_name || ""),
    job_title: String(prospect.job_title || ""),
    company_name: String(prospect.company_name || ""),
    company_website: String(prospect.company_website || ""),
    company_domain: String(prospect.company_domain || ""),
    linkedin_profile_url: String(prospect.linkedin_profile_url || ""),
    company_linkedin_url: String(prospect.company_linkedin_url || ""),
    location: String(prospect.location || ""),
    country: String(prospect.country || ""),
    city: String(prospect.city || ""),
    industry: String(prospect.industry || ""),
    company_size: String(prospect.company_size || ""),
    public_email: String(prospect.public_email || ""),
    public_phone: String(prospect.public_phone || ""),
    public_signal_url: String(prospect.public_signal_url || ""),
    public_signal_text: String(prospect.public_signal_text || ""),
    source_note: String(prospect.source_note || ""),
  };
}

function importPersistenceRowFromProspect(prospect: ImportedProspectDbRow): ImportPersistenceRow {
  const rawRow = rawRowFromProspect(prospect);
  const enriched = enrichComputedFields(mappedRowFromProspect(prospect), rawRow, null);
  const dedupeKey = String(prospect.dedupe_key || enriched.dedupe_key);
  return {
    row: {
      ...enriched,
      dedupe_key: dedupeKey,
      fit_score: Number(prospect.fit_score ?? enriched.fit_score),
      intent_score: prospect.intent_score == null ? enriched.intent_score : Number(prospect.intent_score),
      evidence_status: (prospect.evidence_status as ImportedProspectInput["evidence_status"]) || enriched.evidence_status,
      evidence_summary: String(prospect.evidence_summary || enriched.evidence_summary),
      enrichment_status: (prospect.enrichment_status as ImportedProspectInput["enrichment_status"]) || enriched.enrichment_status,
      website_scan: (prospect.website_scan as ImportedProspectInput["website_scan"]) || enriched.website_scan,
    },
    prospectId: String(prospect.id),
    dedupeKey,
    rowFingerprint: fingerprintRawRow(rawRow),
  };
}

function buyerCompanyInsert(row: ImportedProspectInput, item: ImportPersistenceRow, metadata: PersistedImportMetadata, state: BuyerPipelineState, score: BuyerScore) {
  return {
    identity_key: buildBuyerCompanyIdentity(row),
    source_imported_prospect_id: item.prospectId || null,
    source_import_batch_id: metadata.batchId,
    original_filename: metadata.filename,
    file_checksum: metadata.fileChecksum || null,
    row_fingerprint: item.rowFingerprint || null,
    company_name: row.company_name,
    website: row.company_website || null,
    canonical_domain: normalizeDomain(row.company_domain || domainFromUrl(row.company_website)) || null,
    country: row.country || null,
    city: row.city || null,
    operating_locations: [row.location, row.city, row.country].filter(Boolean),
    sector: row.industry || null,
    employee_range_estimate: row.company_size || null,
    company_profile_urls: [row.company_linkedin_url, row.linkedin_profile_url].filter(Boolean),
    public_evidence_urls: buyerEvidenceUrls(row),
    public_evidence_summary: row.public_signal_text || row.source_note || "Company imported from a structurally valid file row.",
    source_provider: metadata.sourceFormat === "xlsx" ? "uploaded_xlsx" : "uploaded_csv",
    source_date: nowIso(),
    website_status: state === "website_verification_queued" ? "queued" : "skipped",
    buyer_status: state,
    contact_status: "unresolved",
    likely_buyer_type: row.industry || null,
    sector_fit_score: score.sectorFit,
    geography_fit_score: score.geographyFit,
    capacity_score: score.capacity,
    commercial_fit_score: score.commercialFit,
    freshness_score: score.freshness,
    overall_buyer_score: score.overall,
    score_breakdown: score,
    qualification_reason: score.qualificationReason || null,
    rejection_reason: score.rejectionReason || null,
    updated_at: nowIso(),
  };
}

async function writeBuyerAuditEvent({
  supabase,
  eventType,
  companyId,
  sourceState,
  destinationState,
  reason,
  payload,
}: {
  supabase: SupabaseClient;
  eventType: string;
  companyId: string;
  sourceState: string;
  destinationState: string;
  reason: string;
  payload: Record<string, unknown>;
}) {
  const { error } = await supabase.from("marketvibe_audit_events").insert({
    event_type: eventType,
    actor_type: "system",
    related_record_type: "buyer_company",
    related_record_id: companyId,
    source_state: sourceState,
    destination_state: destinationState,
    reason,
    event_payload: payload,
  });
  if (error) throw error;
}

async function insertCompanyEvidence(supabase: SupabaseClient, companyId: string, item: ImportPersistenceRow) {
  const row = item.row;
  const { error } = await supabase.from("marketvibe_company_evidence").insert({
    buyer_company_id: companyId,
    evidence_type: "imported_source_row",
    source_url: row.public_signal_url || row.company_website || row.company_linkedin_url || row.linkedin_profile_url || null,
    evidence_summary: row.public_signal_text || row.source_note || "Company imported from owner-supplied file.",
    evidence_checksum: item.rowFingerprint || null,
    raw_payload: row.raw_row,
  });
  if (error) throw error;
}

async function queueBuyerPipelineJob({
  supabase,
  companyId,
  allowReactivate,
}: {
  supabase: SupabaseClient;
  companyId: string;
  allowReactivate: boolean;
}) {
  const { data: existing, error } = await supabase
    .from("marketvibe_job_queue")
    .select("id,queue_status")
    .eq("job_name", "website_verification")
    .eq("related_record_type", "buyer_company")
    .eq("related_record_id", companyId)
    .maybeSingle();
  if (error) throw error;

  const existingJob = existing as ExistingPipelineJob | null;
  const timestamp = nowIso();
  if (existingJob) {
    if (ACTIVE_PIPELINE_JOB_STATES.has(existingJob.queue_status)) return { queued: false, alreadyActive: true };
    if (!allowReactivate || !shouldReactivateBuyerPipelineJob(existingJob.queue_status)) return { queued: false, alreadyActive: false };

    const { error: updateError } = await supabase
      .from("marketvibe_job_queue")
      .update({
        queue_status: "queued",
        run_after: timestamp,
        retry_count: 0,
        last_error: null,
        locked_by: null,
        locked_at: null,
        updated_at: timestamp,
      })
      .eq("id", existingJob.id);
    if (updateError) throw updateError;
    return { queued: true, alreadyActive: false };
  }

  const { error: insertError } = await supabase.from("marketvibe_job_queue").insert({
    job_name: "website_verification",
    related_record_type: "buyer_company",
    related_record_id: companyId,
    queue_status: "queued",
    run_after: timestamp,
    updated_at: timestamp,
  });
  if (insertError?.code === "23505") return { queued: false, alreadyActive: true };
  if (insertError) throw insertError;
  return { queued: true, alreadyActive: false };
}

async function updateExistingCompanyImportReference(supabase: SupabaseClient, company: BuyerCompanyLookup, item: ImportPersistenceRow, metadata: PersistedImportMetadata) {
  const update: Record<string, unknown> = { updated_at: nowIso() };
  if (!company.source_imported_prospect_id && item.prospectId) update.source_imported_prospect_id = item.prospectId;
  if (!company.source_import_batch_id) update.source_import_batch_id = metadata.batchId;
  if (!company.original_filename) update.original_filename = metadata.filename;
  if (!company.file_checksum && metadata.fileChecksum) update.file_checksum = metadata.fileChecksum;
  if (!company.row_fingerprint && item.rowFingerprint) update.row_fingerprint = item.rowFingerprint;
  if (Object.keys(update).length === 1) return;

  const { error } = await supabase.from("marketvibe_buyer_companies").update(update).eq("id", company.id);
  if (error) throw error;
}

async function recordExistingCompanyImport({
  supabase,
  company,
  item,
  metadata,
}: {
  supabase: SupabaseClient;
  company: BuyerCompanyLookup;
  item: ImportPersistenceRow;
  metadata: PersistedImportMetadata;
}) {
  await updateExistingCompanyImportReference(supabase, company, item, metadata);
  const buyerStatus = (company.buyer_status || "deduplicated") as BuyerPipelineState;
  const shouldQueue = shouldQueueBuyerPipelineJobForState(buyerStatus);
  const queueResult = shouldQueue
    ? await queueBuyerPipelineJob({ supabase, companyId: company.id, allowReactivate: true })
    : { queued: false, alreadyActive: false };
  const eventType = queueResult.queued ? "buyer_company_refresh_queued" : "buyer_company_duplicate_import";
  const reason = queueResult.queued
    ? "Duplicate import row matched an existing recoverable buyer company, so processing was refreshed without creating another company."
    : "Duplicate import row matched an existing buyer company. Existing processing history was retained.";

  await writeBuyerAuditEvent({
    supabase,
    eventType,
    companyId: company.id,
    sourceState: buyerStatus,
    destinationState: queueResult.queued ? "refresh_queued" : buyerStatus,
    reason,
    payload: { batchId: metadata.batchId, dedupeKey: item.dedupeKey, rowFingerprint: item.rowFingerprint, filename: metadata.filename },
  });

  return { created: false, duplicate: true, queued: queueResult.queued };
}

async function persistBuyerCompanyFromImportRow({
  supabase,
  metadata,
  item,
  duplicateImport,
}: {
  supabase: SupabaseClient;
  metadata: PersistedImportMetadata;
  item: ImportPersistenceRow;
  duplicateImport: boolean;
}) {
  const row = item.row;
  const identityKey = buildBuyerCompanyIdentity(row);
  const { data: existing, error: existingError } = await supabase
    .from("marketvibe_buyer_companies")
    .select("id,buyer_status,source_imported_prospect_id,source_import_batch_id,original_filename,file_checksum,row_fingerprint")
    .eq("identity_key", identityKey)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    return recordExistingCompanyImport({ supabase, company: existing as BuyerCompanyLookup, item, metadata });
  }

  const score = scoreBuyerCompany(row);
  const state = initialBuyerState(row);
  const { data: insertedCompany, error: insertError } = await supabase
    .from("marketvibe_buyer_companies")
    .insert(buyerCompanyInsert(row, item, metadata, state, score))
    .select("id,buyer_status")
    .single();
  if (insertError?.code === "23505") {
    const { data: racedCompany, error: racedError } = await supabase
      .from("marketvibe_buyer_companies")
      .select("id,buyer_status,source_imported_prospect_id,source_import_batch_id,original_filename,file_checksum,row_fingerprint")
      .eq("identity_key", identityKey)
      .maybeSingle();
    if (racedError) throw racedError;
    if (racedCompany) return recordExistingCompanyImport({ supabase, company: racedCompany as BuyerCompanyLookup, item, metadata });
  }
  if (insertError || !insertedCompany) throw insertError || new Error("Buyer company could not be persisted.");

  const companyId = String(insertedCompany.id);
  await writeBuyerAuditEvent({
    supabase,
    eventType: "buyer_company_imported",
    companyId,
    sourceState: "discovered",
    destinationState: state,
    reason: duplicateImport
      ? "Structurally valid duplicate import row had no buyer-company record, so the missing buyer company was backfilled and queued."
      : "Structurally valid imported company was queued for automated buyer-stock processing.",
    payload: { batchId: metadata.batchId, filename: metadata.filename, sourceFormat: metadata.sourceFormat, dedupeKey: item.dedupeKey },
  });
  await insertCompanyEvidence(supabase, companyId, item);

  const queueResult = shouldQueueBuyerPipelineJobForState(state)
    ? await queueBuyerPipelineJob({ supabase, companyId, allowReactivate: false })
    : { queued: false, alreadyActive: false };

  return { created: true, duplicate: false, queued: queueResult.queued };
}

export async function persistImportedBuyerCompanies(input: {
  supabase: SupabaseClient;
  metadata: PersistedImportMetadata;
  insertedRows: ImportPersistenceRow[];
  duplicateRows: ImportPersistenceRow[];
}) {
  const { supabase, metadata } = input;
  let companiesCreated = 0;
  let duplicateCompanies = 0;
  let queuedJobs = 0;

  for (const item of input.insertedRows) {
    const result = await persistBuyerCompanyFromImportRow({ supabase, metadata, item, duplicateImport: false });
    if (result.created) companiesCreated += 1;
    if (result.duplicate) duplicateCompanies += 1;
    if (result.queued) queuedJobs += 1;
  }

  for (const item of input.duplicateRows) {
    const result = await persistBuyerCompanyFromImportRow({ supabase, metadata, item, duplicateImport: true });
    if (result.created) companiesCreated += 1;
    if (result.duplicate) duplicateCompanies += 1;
    if (result.queued) queuedJobs += 1;
  }

  return { companiesCreated, duplicateCompanies, queuedJobs };
}

export async function backfillImportedBuyerCompanies({
  supabase,
  batchId,
  limit = 500,
}: {
  supabase: SupabaseClient;
  batchId?: string;
  limit?: number;
}) {
  let selectedBatch: ImportBatchDbRow | null = null;
  let selectedProspects: ImportedProspectDbRow[] = [];

  if (batchId) {
    const { data: batch, error: batchError } = await supabase
      .from("premium_import_batches")
      .select("id,original_filename,source_format,worksheet_name,file_checksum,row_fingerprints")
      .eq("id", batchId)
      .maybeSingle();
    if (batchError) throw batchError;
    selectedBatch = batch as ImportBatchDbRow | null;
  } else {
    const { data: batches, error: batchesError } = await supabase
      .from("premium_import_batches")
      .select("id,original_filename,source_format,worksheet_name,file_checksum,row_fingerprints")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(25);
    if (batchesError) throw batchesError;

    for (const batch of (batches || []) as ImportBatchDbRow[]) {
      const { data: prospects, error: prospectsError } = await supabase
        .from("premium_imported_prospects")
        .select("*")
        .eq("batch_id", batch.id)
        .order("created_at", { ascending: true })
        .limit(limit);
      if (prospectsError) throw prospectsError;
      if ((prospects || []).length > 0) {
        selectedBatch = batch;
        selectedProspects = prospects as ImportedProspectDbRow[];
        break;
      }
    }
  }

  if (!selectedBatch) {
    return { batchId: null, filename: null, examined: 0, missingBuyerCompanies: 0, companiesCreated: 0, duplicateCompanies: 0, queuedJobs: 0 };
  }

  if (selectedProspects.length === 0) {
    const { data: prospects, error: prospectsError } = await supabase
      .from("premium_imported_prospects")
      .select("*")
      .eq("batch_id", selectedBatch.id)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (prospectsError) throw prospectsError;
    selectedProspects = (prospects || []) as ImportedProspectDbRow[];
  }

  const persistenceRows = selectedProspects.map(importPersistenceRowFromProspect);
  const identities = Array.from(new Set(persistenceRows.map((item) => buildBuyerCompanyIdentity(item.row))));
  const existingIdentities = new Set<string>();
  for (const identityChunk of chunk(identities, 500)) {
    const { data, error } = await supabase
      .from("marketvibe_buyer_companies")
      .select("identity_key")
      .in("identity_key", identityChunk);
    if (error) throw error;
    (data || []).forEach((row) => existingIdentities.add(String(row.identity_key)));
  }

  const missingRows = persistenceRows.filter((item) => !existingIdentities.has(buildBuyerCompanyIdentity(item.row)));
  const result = missingRows.length > 0
    ? await persistImportedBuyerCompanies({
      supabase,
      metadata: {
        batchId: selectedBatch.id,
        filename: selectedBatch.original_filename || "existing-import-backfill",
        sourceFormat: sourceFormatFromBatch(selectedBatch.source_format),
        worksheetName: selectedBatch.worksheet_name || undefined,
        fileChecksum: selectedBatch.file_checksum || undefined,
        rowFingerprints: selectedBatch.row_fingerprints || undefined,
      },
      insertedRows: missingRows,
      duplicateRows: [],
    })
    : { companiesCreated: 0, duplicateCompanies: 0, queuedJobs: 0 };

  return {
    batchId: selectedBatch.id,
    filename: selectedBatch.original_filename || null,
    examined: selectedProspects.length,
    missingBuyerCompanies: missingRows.length,
    ...result,
  };
}

export async function runBuyerPipelineWorker({ supabase, limit = 50, workerId = "marketvibe-worker" }: { supabase: SupabaseClient; limit?: number; workerId?: string }) {
  const lockExpiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  await supabase.from("marketvibe_job_locks").delete().eq("job_name", "website_verification").lte("expires_at", nowIso());
  const { error: lockError } = await supabase.from("marketvibe_job_locks").insert({
    job_name: "website_verification",
    locked_by: workerId,
    expires_at: lockExpiresAt,
  });
  if (lockError?.code === "23505") return { ok: true, skipped: true, reason: "Worker lock is already held.", processed: 0 };
  if (lockError) throw lockError;

  const startedAt = nowIso();
  const { data: run, error: runError } = await supabase.from("marketvibe_job_runs").insert({
    job_name: "website_verification",
    idempotency_key: `website_verification:${startedAt}:${workerId}`,
  }).select("id").single();
  if (runError || !run) throw runError || new Error("Worker run could not be created.");

  let processed = 0;
  let failed = 0;
  let contactsInserted = 0;
  let contactsVerified = 0;
  try {
    const { data: jobs, error } = await supabase
      .from("marketvibe_job_queue")
      .select("*")
      .eq("job_name", "website_verification")
      .in("queue_status", ["queued", "retry_scheduled"])
      .or(`run_after.is.null,run_after.lte.${nowIso()}`)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;

    for (const job of jobs || []) {
      const claimedAt = nowIso();
      const { data: claimedJob, error: claimError } = await supabase
        .from("marketvibe_job_queue")
        .update({
          queue_status: "running",
          locked_by: workerId,
          locked_at: claimedAt,
          updated_at: claimedAt,
        })
        .eq("id", job.id)
        .in("queue_status", ["queued", "retry_scheduled"])
        .select("id")
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimedJob) continue;

      const { data: company, error: companyError } = await supabase
        .from("marketvibe_buyer_companies")
        .select("*")
        .eq("id", job.related_record_id)
        .maybeSingle();
      if (companyError) throw companyError;
      if (!company) {
        failed += 1;
        await supabase.from("marketvibe_job_queue").update({
          queue_status: "permanent_failure",
          last_error: "Buyer company no longer exists.",
          locked_by: null,
          locked_at: null,
          updated_at: nowIso(),
        }).eq("id", job.id);
        continue;
      }

      if (company.source_imported_prospect_id) {
        const timestamp = nowIso();
        await supabase.from("marketvibe_buyer_companies").update({
          buyer_status: "quarantined",
          contact_status: "not_required",
          rejection_reason: "legacy_lead_stock_not_new_model_opportunity",
          updated_at: timestamp,
        }).eq("id", company.id);
        await supabase.from("marketvibe_job_queue").update({
          queue_status: "completed",
          last_error: null,
          locked_by: null,
          locked_at: null,
          updated_at: timestamp,
        }).eq("id", job.id);
        await supabase.from("marketvibe_audit_events").insert({
          event_type: "legacy_lead_stock_quarantined",
          actor_type: "system",
          related_record_type: "buyer_company",
          related_record_id: company.id,
          source_state: company.buyer_status,
          destination_state: "quarantined",
          reason: "Imported Navigator and historical lead stock is owner-only research and cannot enter the new customer opportunity model.",
          job_run_id: run.id,
          retry_count: Number(job.retry_count || 0),
        });
        processed += 1;
        continue;
      }

      const rowLike = {
        company_name: String(company.company_name || ""),
        company_domain: String(company.canonical_domain || ""),
        company_website: String(company.website || ""),
        country: String(company.country || ""),
        city: String(company.city || ""),
        location: Array.isArray(company.operating_locations) ? company.operating_locations.join(", ") : "",
        industry: String(company.sector || ""),
        company_size: String(company.employee_range_estimate || ""),
        public_signal_url: Array.isArray(company.public_evidence_urls) ? String(company.public_evidence_urls[0] || "") : "",
        public_signal_text: String(company.public_evidence_summary || ""),
      };
      const score = scoreBuyerCompany(rowLike);
      const destinationState: BuyerPipelineState = score.overall >= 55 ? "qualified" : "contact_unresolved";
      await supabase.from("marketvibe_buyer_companies").update({
        buyer_status: destinationState,
        contact_status: "unresolved",
        website_status: company.website || company.canonical_domain ? "verified" : "skipped",
        last_verified_date: nowIso(),
        sector_fit_score: score.sectorFit,
        geography_fit_score: score.geographyFit,
        capacity_score: score.capacity,
        commercial_fit_score: score.commercialFit,
        freshness_score: score.freshness,
        overall_buyer_score: score.overall,
        score_breakdown: score,
        qualification_reason: score.qualificationReason || null,
        rejection_reason: score.rejectionReason || null,
        updated_at: nowIso(),
      }).eq("id", company.id);
      await supabase.from("marketvibe_score_breakdowns").insert({
        record_type: "buyer_company",
        record_id: company.id,
        scoring_version: "buyer-import-v1",
        total_score: score.overall,
        threshold_used: 55,
        final_classification: destinationState,
        components: score,
      });
      await supabase.from("marketvibe_audit_events").insert({
        event_type: "buyer_company_worker_transition",
        actor_type: "system",
        related_record_type: "buyer_company",
        related_record_id: company.id,
        source_state: company.buyer_status,
        destination_state: destinationState,
        reason: score.qualificationReason || score.rejectionReason || "Buyer company processed by website verification and scoring worker.",
        job_run_id: run.id,
        retry_count: Number(job.retry_count || 0),
      });
      let enrichment;
      try {
        enrichment = await enrichBuyerCompanyRecord({
          supabase,
          company: {
            ...company,
            overall_buyer_score: score.overall,
            buyer_status: destinationState,
          },
        });
      } catch (enrichmentError) {
        failed += 1;
        const retryCount = Number(job.retry_count || 0) + 1;
        const permanent = retryCount >= 3;
        const failureMessage = enrichmentError instanceof Error ? enrichmentError.message : "Buyer enrichment failed.";
        await supabase.from("marketvibe_job_queue").update({
          queue_status: permanent ? "permanent_failure" : "retry_scheduled",
          retry_count: retryCount,
          run_after: new Date(Date.now() + Math.min(24, 2 ** retryCount) * 60 * 60_000).toISOString(),
          last_error: failureMessage,
          locked_by: null,
          locked_at: null,
          updated_at: nowIso(),
        }).eq("id", job.id);
        await supabase.from("marketvibe_audit_events").insert({
          event_type: permanent ? "buyer_company_enrichment_permanent_failure" : "buyer_company_enrichment_retry_scheduled",
          actor_type: "system",
          related_record_type: "buyer_company",
          related_record_id: company.id,
          source_state: destinationState,
          destination_state: permanent ? "quarantined" : "retry_scheduled",
          reason: failureMessage,
          job_run_id: run.id,
          retry_count: retryCount,
        });
        if (permanent) {
          await supabase.from("marketvibe_exceptions").insert({
            category: "buyer_enrichment",
            title: `Buyer enrichment failed for ${String(company.company_name || "company")}`,
            explanation: failureMessage,
            affected_record_type: "buyer_company",
            affected_record_id: company.id,
            supporting_evidence: { retry_count: retryCount, worker_id: workerId },
            recommended_action: "Review the public source, provider availability, and contact provenance before retrying.",
            commercial_impact: "Company cannot enter active MarketVibe outreach without a verified business contact route.",
            severity: "high",
          });
        }
        continue;
      }
      contactsInserted += enrichment.insertedContacts;
      contactsVerified += enrichment.verifiedEmails;
      await supabase.from("marketvibe_audit_events").insert({
        event_type: "buyer_company_enrichment_completed",
        actor_type: "system",
        related_record_type: "buyer_company",
        related_record_id: company.id,
        source_state: destinationState,
        destination_state: enrichment.destinationState,
        reason: enrichment.verifiedEmails > 0
          ? `${enrichment.verifiedEmails} public business email address(es) passed company-domain and MX verification.`
          : enrichment.namedContacts > 0
            ? `${enrichment.namedContacts} named public or licensed contact(s) were resolved without a verified email.`
            : "No verified business contact route was resolved; the company remains out of active outreach.",
        job_run_id: run.id,
        retry_count: Number(job.retry_count || 0),
        event_payload: enrichment,
      });
      await supabase.from("marketvibe_job_queue").update({
        queue_status: "completed",
        locked_by: null,
        locked_at: null,
        updated_at: nowIso(),
      }).eq("id", job.id);
      processed += 1;
    }

    await supabase.from("marketvibe_job_runs").update({
      status: failed ? "partial" : "completed",
      completed_at: nowIso(),
      last_successful: failed ? null : nowIso(),
      records_attempted: (jobs || []).length,
      records_succeeded: processed,
      records_failed: failed,
      error_summary: {
        contacts_inserted: contactsInserted,
        contacts_verified: contactsVerified,
      },
    }).eq("id", run.id);
    return { ok: true, skipped: false, processed, failed, contactsInserted, contactsVerified, runId: run.id as string };
  } finally {
    await supabase.from("marketvibe_job_locks").delete().eq("job_name", "website_verification").eq("locked_by", workerId);
  }
}

export class InMemoryOperationsStore {
  companies = new Map<string, MemoryBuyerCompany>();
  auditEvents: MemoryAuditEvent[] = [];
  jobs: MemoryJob[] = [];
  private sequence = 1;

  static fromSnapshot(snapshot: ReturnType<InMemoryOperationsStore["snapshot"]>) {
    const store = new InMemoryOperationsStore();
    store.companies = new Map(snapshot.companies.map((company) => [company.identityKey, company]));
    store.auditEvents = snapshot.auditEvents;
    store.jobs = snapshot.jobs;
    store.sequence = snapshot.sequence;
    return store;
  }

  snapshot() {
    return {
      companies: Array.from(this.companies.values()),
      auditEvents: this.auditEvents,
      jobs: this.jobs,
      sequence: this.sequence,
    };
  }

  private nextId(prefix: string) {
    const id = `${prefix}_${this.sequence}`;
    this.sequence += 1;
    return id;
  }

  private audit(company: MemoryBuyerCompany, sourceState: string, destinationState: string, reason: string, eventType = "buyer_company_transition") {
    const event: MemoryAuditEvent = {
      id: this.nextId("audit"),
      eventType,
      relatedRecordId: company.id,
      sourceState,
      destinationState,
      reason,
      actorType: "system",
      retryCount: 0,
      createdAt: nowIso(),
    };
    this.auditEvents.push(event);
    company.auditEventIds.push(event.id);
  }

  importPreview(preview: ImportPreview): MemoryImportResult {
    let validRows = 0;
    let rejectedRows = 0;
    let duplicateRows = 0;
    let companiesCreated = 0;
    let queuedJobs = 0;

    preview.rows.forEach((raw, index) => {
      const mapped = mapRow(raw, preview.mapping);
      if (validateMappedRow(mapped)) {
        rejectedRows += 1;
        return;
      }
      validRows += 1;
      const row = enrichComputedFields(mapped, raw, null);
      const identityKey = buildBuyerCompanyIdentity(row);
      const existing = this.companies.get(identityKey);
      if (existing) {
        duplicateRows += 1;
        this.audit(existing, existing.buyerStatus, existing.buyerStatus, "Duplicate import row matched this existing company. Existing processing history was retained.", "buyer_company_duplicate_import");
        return;
      }
      const score = scoreBuyerCompany(row);
      const state = initialBuyerState(row);
      const company: MemoryBuyerCompany = {
        id: this.nextId("company"),
        identityKey,
        companyName: row.company_name,
        website: row.company_website,
        canonicalDomain: normalizeDomain(row.company_domain || domainFromUrl(row.company_website)),
        country: row.country,
        city: row.city,
        sector: row.industry,
        companySize: row.company_size,
        buyerStatus: state,
        contactStatus: "unresolved",
        websiteStatus: state === "website_verification_queued" ? "queued" : "skipped",
        score,
        auditEventIds: [],
      };
      this.companies.set(identityKey, company);
      companiesCreated += 1;
      this.audit(company, "discovered", state, "Structurally valid imported company was queued for downstream buyer processing.", "buyer_company_imported");
      if (state === "website_verification_queued") {
        this.jobs.push({
          id: this.nextId("job"),
          jobName: "website_verification",
          relatedRecordId: company.id,
          status: "queued",
          retryCount: 0,
          lastError: "",
        });
        queuedJobs += 1;
      }
      const rowFingerprint = preview.rowFingerprints[index] || buildDedupeKey(row);
      if (rowFingerprint) {
        this.audit(company, state, state, `Row fingerprint ${rowFingerprint} archived for duplicate protection.`, "buyer_company_row_fingerprint");
      }
    });

    return {
      totalRows: preview.rows.length,
      validRows,
      rejectedRows,
      duplicateRows,
      companiesCreated,
      companiesRemaining: this.companies.size,
      queuedJobs,
      summary: `${companiesCreated} companies created, ${duplicateRows} duplicates, ${rejectedRows} rejected.`,
    };
  }

  runWorker() {
    let processed = 0;
    for (const job of this.jobs.filter((item) => item.status === "queued" || item.status === "retry_scheduled")) {
      const company = Array.from(this.companies.values()).find((item) => item.id === job.relatedRecordId);
      if (!company) {
        job.status = "permanent_failure";
        job.lastError = "Buyer company no longer exists.";
        continue;
      }
      job.status = "running";
      const sourceState = company.buyerStatus;
      company.websiteStatus = company.website || company.canonicalDomain ? "verified" : "skipped";
      company.score = scoreBuyerCompany({
        company_name: company.companyName,
        company_domain: company.canonicalDomain,
        company_website: company.website,
        country: company.country,
        city: company.city,
        location: [company.city, company.country].filter(Boolean).join(", "),
        industry: company.sector,
        company_size: company.companySize,
        public_signal_url: "",
        public_signal_text: "",
      });
      company.buyerStatus = company.score.overall >= 55 ? "qualified" : "contact_unresolved";
      company.contactStatus = "unresolved";
      this.audit(company, sourceState, company.buyerStatus, company.score.qualificationReason || company.score.rejectionReason || "Buyer worker completed scoring.");
      job.status = "completed";
      processed += 1;
    }
    return { processed, states: Array.from(new Set(Array.from(this.companies.values()).map((company) => company.buyerStatus))) };
  }
}

export function mappedRowsFromPreview(preview: ImportPreview) {
  return preview.rows
    .map((raw) => {
      const mapped = mapRow(raw, preview.mapping);
      const validationError = validateMappedRow(mapped);
      if (validationError || !hasAnyUsableSourceReference(mapped)) return null;
      return enrichComputedFields(mapped, raw, null);
    })
    .filter(Boolean) as ImportedProspectInput[];
}
