import { lookup } from "node:dns/promises";
import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import AdmZip from "adm-zip";
import Papa from "papaparse";

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 10_000;
export const WEBSITE_FETCH_BYTES = 1_000_000;

export type ImportField =
  | "first_name"
  | "last_name"
  | "full_name"
  | "job_title"
  | "company_name"
  | "company_website"
  | "company_domain"
  | "linkedin_profile_url"
  | "company_linkedin_url"
  | "location"
  | "country"
  | "city"
  | "industry"
  | "company_size"
  | "public_email"
  | "public_phone"
  | "public_signal_url"
  | "public_signal_text"
  | "source_note";

export type EvidenceStatus = "profile_only" | "website_verified" | "public_signal_verified";
export type EnrichmentStatus = "not_enriched" | "enriched" | "failed" | "skipped";

export type ColumnMapping = Partial<Record<ImportField, string>>;

export type ImportedProspectInput = Record<ImportField, string> & {
  raw_row: Record<string, string>;
  dedupe_key: string;
  fit_score: number;
  intent_score: number | null;
  evidence_status: EvidenceStatus;
  evidence_summary: string;
  enrichment_status: EnrichmentStatus;
  website_scan: WebsiteScan | null;
  suggested_outreach_angle: string;
};

export type ImportPreview = {
  filename: string;
  delimiter: "," | ";" | "\t";
  sourceFormat: "csv" | "xlsx";
  worksheetName?: string;
  fileChecksum?: string;
  rowFingerprints: string[];
  headers: string[];
  mapping: ColumnMapping;
  rows: Record<string, string>[];
  previewRows: ImportedProspectInput[];
  rejectedRows: Array<{ index: number; reason: string; raw_row: Record<string, string> }>;
  duplicateRows: Array<{ index: number; dedupe_key: string; reason: string }>;
  stats: {
    totalRows: number;
    validRows: number;
    rejectedRows: number;
    duplicateRows: number;
    rowsMissingCompany: number;
    rowsMissingAllUsableSourceReferences: number;
  };
};

export type WebsiteScan = {
  requestedUrl: string;
  finalUrl: string;
  pageTitle: string;
  metaDescription: string;
  contactPageUrl: string;
  publicEmail: string;
  publicPhone: string;
  visibleCallsToAction: string[];
  visibleBookingOptions: string[];
  reviewsOrTestimonials: boolean;
  socialLinks: string[];
  mobileMetadata: boolean;
  responseTimeMs: number;
  brokenLinkEstimate: number;
  textEvidence: string;
};

const fieldLabels: Record<ImportField, string> = {
  first_name: "First name",
  last_name: "Last name",
  full_name: "Full name",
  job_title: "Job title",
  company_name: "Company name",
  company_website: "Company website",
  company_domain: "Company domain",
  linkedin_profile_url: "LinkedIn profile URL",
  company_linkedin_url: "Company LinkedIn URL",
  location: "Location",
  country: "Country",
  city: "City",
  industry: "Industry",
  company_size: "Company size",
  public_email: "Email",
  public_phone: "Phone",
  public_signal_url: "Public signal URL",
  public_signal_text: "Public signal text",
  source_note: "Source note",
};

export const importFields = Object.keys(fieldLabels) as ImportField[];

export function importFieldLabel(field: ImportField) {
  return fieldLabels[field];
}

