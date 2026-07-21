import { formatSupabaseServerEnvError, getSupabaseAdmin } from "@/lib/supabase";
import { sendTransactionalEmail } from "@/lib/brevo";
import { getPremiumEntitlements } from "@/lib/premium-persistence";
import type { PremiumProductCode } from "@/lib/premium-products";
import { appendCustomerAccessParams, createCustomerAccessToken } from "@/lib/customer-access";
import { syncApprovedNavigatorProspectsToOpportunities } from "@/lib/opportunity-engine";
import { persistImportedBuyerCompanies, type ImportPersistenceRow } from "@/lib/operations-pipeline";
import {
  buildDeliveryCsv,
  buildDedupeKey,
  calculateFitScore,
  calculateIntentScore,
  classifyEvidenceStatus,
  deliveryToken,
  enrichComputedFields,
  evidenceSummary,
  hasAnyUsableSourceReference,
  mapRow,
  MAX_IMPORT_ROWS,
  fingerprintRawRow,
  scanPublicWebsite,
  suggestedOutreachAngle,
  tokenHash,
  validateMappedRow,
  type ColumnMapping,
  type ImportedProspectInput,
  type ImportField,
  type WebsiteScan,
} from "@/lib/sales-navigator-import";

type ProspectRow = Partial<Record<ImportField, string | null>> & {
  id?: string;
  fit_score?: number | null;
  intent_score?: number | null;
  evidence_status?: string | null;
  evidence_summary?: string | null;
  enrichment_status?: string | null;
  review_status?: string | null;
  inventory_status?: string | null;
  is_test_data?: boolean | null;
  website_scan?: WebsiteScan | Record<string, unknown> | null;
  suggested_outreach_angle?: string | null;
  delivered_at?: string | null;
  product_code?: string | null;
  [key: string]: unknown;
};

type DeliveryAssignmentRow = {
  delivered_at?: string | null;
  delivery_batch_id?: string | null;
  product_code?: string | null;
  premium_imported_prospects?: ProspectRow | ProspectRow[] | null;
};

export type DeliveredProspect = ProspectRow & {
  delivered_at?: string | null;
  product_code?: string | null;
  suggested_outreach_angle: string;
};

function supabaseOrThrow() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error(formatSupabaseServerEnvError() || "Supabase privileged access is required for imports.");
  return supabase;
}

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

const AUTO_FULFILLMENT_TARGETS: Record<PremiumProductCode, number> = {
  proof_pack: 25,
  radar: 30,
  growth_desk: 50,
};

const AUTO_FULFILLMENT_MINIMUMS: Record<PremiumProductCode, number> = {
  proof_pack: 10,
  radar: 10,
  growth_desk: 15,
};

const LEGACY_IMPORTED_CUSTOMER_DELIVERY_RETIRED = true;

const AUTO_MATCH_STOP_WORDS = new Set([
  "and",
  "are",
  "business",
  "businesses",
  "client",
  "clients",
  "companies",
  "company",
  "customer",
  "customers",
  "delivery",
  "for",
  "from",
  "growth",
  "lead",
  "leads",
  "market",
  "marketing",
  "more",
  "need",
  "needs",
  "new",
  "offer",
  "opportunity",
  "prospect",
  "prospects",
  "service",
  "services",
  "that",
  "the",
  "their",
  "with",
]);

type AutoFulfillmentProfile = {
  niche?: string;
  country?: string;
  city?: string;
  territory?: string;
  serviceOffer?: string;
  idealBuyer?: string;
};

function normalizeAutoMatchText(value: unknown) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function autoMatchTokens(value: unknown) {
  return normalizeAutoMatchText(value)
    .split(" ")
    .filter((token) => token.length >= 4 && !AUTO_MATCH_STOP_WORDS.has(token));
}

function prospectMatchText(prospect: ProspectRow) {
  return normalizeAutoMatchText([
    prospect.company_name,
    prospect.job_title,
    prospect.industry,
    prospect.company_size,
    prospect.location,
    prospect.country,
    prospect.city,
    prospect.public_signal_text,
    prospect.evidence_summary,
    prospect.source_note,
  ].filter(Boolean).join(" "));
}

