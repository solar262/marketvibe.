import type { getSupabaseAdmin } from "@/lib/supabase";
import {
  buildDedupeKey,
  domainFromUrl,
  enrichComputedFields,
  hasAnyUsableSourceReference,
  mapRow,
  normalizeDomain,
  normalizeHttpUrl,
  normalizeLinkedInUrl,
  normalizeText,
  validateMappedRow,
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

function nowIso() {
  return new Date().toISOString();
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
    const row = item.row;
    const identityKey = buildBuyerCompanyIdentity(row);
    const score = scoreBuyerCompany(row);
    const state = initialBuyerState(row);
    const { data: company, error } = await supabase
      .from("marketvibe_buyer_companies")
      .upsert({
        identity_key: identityKey,
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
      }, { onConflict: "identity_key" })
      .select("id,buyer_status")
      .single();
    if (error || !company) throw error || new Error("Buyer company could not be persisted.");
    companiesCreated += 1;

    await supabase.from("marketvibe_audit_events").insert({
      event_type: "buyer_company_imported",
      actor_type: "system",
      related_record_type: "buyer_company",
      related_record_id: company.id,
      source_state: "discovered",
      destination_state: state,
      reason: "Structurally valid imported company was queued for automated buyer-stock processing.",
      event_payload: { batchId: metadata.batchId, filename: metadata.filename, sourceFormat: metadata.sourceFormat },
    });
    await supabase.from("marketvibe_company_evidence").insert({
      buyer_company_id: company.id,
      evidence_type: "imported_source_row",
      source_url: row.public_signal_url || row.company_website || row.company_linkedin_url || row.linkedin_profile_url || null,
      evidence_summary: row.public_signal_text || row.source_note || "Company imported from owner-supplied file.",
      evidence_checksum: item.rowFingerprint || null,
      raw_payload: row.raw_row,
    });
    if (state === "website_verification_queued") {
      await supabase.from("marketvibe_job_queue").upsert({
        job_name: "website_verification",
        related_record_type: "buyer_company",
        related_record_id: company.id,
        queue_status: "queued",
        updated_at: nowIso(),
      }, { onConflict: "job_name,related_record_type,related_record_id" });
      queuedJobs += 1;
    }
  }

  for (const item of input.duplicateRows) {
    const identityKey = buildBuyerCompanyIdentity(item.row);
    const { data: company } = await supabase
      .from("marketvibe_buyer_companies")
      .select("id,buyer_status")
      .eq("identity_key", identityKey)
      .maybeSingle();
    if (!company) continue;
    duplicateCompanies += 1;
    await supabase.from("marketvibe_audit_events").insert({
      event_type: "buyer_company_duplicate_import",
      actor_type: "system",
      related_record_type: "buyer_company",
      related_record_id: company.id,
      source_state: company.buyer_status || "deduplicated",
      destination_state: company.buyer_status || "deduplicated",
      reason: "Duplicate import row matched an existing buyer company. Existing processing history was retained.",
      event_payload: { batchId: metadata.batchId, dedupeKey: item.dedupeKey, rowFingerprint: item.rowFingerprint },
    });
  }

  return { companiesCreated, duplicateCompanies, queuedJobs };
}

export async function runBuyerPipelineWorker({ supabase, limit = 50, workerId = "marketvibe-worker" }: { supabase: SupabaseClient; limit?: number; workerId?: string }) {
  const lockExpiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
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
  try {
    const { data: jobs, error } = await supabase
      .from("marketvibe_job_queue")
      .select("*")
      .eq("job_name", "website_verification")
      .in("queue_status", ["queued", "retry_scheduled"])
      .lte("run_after", nowIso())
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;

    for (const job of jobs || []) {
      const { data: company, error: companyError } = await supabase
        .from("marketvibe_buyer_companies")
        .select("*")
        .eq("id", job.related_record_id)
        .maybeSingle();
      if (companyError) throw companyError;
      if (!company) {
        failed += 1;
        await supabase.from("marketvibe_job_queue").update({ queue_status: "permanent_failure", last_error: "Buyer company no longer exists.", updated_at: nowIso() }).eq("id", job.id);
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
      await supabase.from("marketvibe_job_queue").update({ queue_status: "completed", updated_at: nowIso() }).eq("id", job.id);
      processed += 1;
    }

    await supabase.from("marketvibe_job_runs").update({
      status: failed ? "partial" : "completed",
      completed_at: nowIso(),
      last_successful: failed ? null : nowIso(),
      records_attempted: (jobs || []).length,
      records_succeeded: processed,
      records_failed: failed,
    }).eq("id", run.id);
    return { ok: true, skipped: false, processed, failed, runId: run.id as string };
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