const aliases: Record<ImportField, string[]> = {
  first_name: ["first name", "first_name", "firstname", "given name"],
  last_name: ["last name", "last_name", "lastname", "surname", "family name"],
  full_name: ["name", "full name", "full_name", "contact name", "person", "lead name"],
  job_title: ["title", "job title", "job_title", "position", "role", "headline"],
  company_name: ["company", "account", "company name", "company_name", "organisation", "organization"],
  company_website: ["website", "company website", "company_website", "site", "url", "company url"],
  company_domain: ["domain", "company domain", "company_domain", "account domain"],
  linkedin_profile_url: ["linkedin url", "profile url", "person linkedin url", "linkedin profile url", "linkedin_profile_url"],
  company_linkedin_url: ["company linkedin url", "account linkedin url", "company linkedin", "linkedin company url"],
  location: ["location", "geography", "region", "area"],
  country: ["country", "nation"],
  city: ["city", "town", "locality"],
  industry: ["industry", "sector", "vertical"],
  company_size: ["employees", "company size", "headcount", "company_size", "employee count"],
  public_email: ["email", "work email", "public email", "e-mail"],
  public_phone: ["phone", "telephone", "public phone", "mobile", "work phone"],
  public_signal_url: ["signal url", "source url", "post url", "public signal url", "public_signal_url"],
  public_signal_text: ["signal text", "notes", "intent signal", "public signal text", "signal", "public_signal_text"],
  source_note: ["source note", "source notes", "note", "import note"],
};

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function detectDelimiter(text: string): "," | ";" | "\t" {
  const sampleLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const candidates = [",", ";", "\t"] as const;
  const scores = candidates.map((delimiter) => ({
    delimiter,
    count: splitRespectingQuotes(sampleLine, delimiter).length,
  }));
  return scores.sort((a, b) => b.count - a.count)[0].delimiter;
}

function splitRespectingQuotes(line: string, delimiter: "," | ";" | "\t") {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === "\"") quoted = !quoted;
    if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

export function inferColumnMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map((header) => ({ original: header, normalized: normalizeHeader(header) }));
  const mapping: ColumnMapping = {};

  for (const field of importFields) {
    const match = normalized.find((header) => aliases[field].includes(header.normalized));
    if (match) mapping[field] = match.original;
  }

  return mapping;
}

export function parseCsvText(text: string, byteSize = Buffer.byteLength(text, "utf8")) {
  if (byteSize > MAX_IMPORT_BYTES) {
    throw new Error("CSV file is too large. Maximum size is 10 MB.");
  }

  if (!text.trim()) {
    throw new Error("CSV file is empty.");
  }

  const delimiter = detectDelimiter(text);
  const result = Papa.parse<Record<string, string>>(text, {
    delimiter,
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
    transform: (value) => String(value ?? "").trim(),
  });

  const fatalError = result.errors.find((error) => error.type === "Quotes" || error.code === "MissingQuotes");
  if (fatalError) throw new Error("CSV appears malformed. Check quotes and delimiters.");

  const headers = result.meta.fields?.filter(Boolean) || [];
  if (headers.length === 0) throw new Error("CSV headers were not detected.");
  if (result.data.length > MAX_IMPORT_ROWS) {
    throw new Error("CSV has too many rows. Maximum rows per upload is 10,000.");
  }

  const rows = result.data.filter((row) => Object.values(row).some((value) => String(value || "").trim()));
  return { delimiter, headers, rows };
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

export function fingerprintRawRow(row: Record<string, string>) {
  const normalized = Object.keys(row)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => [normalizeHeader(key), cleanCell(row[key])]);
  return sha256(JSON.stringify(normalized));
}

function lastPopulatedIndex(values: string[]) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index]) return index;
  }
  return -1;
}

function excelCellValueToText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return cleanCell(value);
  if (typeof value === "object") {
    const cellObject = value as {
      text?: unknown;
      result?: unknown;
      richText?: Array<{ text?: unknown }>;
      hyperlink?: unknown;
    };
    if (Array.isArray(cellObject.richText)) return cleanCell(cellObject.richText.map((item) => item.text || "").join(""));
    if (cellObject.result != null) return excelCellValueToText(cellObject.result);
    if (cellObject.text != null) return cleanCell(cellObject.text);
    if (cellObject.hyperlink != null) return cleanCell(cellObject.hyperlink);
  }
  return cleanCell(value);
}

function xmlDecode(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseXmlAttributes(value: string) {
  const attrs: Record<string, string> = {};
  for (const match of value.matchAll(/([\w:.-]+)="([^"]*)"/g)) {
    attrs[match[1]] = xmlDecode(match[2]);
  }
  return attrs;
}

function zipText(zip: AdmZip, path: string) {
  return zip.getEntry(path)?.getData().toString("utf8") || "";
}