function locationMatches(prospect: ProspectRow, profile: AutoFulfillmentProfile) {
  const requested = normalizeAutoMatchText([profile.country, profile.city, profile.territory].filter(Boolean).join(" "));
  if (!requested) return true;
  const supplied = normalizeAutoMatchText([prospect.country, prospect.city, prospect.location].filter(Boolean).join(" "));
  if (!supplied) return true;
  const requestedTokens = autoMatchTokens(requested);
  return requestedTokens.length === 0 || requestedTokens.some((token) => supplied.includes(token));
}

function profileTokens(profile: AutoFulfillmentProfile) {
  return autoMatchTokens([profile.niche, profile.serviceOffer, profile.idealBuyer].filter(Boolean).join(" "));
}

export function importedProspectAutoMatchScore(prospect: ProspectRow, profile: AutoFulfillmentProfile) {
  if (prospect.review_status !== "approved") return 0;
  if (prospect.is_test_data || prospect.inventory_status === "rejected") return 0;
  if (prospect.evidence_status === "profile_only") return 0;
  if (!locationMatches(prospect, profile)) return 0;

  const text = prospectMatchText(prospect);
  const tokens = profileTokens(profile);
  const tokenHits = tokens.filter((token) => text.includes(token));
  if (tokens.length > 0 && tokenHits.length === 0) return 0;
  const evidenceBoost = prospect.evidence_status === "public_signal_verified" ? 25 : prospect.evidence_status === "website_verified" ? 15 : 0;
  const intentScore = typeof prospect.intent_score === "number" ? prospect.intent_score : 0;
  const fitScore = typeof prospect.fit_score === "number" ? prospect.fit_score : 0;
  const tokenScore = Math.min(30, tokenHits.length * 10);
  const locationBoost = locationMatches(prospect, profile) ? 10 : 0;
  const score = Math.round((fitScore * 0.35) + (intentScore * 0.35) + tokenScore + evidenceBoost + locationBoost);
  return Math.min(100, score);
}

export function importedProspectMatchesFulfillmentProfile(prospect: ProspectRow, profile: AutoFulfillmentProfile) {
  return importedProspectAutoMatchScore(prospect, profile) >= 45;
}