function normalizeWorkbookTarget(target: string) {
  const clean = target.replace(/^\/+/, "");
  if (clean.startsWith("xl/")) return clean;
  return `xl/${clean}`.replace(/\/\.\//g, "/");
}

function parseWorkbookRelationships(xml: string) {
  const relationships = new Map<string, string>();
  for (const match of xml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const attrs = parseXmlAttributes(match[1]);
    if (attrs.Id && attrs.Target && /worksheet/i.test(attrs.Type || "")) {
      relationships.set(attrs.Id, normalizeWorkbookTarget(attrs.Target));
    }
  }
  return relationships;
}

function parseWorkbookSheets(xml: string, relationships: Map<string, string>) {
  const sheets: Array<{ name: string; path: string; visible: boolean }> = [];
  for (const match of xml.matchAll(/<(?:[\w.-]+:)?sheet\b([^>]*)\/>/g)) {
    const attrs = parseXmlAttributes(match[1]);
    const relationId = attrs["r:id"];
    const path = relationId ? relationships.get(relationId) : "";
    if (!attrs.name || !path) continue;
    sheets.push({
      name: attrs.name,
      path,
      visible: attrs.state !== "hidden" && attrs.state !== "veryHidden",
    });
  }
  return sheets;
}

function parseSharedStrings(xml: string) {
  if (!xml) return [];
  const strings: string[] = [];
  for (const match of xml.matchAll(/<(?:[\w.-]+:)?si\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?si>/g)) {
    const text = Array.from(match[1].matchAll(/<(?:[\w.-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?t>/g))
      .map((textMatch) => xmlDecode(textMatch[1]))
      .join("");
    strings.push(cleanCell(text));
  }
  return strings;
}

function columnIndexFromCellRef(ref: string) {
  const letters = (ref.match(/[A-Z]+/i)?.[0] || "").toUpperCase();
  if (!letters) return 0;
  let column = 0;
  for (const letter of letters) column = column * 26 + (letter.charCodeAt(0) - 64);
  return Math.max(0, column - 1);
}

function parseCellText(cellAttrs: Record<string, string>, cellXml: string, sharedStrings: string[]) {
  const inlineText = Array.from(cellXml.matchAll(/<(?:[\w.-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?t>/g))
    .map((match) => xmlDecode(match[1]))
    .join("");
  const rawValue = xmlDecode(cellXml.match(/<(?:[\w.-]+:)?v\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?v>/)?.[1] || "");
  if (cellAttrs.t === "s") return cleanCell(sharedStrings[Number(rawValue)] || "");
  if (cellAttrs.t === "inlineStr") return cleanCell(inlineText);
  if (cellAttrs.t === "b") return rawValue === "1" ? "TRUE" : rawValue === "0" ? "FALSE" : cleanCell(rawValue);
  return cleanCell(rawValue || inlineText);
}

function parseWorksheetRows(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<(?:[\w.-]+:)?row\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?row>/g)) {
    const rowAttrs = parseXmlAttributes(rowMatch[1]);
    const rowIndex = Math.max(0, Number(rowAttrs.r || rows.length + 1) - 1);
    const values: string[] = rows[rowIndex] || [];
    for (const cellMatch of rowMatch[2].matchAll(/<(?:[\w.-]+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?c>)/g)) {
      const cellAttrs = parseXmlAttributes(cellMatch[1]);
      const columnIndex = columnIndexFromCellRef(cellAttrs.r || "");
      values[columnIndex] = parseCellText(cellAttrs, cellMatch[2] || "", sharedStrings);
    }
    rows[rowIndex] = values;
  }
  return rows;
}

export async function parseXlsxBuffer(buffer: Buffer, byteSize = buffer.byteLength) {
  if (byteSize > MAX_IMPORT_BYTES) {
    throw new Error("Workbook is too large. Maximum size is 10 MB.");
  }

  if (byteSize === 0) {
    throw new Error("Workbook file is empty.");
  }

  const zip = new AdmZip(buffer);
  const workbookXml = zipText(zip, "xl/workbook.xml");
  const relationshipsXml = zipText(zip, "xl/_rels/workbook.xml.rels");
  if (!workbookXml || !relationshipsXml) {
    throw new Error("Workbook structure is not readable. Save the file as a standard .xlsx workbook and try again.");
  }
  const relationships = parseWorkbookRelationships(relationshipsXml);
  const worksheets = parseWorkbookSheets(workbookXml, relationships).filter((worksheet) => worksheet.visible);
  const sharedStrings = parseSharedStrings(zipText(zip, "xl/sharedStrings.xml"));

  for (const worksheet of worksheets) {
    const worksheetRows = parseWorksheetRows(zipText(zip, worksheet.path), sharedStrings);
    const worksheetName = worksheet.name;
    const columnCount = Math.max(0, ...worksheetRows.map((row) => row.length));
    if (columnCount === 0 || worksheetRows.length === 0) continue;

    for (let rowNumber = 0; rowNumber < worksheetRows.length; rowNumber += 1) {
      const headerCandidate = Array.from({ length: columnCount }, (_, index) => excelCellValueToText(worksheetRows[rowNumber]?.[index]));
      const headerEnd = lastPopulatedIndex(headerCandidate);
      if (headerEnd < 0) continue;

      const headers = headerCandidate.slice(0, headerEnd + 1).map(cleanCell);
      if (headers.length === 0 || headers.every((header) => !header)) continue;

      const rows: Record<string, string>[] = [];
      for (let dataRowNumber = rowNumber + 1; dataRowNumber < worksheetRows.length; dataRowNumber += 1) {
        const values = Array.from({ length: headers.length }, (_, index) => excelCellValueToText(worksheetRows[dataRowNumber]?.[index]));
        if (values.every((value) => !value)) continue;
        const raw = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
        rows.push(raw);
      }

      if (rows.length > MAX_IMPORT_ROWS) {
        throw new Error("Workbook has too many rows. Maximum rows per upload is 10,000.");
      }

      return {
        delimiter: "," as const,
        headers,
        rows,
        worksheetName,
        fileChecksum: sha256(buffer),
        rowFingerprints: rows.map(fingerprintRawRow),
      };
    }
  }

  throw new Error("Workbook has no visible worksheet with a usable header row.");
}

export function buildImportPreview({
  text,
  filename,
  byteSize,
  mapping: providedMapping,
}: {
  text: string;
  filename: string;
  byteSize?: number;
  mapping?: ColumnMapping;
}): ImportPreview {
  const parsed = parseCsvText(text, byteSize);
  return buildImportPreviewFromRows({
    filename,
    delimiter: parsed.delimiter,
    sourceFormat: "csv",
    headers: parsed.headers,
    rows: parsed.rows,
    mapping: providedMapping,
    fileChecksum: sha256(text),
    rowFingerprints: parsed.rows.map(fingerprintRawRow),
  });
}

export async function buildImportPreviewFromWorkbookBuffer({
  buffer,
  filename,
  byteSize,
  mapping: providedMapping,
}: {
  buffer: Buffer;
  filename: string;
  byteSize?: number;
  mapping?: ColumnMapping;
}): Promise<ImportPreview> {
  const parsed = await parseXlsxBuffer(buffer, byteSize);
  return buildImportPreviewFromRows({
    filename,
    delimiter: parsed.delimiter,
    sourceFormat: "xlsx",
    worksheetName: parsed.worksheetName,
    headers: parsed.headers,
    rows: parsed.rows,
    mapping: providedMapping,
    fileChecksum: parsed.fileChecksum,
    rowFingerprints: parsed.rowFingerprints,
  });
}

export function buildImportPreviewFromRows({
  filename,
  delimiter,
  sourceFormat = "csv",
  worksheetName,
  headers,
  rows,
  fileChecksum,
  rowFingerprints,
  mapping: providedMapping,
}: {
  filename: string;
  delimiter: "," | ";" | "\t";
  sourceFormat?: "csv" | "xlsx";
  worksheetName?: string;
  headers: string[];
  rows: Record<string, string>[];
  fileChecksum?: string;
  rowFingerprints?: string[];
  mapping?: ColumnMapping;
}): ImportPreview {
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error("CSV has too many rows. Maximum rows per upload is 10,000.");
  }

  const mapping = providedMapping || inferColumnMapping(headers);
  const seen = new Set<string>();
  const previewRows: ImportedProspectInput[] = [];
  const rejectedRows: ImportPreview["rejectedRows"] = [];
  const duplicateRows: ImportPreview["duplicateRows"] = [];
  let rowsMissingCompany = 0;
  let rowsMissingAllUsableSourceReferences = 0;

  rows.forEach((raw, index) => {
    const mapped = mapRow(raw, mapping);
    if (!mapped.company_name) rowsMissingCompany += 1;
    if (!hasAnyUsableSourceReference(mapped)) rowsMissingAllUsableSourceReferences += 1;
    const validationError = validateMappedRow(mapped);
    if (validationError) {
      rejectedRows.push({ index, reason: validationError, raw_row: raw });
      return;
    }
    const dedupeKey = buildDedupeKey(mapped);
    if (seen.has(dedupeKey)) {
      duplicateRows.push({ index, dedupe_key: dedupeKey, reason: "Duplicate within this upload." });
      return;
    }
    seen.add(dedupeKey);
    previewRows.push(enrichComputedFields(mapped, raw, null));
  });

  return {
    filename,
    delimiter,
    sourceFormat,
    worksheetName,
    fileChecksum,
    rowFingerprints: rowFingerprints || rows.map(fingerprintRawRow),
    headers,
    mapping,
    rows,
    previewRows: previewRows.slice(0, 20),
    rejectedRows,
    duplicateRows,
    stats: {
      totalRows: rows.length,
      validRows: previewRows.length,
      rejectedRows: rejectedRows.length,
      duplicateRows: duplicateRows.length,
      rowsMissingCompany,
      rowsMissingAllUsableSourceReferences,
    },
  };
}

export function mapRow(raw: Record<string, string>, mapping: ColumnMapping): Record<ImportField, string> {
  const mapped = Object.fromEntries(importFields.map((field) => [field, ""])) as Record<ImportField, string>;
  for (const field of importFields) {
    const source = mapping[field];
    mapped[field] = source ? cleanCell(raw[source]) : "";
  }

  if (!mapped.full_name) {
    mapped.full_name = [mapped.first_name, mapped.last_name].filter(Boolean).join(" ").trim();
  }
  if (!mapped.company_domain && mapped.company_website) {
    mapped.company_domain = domainFromUrl(mapped.company_website);
  }
  if (!mapped.company_website && mapped.company_domain) {
    mapped.company_website = `https://${mapped.company_domain}`;
  }
  return mapped;
}

export function cleanCell(value: unknown) {
  return String(value || "").replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
}

export function validateMappedRow(row: Record<ImportField, string>) {
  if (!row.company_name) return "Company is required.";
  if (!hasAnyUsableSourceReference(row)) return "Add a company website, company domain, public signal URL, company LinkedIn URL, or LinkedIn profile URL.";
  if (!buildDedupeKey(row)) return "A dedupe key could not be generated.";
  return "";
}

export function hasAnyUsableSourceReference(row: Record<ImportField, string>) {
  return Boolean(
    row.linkedin_profile_url ||
    row.company_linkedin_url ||
    row.company_website ||
    row.company_domain ||
    row.public_signal_url,
  );
}

export function enrichComputedFields(
  row: Record<ImportField, string>,
  rawRow: Record<string, string>,
  websiteScan: WebsiteScan | null,
): ImportedProspectInput {
  const evidence_status = classifyEvidenceStatus(row, websiteScan);
  return {
    ...row,
    linkedin_profile_url: normalizeLinkedInUrl(row.linkedin_profile_url),
    company_linkedin_url: normalizeLinkedInUrl(row.company_linkedin_url),
    public_email: normalizeEmail(row.public_email),
    company_domain: normalizeDomain(row.company_domain || domainFromUrl(row.company_website)),
    company_website: normalizeHttpUrl(row.company_website),
    public_signal_url: normalizeHttpUrl(row.public_signal_url),
    raw_row: rawRow,
    dedupe_key: buildDedupeKey(row),
    fit_score: calculateFitScore(row),
    intent_score: calculateIntentScore(row, websiteScan),
    evidence_status,
    evidence_summary: evidenceSummary(row, websiteScan, evidence_status),
    enrichment_status: websiteScan ? "enriched" : "not_enriched",
    website_scan: websiteScan,
    suggested_outreach_angle: suggestedOutreachAngle(row, websiteScan),
  };
}

export function buildDedupeKey(row: Pick<Record<ImportField, string>, ImportField>) {
  const linkedin = normalizeLinkedInUrl(row.linkedin_profile_url);
  if (linkedin) return `linkedin:${linkedin}`;
  const companyLinkedin = normalizeLinkedInUrl(row.company_linkedin_url);
  if (companyLinkedin) return `company_linkedin:${companyLinkedin}`;
  const email = normalizeEmail(row.public_email);
  if (email) return `email:${email}`;
  const fullName = normalizeText(row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" "));
  const company = normalizeText(row.company_name);
  if (fullName && company) return `person_company:${fullName}:${company}`;
  const title = normalizeText(row.job_title);
  const domain = normalizeDomain(row.company_domain || domainFromUrl(row.company_website));
  if (title && company && domain) return `title_company_domain:${title}:${company}:${domain}`;
  if (company && domain) return `company_domain:${company}:${domain}`;
  const signalUrl = normalizeHttpUrl(row.public_signal_url);
  if (company && signalUrl) return `company_signal:${company}:${signalUrl}`;
  return "";
}

export function normalizeLinkedInUrl(value: string) {
  if (!value) return "";
  try {
    const url = new URL(hasHttpScheme(value) ? value : `https://${value}`);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!hostname.endsWith("linkedin.com")) return normalizeHttpUrl(value);
    return `https://${hostname}${url.pathname.replace(/\/+$/, "").toLowerCase()}`;
  } catch {
    return normalizeText(value);
  }
}

export function normalizeHttpUrl(value: string) {
  if (!value) return "";
  try {
    const url = new URL(hasHttpScheme(value) ? value : `https://${value}`);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return `${url.protocol.toLowerCase()}//${hostname}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "";
  }
}

export function normalizeDomain(value: string) {
  if (!value) return "";
  const source = value.includes("://") ? domainFromUrl(value) : value;
  return source.toLowerCase().replace(/^www\./, "").replace(/\/+$/, "").trim();
}

export function domainFromUrl(value: string) {
  if (!value) return "";
  try {
    return new URL(hasHttpScheme(value) ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function hasHttpScheme(value: string) {
  return /^https?:\/\//i.test(value);
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function calculateFitScore(row: Pick<Record<ImportField, string>, ImportField>) {
  let score = 20;
  const title = normalizeText(row.job_title);
  const industry = normalizeText(row.industry);
  const size = normalizeText(row.company_size);
  const location = normalizeText(`${row.country} ${row.city} ${row.location}`);
  const companyInfo = normalizeText(`${row.company_name} ${row.company_domain} ${row.company_website}`);

  if (/\b(founder|owner|ceo|chief|vp|head|director|manager|partner|principal|operations|marketing|growth|sales|revenue)\b/.test(title)) score += 25;
  if (/\b(marketing|software|saas|professional|consulting|agency|services|technology|ecommerce|retail|healthcare|finance)\b/.test(industry)) score += 20;
  if (/\b(11-50|51-200|201-500|small|medium|mid-market|smb)\b/.test(size)) score += 15;
  if (location) score += 10;
  if (companyInfo) score += 10;
  return Math.min(100, Math.round(score / 5) * 5);
}

export function calculateIntentScore(row: Pick<Record<ImportField, string>, ImportField>, websiteScan: WebsiteScan | null) {
  const signal = normalizeText(`${row.public_signal_url} ${row.public_signal_text}`);
  if (signal) {
    let score = 60;
    if (/\b(need|looking for|urgent|problem|struggle|delay|broken|manual|growth|pipeline|customers|leads|sales|hiring|switching)\b/.test(signal)) score += 20;
    if (row.public_signal_url) score += 10;
    return Math.min(90, Math.round(score / 5) * 5);
  }

  if (websiteScan?.textEvidence) {
    let score = 45;
    if (websiteScan.visibleCallsToAction.length === 0) score += 10;
    if (!websiteScan.publicEmail && !websiteScan.publicPhone) score += 10;
    if (!websiteScan.mobileMetadata) score += 5;
    return Math.min(70, Math.round(score / 5) * 5);
  }

  return null;
}

export function classifyEvidenceStatus(row: Pick<Record<ImportField, string>, ImportField>, websiteScan: WebsiteScan | null): EvidenceStatus {
  if (row.public_signal_url || row.public_signal_text) return "public_signal_verified";
  if (websiteScan?.finalUrl) return "website_verified";
  return "profile_only";
}

export function evidenceSummary(row: Pick<Record<ImportField, string>, ImportField>, websiteScan: WebsiteScan | null, status = classifyEvidenceStatus(row, websiteScan)) {
  if (status === "public_signal_verified") {
    return `Public signal supplied in the CSV${row.public_signal_url ? `: ${row.public_signal_url}` : ""}.`;
  }
  if (status === "website_verified" && websiteScan) {
    return `Public company website verified at ${websiteScan.finalUrl}. ${websiteScan.textEvidence || "Basic website metadata was extracted."}`;
  }
  return "Intent not evidenced. No direct public buying-intent signal was supplied or verified.";
}

export function suggestedOutreachAngle(row: Pick<Record<ImportField, string>, ImportField>, websiteScan: WebsiteScan | null) {
  if (row.public_signal_text) {
    return `Possible outreach angle: reference the supplied public signal and connect it to ${row.company_name}'s public context without claiming urgency beyond the source text.`;
  }
  if (websiteScan?.textEvidence) {
    return `Possible outreach angle: public website indicates ${websiteScan.textEvidence.toLowerCase()} Review whether a practical improvement offer is relevant before contacting ${row.company_name}.`;
  }
  return `No direct intent signal was supplied. Possible outreach angle: introduce a relevant service to ${row.company_name} based only on the supplied role, company, and industry context.`;
}