export async function importProspectsFromRows({
  filename,
  rows,
  mapping,
  sourceFormat = "csv",
  worksheetName,
  fileChecksum,
  rowFingerprints,
  approveValidRows = false,
}: {
  filename: string;
  rows: Record<string, string>[];
  mapping: ColumnMapping;
  sourceFormat?: "csv" | "xlsx" | "quick_paste";
  worksheetName?: string;
  fileChecksum?: string;
  rowFingerprints?: string[];
  approveValidRows?: boolean;
}) {
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error("CSV has too many rows. Maximum rows per upload is 10,000.");
  }

  const supabase = supabaseOrThrow();
  const computed: ImportedProspectInput[] = [];
  const rejected: Array<{ index: number; reason: string }> = [];
  const uploadDedupe = new Set<string>();
  let duplicateRows = 0;
  let missingCompany = 0;
  let missingReferences = 0;

  rows.forEach((raw, index) => {
    const mapped = mapRow(raw, mapping);
    if (!mapped.company_name) missingCompany += 1;
    if (!hasAnyUsableSourceReference(mapped)) missingReferences += 1;
    const validationError = validateMappedRow(mapped);
    const dedupe = buildDedupeKey(mapped);
    if (validationError) {
      rejected.push({ index, reason: validationError });
      return;
    }
    if (!dedupe) {
      rejected.push({ index, reason: "A dedupe key could not be generated." });
      return;
    }
    if (uploadDedupe.has(dedupe)) {
      duplicateRows += 1;
      return;
    }
    uploadDedupe.add(dedupe);
    computed.push(enrichComputedFields(mapped, raw, null));
  });

  const dedupeKeys = computed.map((row) => row.dedupe_key);
  const existing = new Map<string, string>();
  for (const keyChunk of chunk(dedupeKeys, 500)) {
    const { data, error } = await supabase
      .from("premium_imported_prospects")
      .select("id,dedupe_key")
      .in("dedupe_key", keyChunk);
    if (error) throw error;
    (data || []).forEach((row) => existing.set(String(row.dedupe_key), String(row.id)));
  }

  const rowsToInsert = computed.filter((row) => !existing.has(row.dedupe_key));
  const duplicateComputedRows = computed.filter((row) => existing.has(row.dedupe_key));
  duplicateRows += computed.length - rowsToInsert.length;

  const { data: batch, error: batchError } = await supabase
    .from("premium_import_batches")
    .insert({
      source_type: "sales_navigator_csv",
      original_filename: filename,
      status: "importing",
      total_rows: rows.length,
      valid_rows: computed.length,
      imported_rows: 0,
      duplicate_rows: duplicateRows,
      rejected_rows: rejected.length,
      mapping,
      source_format: sourceFormat,
      worksheet_name: worksheetName || null,
      file_checksum: fileChecksum || null,
      row_fingerprints: rowFingerprints || [],
      error_summary: { rejected, missingCompany, missingReferences },
    })
    .select("id")
    .single();
  if (batchError || !batch) throw batchError || new Error("Import batch could not be created.");

  const insertedByDedupeKey = new Map<string, string>();
  if (rowsToInsert.length > 0) {
    const insertRows = rowsToInsert.map((row) => prospectToDbRow(row, batch.id));
    for (const insertChunk of chunk(insertRows, 500)) {
      const { data, error } = await supabase.from("premium_imported_prospects").insert(insertChunk).select("id,dedupe_key");
      if (error) throw error;
      (data || []).forEach((row) => insertedByDedupeKey.set(String(row.dedupe_key), String(row.id)));
    }
  }

  let approvedRows = 0;
  let approvedProspectIds: string[] = [];
  if (approveValidRows) {
    const approvableIds = new Set<string>();
    for (const row of computed) {
      if (row.evidence_status === "profile_only") continue;
      const id = insertedByDedupeKey.get(row.dedupe_key) || existing.get(row.dedupe_key);
      if (id) approvableIds.add(id);
    }
    const approvedAt = new Date().toISOString();
    for (const idChunk of chunk(Array.from(approvableIds), 500)) {
      const { error } = await supabase
        .from("premium_imported_prospects")
        .update({ review_status: "approved", updated_at: approvedAt })
        .in("id", idChunk);
      if (error) throw error;
      approvedRows += idChunk.length;
    }
    approvedProspectIds = Array.from(approvableIds);
  }

  const opportunitySync = approvedProspectIds.length > 0
    ? await syncApprovedNavigatorProspectsToOpportunities({ prospectIds: approvedProspectIds, trigger: "admin" })
    : { records_discovered: 0, records_qualified: 0, records_rejected: 0, records_added_to_inventory: 0, duplicate_count: 0 };

  let pipelineResult = { companiesCreated: 0, duplicateCompanies: 0, queuedJobs: 0 };
  if (computed.length > 0) {
    const insertedRows: ImportPersistenceRow[] = rowsToInsert.map((row) => ({
      row,
      prospectId: insertedByDedupeKey.get(row.dedupe_key),
      dedupeKey: row.dedupe_key,
      rowFingerprint: fingerprintRawRow(row.raw_row),
    }));
    const duplicateRowsForPipeline: ImportPersistenceRow[] = duplicateComputedRows.map((row) => ({
      row,
      prospectId: existing.get(row.dedupe_key),
      dedupeKey: row.dedupe_key,
      rowFingerprint: fingerprintRawRow(row.raw_row),
    }));
    pipelineResult = await persistImportedBuyerCompanies({
      supabase,
      metadata: {
        batchId: String(batch.id),
        filename,
        sourceFormat,
        worksheetName,
        fileChecksum,
        rowFingerprints,
      },
      insertedRows,
      duplicateRows: duplicateRowsForPipeline,
    });
  }

  const { error: updateError } = await supabase
    .from("premium_import_batches")
    .update({
      status: "completed",
      imported_rows: rowsToInsert.length,
      import_summary: {
        sourceRecordsPersisted: rowsToInsert.length,
        buyerCompaniesCreated: pipelineResult.companiesCreated,
        duplicateCompanies: pipelineResult.duplicateCompanies,
        websiteVerificationJobsQueued: pipelineResult.queuedJobs,
        opportunitiesDiscovered: opportunitySync.records_discovered,
        opportunitiesQualified: opportunitySync.records_qualified,
        opportunitiesRejected: opportunitySync.records_rejected,
        opportunitiesAddedToInventory: opportunitySync.records_added_to_inventory,
        opportunityDuplicates: opportunitySync.duplicate_count,
      },
      completed_at: new Date().toISOString(),
    })
    .eq("id", batch.id);
  if (updateError) throw updateError;

  return {
    batchId: batch.id as string,
    totalRows: rows.length,
    validRows: computed.length,
    importedRows: rowsToInsert.length,
    duplicateRows,
    rejectedRows: rejected.length,
    approvedRows,
    opportunitiesDiscovered: opportunitySync.records_discovered,
    opportunitiesQualified: opportunitySync.records_qualified,
    opportunitiesRejected: opportunitySync.records_rejected,
    opportunitiesAddedToInventory: opportunitySync.records_added_to_inventory,
    opportunityDuplicates: opportunitySync.duplicate_count,
    buyerCompaniesCreated: pipelineResult.companiesCreated,
    duplicateCompanies: pipelineResult.duplicateCompanies,
    websiteVerificationJobsQueued: pipelineResult.queuedJobs,
  };
}

function prospectToDbRow(row: ImportedProspectInput, batchId: string) {
  return {
    batch_id: batchId,
    first_name: row.first_name || null,
    last_name: row.last_name || null,
    full_name: row.full_name || null,
    job_title: row.job_title || null,
    company_name: row.company_name,
    company_domain: row.company_domain || null,
    company_website: row.company_website || null,
    linkedin_profile_url: row.linkedin_profile_url || null,
    company_linkedin_url: row.company_linkedin_url || null,
    location: row.location || null,
    country: row.country || null,
    city: row.city || null,
    industry: row.industry || null,
    company_size: row.company_size || null,
    public_email: row.public_email || null,
    public_phone: row.public_phone || null,
    public_signal_url: row.public_signal_url || null,
    public_signal_text: row.public_signal_text || null,
    source_note: row.source_note || null,
    raw_row: row.raw_row,
    dedupe_key: row.dedupe_key,
    fit_score: row.fit_score,
    intent_score: row.intent_score,
    evidence_status: row.evidence_status,
    evidence_summary: row.evidence_summary,
    enrichment_status: row.enrichment_status,
    website_scan: row.website_scan || {},
    review_status: "pending",
  };
}

export async function listImportBatches() {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from("premium_import_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw error;
  return data || [];
}

export async function listImportedProspects(filters: Record<string, string> = {}) {
  const supabase = supabaseOrThrow();
  let query = supabase
    .from("premium_imported_prospects")
    .select("*, premium_prospect_assignments(customer_email,product_code,assignment_status,delivered_at)")
    .order("created_at", { ascending: false })
    .limit(250);

  if (filters.batchId) query = query.eq("batch_id", filters.batchId);
  if (filters.evidenceStatus) query = query.eq("evidence_status", filters.evidenceStatus);
  if (filters.enrichmentStatus) query = query.eq("enrichment_status", filters.enrichmentStatus);
  if (filters.country) query = query.ilike("country", `%${filters.country}%`);
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.industry) query = query.ilike("industry", `%${filters.industry}%`);
  if (filters.company) query = query.ilike("company_name", `%${filters.company}%`);
  if (filters.minFitScore) query = query.gte("fit_score", Number(filters.minFitScore));

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateProspectReview(ids: string[], reviewStatus: "approved" | "rejected" | "pending", adminNote?: string) {
  const supabase = supabaseOrThrow();
  if (ids.length === 0) throw new Error("Select at least one record.");

  const update: Record<string, unknown> = {
    review_status: reviewStatus,
    updated_at: new Date().toISOString(),
  };
  if (adminNote) update.source_note = adminNote;

  const { error } = await supabase.from("premium_imported_prospects").update(update).in("id", ids);
  if (error) throw error;
  const opportunitySync = reviewStatus === "approved"
    ? await syncApprovedNavigatorProspectsToOpportunities({ prospectIds: ids, trigger: "admin" })
    : null;
  return {
    updated: ids.length,
    opportunitiesAddedToInventory: opportunitySync?.records_added_to_inventory || 0,
    opportunitiesQualified: opportunitySync?.records_qualified || 0,
    opportunityDuplicates: opportunitySync?.duplicate_count || 0,
    opportunitiesRejected: opportunitySync?.records_rejected || 0,
  };
}

export async function enrichProspects(ids: string[]) {
  const supabase = supabaseOrThrow();
  if (ids.length === 0) throw new Error("Select at least one record.");
  const { data, error } = await supabase.from("premium_imported_prospects").select("*").in("id", ids);
  if (error) throw error;

  const results = [];
  for (const prospect of data || []) {
    const url = String(prospect.company_website || prospect.public_signal_url || "");
    if (!url) {
      await updateEnrichment(prospect.id, "skipped", null, "No company website or public source URL was supplied.");
      results.push({ id: prospect.id, status: "skipped" });
      continue;
    }
    try {
      const scan = await scanPublicWebsite(url);
      const row = dbProspectToMapped(prospect);
      const evidenceStatus = classifyEvidenceStatus(row, scan);
      const intentScore = calculateIntentScore(row, scan);
      const fitScore = calculateFitScore(row);
      const update = {
        public_email: prospect.public_email || scan.publicEmail || null,
        public_phone: prospect.public_phone || scan.publicPhone || null,
        company_website: scan.finalUrl || prospect.company_website,
        evidence_status: evidenceStatus,
        evidence_summary: evidenceSummary(row, scan, evidenceStatus),
        intent_score: intentScore,
        fit_score: fitScore,
        enrichment_status: "enriched",
        website_scan: scan,
        updated_at: new Date().toISOString(),
      };
      const { error: updateError } = await supabase.from("premium_imported_prospects").update(update).eq("id", prospect.id);
      if (updateError) throw updateError;
      results.push({ id: prospect.id, status: "enriched" });
    } catch (enrichmentError) {
      await updateEnrichment(prospect.id, "failed", null, enrichmentError instanceof Error ? enrichmentError.message : "Enrichment failed.");
      results.push({ id: prospect.id, status: "failed" });
    }
  }

  return { results };
}

async function updateEnrichment(id: string, status: "skipped" | "failed", scan: WebsiteScan | null, summary: string) {
  const supabase = supabaseOrThrow();
  const { error } = await supabase
    .from("premium_imported_prospects")
    .update({
      enrichment_status: status,
      website_scan: scan || {},
      evidence_summary: summary,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

function dbProspectToMapped(prospect: ProspectRow) {
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

export async function assignProspects({
  ids,
  customerEmail,
  productCode,
  adminConfirmedCustomer,
  adminNotes,
  onboardingId,
}: {
  ids: string[];
  customerEmail: string;
  productCode: PremiumProductCode;
  adminConfirmedCustomer: boolean;
  adminNotes?: string;
  onboardingId?: string | null;
}) {
  const supabase = supabaseOrThrow();
  const email = normalizedEmail(customerEmail);
  await assertCanAssignCustomer(email, adminConfirmedCustomer);
  if (ids.length === 0) throw new Error("Select at least one record.");

  const rows = ids.map((id) => ({
    prospect_id: id,
    customer_email: email,
    product_code: productCode,
    onboarding_id: onboardingId || null,
    assignment_status: "assigned",
    admin_notes: adminNotes || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("premium_prospect_assignments")
    .upsert(rows, { onConflict: "prospect_id,customer_email,product_code" });
  if (error) throw error;

  return { assigned: rows.length };
}

export async function removeAssignments(ids: string[]) {
  const supabase = supabaseOrThrow();
  if (ids.length === 0) throw new Error("Select at least one record.");
  const { error } = await supabase
    .from("premium_prospect_assignments")
    .update({ assignment_status: "removed", updated_at: new Date().toISOString() })
    .in("prospect_id", ids);
  if (error) throw error;
  return { removed: ids.length };
}

export async function assertCanAssignCustomer(email: string, adminConfirmedCustomer: boolean) {
  if (adminConfirmedCustomer) return true;
  const entitlements = await getPremiumEntitlements(email);
  if (entitlements.length === 0) throw new Error("Customer has no active premium entitlement. Use administrator confirmation to override.");
  return true;
}

export function canCustomerAccessDelivery({
  requestedEmail,
  batchEmail,
  token,
  tokenHashValue,
}: {
  requestedEmail: string;
  batchEmail: string;
  token: string;
  tokenHashValue: string;
}) {
  return normalizedEmail(requestedEmail) === normalizedEmail(batchEmail) && Boolean(token) && tokenHash(token) === tokenHashValue;
}

export async function publishProspects({
  ids,
  customerEmail,
  productCode,
  adminConfirmedCustomer,
  adminNotes,
  includeProfileOnly,
  onboardingId,
}: {
  ids: string[];
  customerEmail: string;
  productCode: PremiumProductCode;
  adminConfirmedCustomer: boolean;
  adminNotes?: string;
  includeProfileOnly: boolean;
  onboardingId?: string | null;
}) {
  if (LEGACY_IMPORTED_CUSTOMER_DELIVERY_RETIRED) {
    throw new Error("Direct imported-prospect delivery is retired. Use qualified Opportunity Inventory assignments.");
  }
  const supabase = supabaseOrThrow();
  const email = normalizedEmail(customerEmail);
  await assertCanAssignCustomer(email, adminConfirmedCustomer);
  if (ids.length === 0) throw new Error("Select at least one record.");

  const { data: prospects, error: prospectError } = await supabase
    .from("premium_imported_prospects")
    .select("*")
    .in("id", ids)
    .eq("review_status", "approved");
  if (prospectError) throw prospectError;
  if (!prospects || prospects.length === 0) throw new Error("No approved records were selected.");
  const profileOnly = prospects.filter((prospect) => prospect.evidence_status === "profile_only");
  if (profileOnly.length > 0 && !includeProfileOnly) {
    throw new Error("Profile-only records require explicit confirmation before delivery.");
  }

  const token = deliveryToken();
  const { data: batch, error: batchError } = await supabase
    .from("premium_delivery_batches")
    .insert({
      customer_email: email,
      product_code: productCode,
      opportunity_count: prospects.length,
      status: "created",
      access_token_hash: tokenHash(token),
    })
    .select("id")
    .single();
  if (batchError || !batch) throw batchError || new Error("Delivery batch could not be created.");

  await assignProspects({ ids: prospects.map((prospect) => prospect.id), customerEmail: email, productCode, adminConfirmedCustomer, adminNotes, onboardingId });

  const deliveredAt = new Date().toISOString();
  const { error: assignmentError } = await supabase
    .from("premium_prospect_assignments")
    .update({
      assignment_status: "published",
      delivered_at: deliveredAt,
      delivery_batch_id: batch.id,
      updated_at: deliveredAt,
    })
    .in("prospect_id", prospects.map((prospect) => prospect.id))
    .eq("customer_email", email)
    .eq("product_code", productCode);
  if (assignmentError) throw assignmentError;

  const { error: csvReadyError } = await supabase
    .from("premium_delivery_batches")
    .update({ status: "csv_ready", csv_generated_at: new Date().toISOString() })
    .eq("id", batch.id);
  if (csvReadyError) throw csvReadyError;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.marketvibe1.com";
  const accessToken = createCustomerAccessToken(email);
  const dashboardPath = appendCustomerAccessParams("/dashboard", email, accessToken);
  const dashboardUrl = `${baseUrl}${dashboardPath}&delivery_token=${encodeURIComponent(token)}`;
  const csvUrl = `${baseUrl}/api/proof-pack/csv?email=${encodeURIComponent(email)}&delivery_token=${encodeURIComponent(token)}`;

  try {
    await sendTransactionalEmail({
      to: email,
      subject: "Your MarketVibe delivery is ready",
      htmlContent: `<p>Your MarketVibe delivery is ready.</p><p><a href="${dashboardUrl}">Open your secure dashboard</a></p><p><a href="${csvUrl}">Download CSV</a></p>`,
      textContent: `Your MarketVibe delivery is ready.\n\nDashboard:\n${dashboardUrl}\n\nCSV:\n${csvUrl}`,
    });
  } catch (emailError) {
    await supabase
      .from("premium_prospect_assignments")
      .update({
        assignment_status: "assigned",
        delivered_at: null,
        delivery_batch_id: null,
        updated_at: new Date().toISOString(),
      })
      .in("prospect_id", prospects.map((prospect) => prospect.id))
      .eq("customer_email", email)
      .eq("product_code", productCode);
    await supabase
      .from("premium_delivery_batches")
      .update({
        status: "email_failed",
        error_summary: { email: emailError instanceof Error ? emailError.message : "Email failed." },
      })
      .eq("id", batch.id);
    throw new Error(emailError instanceof Error ? emailError.message : "Delivery email failed.");
  }

  const { error: deliveredError } = await supabase
    .from("premium_delivery_batches")
    .update({ status: "delivered", email_sent_at: new Date().toISOString() })
    .eq("id", batch.id);
  if (deliveredError) throw deliveredError;

  return { deliveryBatchId: batch.id as string, opportunityCount: prospects.length, dashboardUrl, csvUrl, token };
}

export async function autoFulfillImportedProspectsForOnboarding({
  onboardingId,
  customerEmail,
  productCode,
  niche,
  country,
  city,
  territory,
  serviceOffer,
  idealBuyer,
  quantity,
}: {
  onboardingId?: string | null;
  customerEmail: string;
  productCode: PremiumProductCode;
  niche: string;
  country: string;
  city?: string;
  territory?: string;
  serviceOffer?: string;
  idealBuyer?: string;
  quantity?: number;
}) {
  if (LEGACY_IMPORTED_CUSTOMER_DELIVERY_RETIRED) {
    return {
      ok: true,
      status: "retired" as const,
      customerEmail: normalizedEmail(customerEmail),
      productCode,
      matchedProspects: 0,
      targetQuantity: 0,
      minimumQuantity: 0,
      replacement: "verified_opportunity_engine",
    };
  }
  const supabase = supabaseOrThrow();
  const email = normalizedEmail(customerEmail);
  const targetQuantity = Math.max(1, Math.min(100, Math.floor(quantity || AUTO_FULFILLMENT_TARGETS[productCode])));
  const minimumQuantity = Math.min(targetQuantity, AUTO_FULFILLMENT_MINIMUMS[productCode]);
  const profile = { niche, country, city, territory, serviceOffer, idealBuyer };

  const { data: existingAssignments, error: assignmentError } = await supabase
    .from("premium_prospect_assignments")
    .select("prospect_id,customer_email,assignment_status")
    .in("assignment_status", ["assigned", "published"]);
  if (assignmentError) throw assignmentError;
  const unavailableIds = new Set((existingAssignments || [])
    .filter((assignment) => String(assignment.assignment_status) === "published" || normalizedEmail(String(assignment.customer_email || "")) !== email)
    .map((assignment) => String(assignment.prospect_id)));

  const { data: prospects, error: prospectError } = await supabase
    .from("premium_imported_prospects")
    .select("*")
    .eq("review_status", "approved")
    .eq("is_test_data", false)
    .neq("inventory_status", "rejected")
    .neq("evidence_status", "profile_only")
    .order("intent_score", { ascending: false })
    .order("fit_score", { ascending: false })
    .limit(500);
  if (prospectError) throw prospectError;

  const selected = ((prospects || []) as ProspectRow[])
    .filter((prospect) => prospect.id && !unavailableIds.has(String(prospect.id)))
    .map((prospect) => ({
      prospect,
      score: importedProspectAutoMatchScore(prospect, profile),
    }))
    .filter((item) => item.score >= 45)
    .sort((a, b) => b.score - a.score)
    .slice(0, targetQuantity)
    .map((item) => item.prospect);

  if (selected.length < minimumQuantity) {
    await supabase.from("premium_onboarding").update({
      status: "awaiting_supply",
      updated_at: new Date().toISOString(),
    }).eq("id", onboardingId || "");
    return {
      ok: true,
      status: "awaiting_supply" as const,
      customerEmail: email,
      productCode,
      matchedProspects: selected.length,
      targetQuantity,
      minimumQuantity,
    };
  }

  try {
    const delivery = await publishProspects({
      ids: selected.map((prospect) => String(prospect.id)),
      customerEmail: email,
      productCode,
      adminConfirmedCustomer: true,
      adminNotes: `Automatic fulfillment from paid onboarding${onboardingId ? ` ${onboardingId}` : ""}.`,
      includeProfileOnly: false,
      onboardingId,
    });
    await supabase.from("premium_onboarding").update({
      status: "fulfilled",
      updated_at: new Date().toISOString(),
    }).eq("id", onboardingId || "");
    return {
      ok: true,
      status: "delivered" as const,
      customerEmail: email,
      productCode,
      matchedProspects: selected.length,
      targetQuantity,
      minimumQuantity,
      delivery,
    };
  } catch (error) {
    await supabase.from("premium_onboarding").update({
      status: "fulfillment_failed",
      updated_at: new Date().toISOString(),
    }).eq("id", onboardingId || "");
    return {
      ok: false,
      status: "failed" as const,
      customerEmail: email,
      productCode,
      matchedProspects: selected.length,
      targetQuantity,
      minimumQuantity,
      error: error instanceof Error ? error.message : "Automatic fulfillment failed.",
    };
  }
}

export async function autoFulfillPendingImportedProspectOnboardings({ limit = 20 }: { limit?: number } = {}) {
  if (LEGACY_IMPORTED_CUSTOMER_DELIVERY_RETIRED) {
    return {
      ok: true,
      attempted: 0,
      delivered: 0,
      awaitingSupply: 0,
      failed: 0,
      retired: true,
      replacement: "verified_opportunity_engine",
      results: [],
    };
  }
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from("premium_onboarding")
    .select("*")
    .in("status", ["submitted", "awaiting_supply", "fulfillment_failed"])
    .order("created_at", { ascending: true })
    .limit(Math.max(1, Math.min(100, Math.floor(limit))));
  if (error) throw error;

  const results = [];
  for (const onboarding of data || []) {
    try {
      results.push(await autoFulfillImportedProspectsForOnboarding({
        onboardingId: String(onboarding.id),
        customerEmail: String(onboarding.customer_email || ""),
        productCode: onboarding.product_code as PremiumProductCode,
        niche: String(onboarding.niche || ""),
        country: String(onboarding.country || ""),
        city: String(onboarding.city || ""),
        territory: String(onboarding.territory || ""),
        serviceOffer: String(onboarding.service_offer || ""),
        idealBuyer: String(onboarding.ideal_buyer || ""),
      }));
    } catch (error) {
      results.push({
        ok: false,
        status: "failed" as const,
        onboardingId: String(onboarding.id || ""),
        error: error instanceof Error ? error.message : "Automatic fulfillment failed.",
      });
    }
  }

  return {
    ok: results.every((result) => result.ok),
    attempted: results.length,
    delivered: results.filter((result) => result.status === "delivered").length,
    awaitingSupply: results.filter((result) => result.status === "awaiting_supply").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  };
}

export async function getDeliveredProspectsForCustomer(email: string, token: string) {
  const supabase = supabaseOrThrow();
  if (!email || !token) return [];

  const { data: batches, error: batchError } = await supabase
    .from("premium_delivery_batches")
    .select("id,customer_email,access_token_hash")
    .eq("customer_email", normalizedEmail(email));
  if (batchError) throw batchError;

  const allowedBatchIds = (batches || [])
    .filter((batch) => canCustomerAccessDelivery({
      requestedEmail: email,
      batchEmail: String(batch.customer_email),
      token,
      tokenHashValue: String(batch.access_token_hash || ""),
    }))
    .map((batch) => batch.id);
  if (allowedBatchIds.length === 0) return [];

  const { data, error } = await supabase
    .from("premium_prospect_assignments")
    .select("delivered_at, delivery_batch_id, product_code, premium_imported_prospects(*)")
    .in("delivery_batch_id", allowedBatchIds)
    .eq("customer_email", normalizedEmail(email))
    .eq("assignment_status", "published")
    .order("delivered_at", { ascending: false });
  if (error) throw error;

  return ((data || []) as DeliveryAssignmentRow[]).map((assignment): DeliveredProspect => {
    const prospect = Array.isArray(assignment.premium_imported_prospects)
      ? assignment.premium_imported_prospects[0] || {}
      : assignment.premium_imported_prospects || {};
    const mapped = dbProspectToMapped(prospect);
    const websiteScan =
      prospect.website_scan && typeof prospect.website_scan === "object" && !Array.isArray(prospect.website_scan)
        ? (prospect.website_scan as WebsiteScan)
        : null;
    return {
      ...prospect,
      delivered_at: assignment.delivered_at,
      product_code: assignment.product_code,
      suggested_outreach_angle: suggestedOutreachAngle(mapped, websiteScan && Object.keys(websiteScan).length ? websiteScan : null),
    };
  });
}

export async function buildCustomerDeliveryCsv(email: string, token: string) {
  const rows = await getDeliveredProspectsForCustomer(email, token);
  return buildDeliveryCsv(rows);
}