export function isPrivateIpAddress(address: string) {
  if (address === "::1" || address === "0:0:0:0:0:0:0:1") return true;
  if (address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) return true;
  if (!isIP(address)) return false;
  if (address.startsWith("127.") || address.startsWith("10.") || address.startsWith("169.254.")) return true;
  if (address.startsWith("192.168.")) return true;
  const parts = address.split(".").map(Number);
  return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

export function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "metadata.google.internal") return true;
  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) return true;
  return isPrivateIpAddress(host);
}

export async function assertSafePublicUrl(value: string) {
  const normalized = normalizeHttpUrl(value);
  if (!normalized) throw new Error("A valid HTTP or HTTPS URL is required.");
  const url = new URL(normalized);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only HTTP and HTTPS URLs are allowed.");
  if (isBlockedHostname(url.hostname)) throw new Error("This URL is blocked for safe public fetching.");

  const records = await lookup(url.hostname, { all: true }).catch(() => []);
  if (records.some((record) => isPrivateIpAddress(record.address))) {
    throw new Error("This URL resolves to a private or internal network address.");
  }
  return normalized;
}

export async function scanPublicWebsite(inputUrl: string): Promise<WebsiteScan> {
  let nextUrl = await assertSafePublicUrl(inputUrl);
  const started = Date.now();
  let response: Response | null = null;

  for (let redirects = 0; redirects < 4; redirects += 1) {
    response = await fetch(nextUrl, {
      headers: { "user-agent": "MarketVibeImporter/1.0 (+https://marketvibe1.com)" },
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    if (!location) break;
    nextUrl = await assertSafePublicUrl(new URL(location, nextUrl).toString());
  }

  if (!response) throw new Error("Website did not respond.");
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) throw new Error("Only public HTML pages can be enriched.");
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > WEBSITE_FETCH_BYTES) throw new Error("Website response is too large.");
  const html = await response.text();
  if (Buffer.byteLength(html, "utf8") > WEBSITE_FETCH_BYTES) throw new Error("Website response is too large.");

  const finalUrl = response.url || nextUrl;
  const visibleText = stripHtml(html);
  const pageTitle = extractFirst(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
  const metaDescription =
    extractFirst(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, html) ||
    extractFirst(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i, html);
  const publicEmail = extractEmails(`${visibleText} ${html}`)[0] || "";
  const publicPhone = extractPhones(visibleText)[0] || "";
  const contactHref = html.match(/href=["']([^"']*(?:contact|kontakt|book|booking|appointment|get-in-touch|quote|enquiry|inquiry)[^"']*)["']/i)?.[1] || "";
  const contactPageUrl = contactHref ? normalizeHttpUrl(new URL(contactHref, finalUrl).toString()) : "";
  const visibleCallsToAction = extractMatches(visibleText, /\b(book now|get quote|request quote|contact us|schedule|start|talk to us|enquire|inquire)\b/gi, 6);
  const visibleBookingOptions = extractMatches(`${visibleText} ${html}`, /\b(calendly|acuity|booking|appointment|schedule|book now)\b/gi, 6);
  const reviewsOrTestimonials = /\b(review|reviews|testimonial|testimonials|rated|stars|trustpilot)\b/i.test(visibleText);
  const socialLinks = extractSocialLinks(html, finalUrl);
  const mobileMetadata = /<meta[^>]+name=["']viewport["']/i.test(html);
  const brokenLinkEstimate = Math.min(12, (html.match(/href=["']#["']/gi) || []).length);
  const textEvidence = [
    visibleCallsToAction.length === 0 ? "no clear call to action was detected." : "",
    !publicEmail && !publicPhone ? "no public email or phone was detected on the scanned page." : "",
    !mobileMetadata ? "mobile viewport metadata was not detected." : "",
    reviewsOrTestimonials ? "reviews or testimonials were visible." : "",
  ].filter(Boolean).join(" ");

  return {
    requestedUrl: inputUrl,
    finalUrl,
    pageTitle,
    metaDescription,
    contactPageUrl,
    publicEmail,
    publicPhone,
    visibleCallsToAction,
    visibleBookingOptions,
    reviewsOrTestimonials,
    socialLinks,
    mobileMetadata,
    responseTimeMs: Date.now() - started,
    brokenLinkEstimate,
    textEvidence,
  };
}

function extractFirst(pattern: RegExp, value: string) {
  return cleanCell(value.match(pattern)?.[1] || "");
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmails(text: string) {
  return Array.from(new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])).map(normalizeEmail);
}

function extractPhones(text: string) {
  return Array.from(new Set(text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?){2,5}\d{2,5}/g) || []))
    .map((phone) => phone.trim())
    .filter((phone) => phone.replace(/\D/g, "").length >= 8);
}

function extractMatches(value: string, pattern: RegExp, limit: number) {
  return Array.from(new Set(Array.from(value.matchAll(pattern)).map((match) => cleanCell(match[0])))).slice(0, limit);
}

function extractSocialLinks(html: string, baseUrl: string) {
  const links = Array.from(html.matchAll(/href=["']([^"']+)["']/gi))
    .map((match) => {
      try {
        return new URL(match[1], baseUrl).toString();
      } catch {
        return "";
      }
    })
    .filter((url) => /(instagram|facebook|x\.com|twitter|youtube|tiktok)\.com/i.test(url));
  return Array.from(new Set(links)).slice(0, 8);
}

export function csvEscape(value: unknown) {
  return `"${neutralizeCsvFormula(value).replaceAll("\"", "\"\"")}"`;
}

export function neutralizeCsvFormula(value: unknown) {
  const text = String(value ?? "");
  return /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
}

export function buildDeliveryCsv(rows: Array<Record<string, unknown>>) {
  const headers = [
    "Full Name",
    "Job Title",
    "Company",
    "Location",
    "Industry",
    "Company Website",
    "LinkedIn Source URL",
    "Public Email",
    "Public Phone",
    "Fit Score",
    "Intent Score",
    "Evidence Status",
    "Evidence Summary",
    "Public Signal URL",
    "Public Signal Text",
    "Suggested Outreach Angle",
    "Delivered At",
  ];
  const body = rows.map((row) => [
    row.full_name,
    row.job_title,
    row.company_name,
    row.location,
    row.industry,
    row.company_website,
    row.linkedin_profile_url,
    row.public_email,
    row.public_phone,
    row.fit_score,
    row.intent_score ?? "Intent not evidenced",
    row.evidence_status,
    row.evidence_summary,
    row.public_signal_url,
    row.public_signal_text,
    row.suggested_outreach_angle,
    row.delivered_at,
  ]);
  return [headers, ...body].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function deliveryToken() {
  return randomBytes(24).toString("hex");
}

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
