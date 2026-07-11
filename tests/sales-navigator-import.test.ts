import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import nextConfig from "../next.config";
import {
  assertSafePublicUrl,
  buildDeliveryCsv,
  buildDedupeKey,
  buildImportPreview,
  buildImportPreviewFromWorkbookBuffer,
  calculateFitScore,
  calculateIntentScore,
  classifyEvidenceStatus,
  detectDelimiter,
  inferColumnMapping,
  isPrivateIpAddress,
  MAX_IMPORT_ROWS,
  normalizeEmail,
  normalizeLinkedInUrl,
  normalizeHttpUrl,
  parseCsvText,
  tokenHash,
  validateMappedRow,
} from "../src/lib/sales-navigator-import";
import { InMemoryOperationsStore, shouldQueueBuyerPipelineJobForState, shouldReactivateBuyerPipelineJob } from "../src/lib/operations-pipeline";
import { canCustomerAccessDelivery, importProspectsFromRows } from "../src/lib/sales-navigator-persistence";

const localRequire = createRequire(import.meta.url);

async function run() {
const commaCsv = `First Name,Last Name,Job Title,Company Name,Company Website,LinkedIn Profile URL,Email,Public Signal Text
Avery,Stone,Head of Operations,Northstar Test Systems,https://example.com,https://www.linkedin.com/in/avery-stone-test/?trk=test,Avery.Stone@Example.Test,Fictional test signal: operations delay
Riley,Chen,Marketing Director,Lumen Field Test Labs,https://example.org,https://www.linkedin.com/in/riley-chen-test,,`;

assert.equal(detectDelimiter("a,b,c\n1,2,3"), ",");
assert.equal(detectDelimiter("a;b;c\n1;2;3"), ";");
assert.equal(detectDelimiter("a\tb\tc\n1\t2\t3"), "\t");

const mapping = inferColumnMapping(["FirstName", "Contact Name", "Position", "Account", "Domain", "Work Email", "Signal URL", "Intent Signal"]);
assert.equal(mapping.first_name, "FirstName");
assert.equal(mapping.full_name, "Contact Name");
assert.equal(mapping.job_title, "Position");
assert.equal(mapping.company_name, "Account");
assert.equal(mapping.company_domain, "Domain");
assert.equal(mapping.public_email, "Work Email");
assert.equal(mapping.public_signal_url, "Signal URL");
assert.equal(mapping.public_signal_text, "Intent Signal");

const exactCompanyHeaders = [
  "Company Name",
  "Company Website",
  "Company Domain",
  "Location",
  "Country",
  "City",
  "Industry",
  "Company Size",
  "Public Signal URL",
  "Public Signal Text",
  "Source Note",
  "First Name",
  "Last Name",
  "Full Name",
  "Job Title",
  "LinkedIn Profile URL",
  "Company LinkedIn URL",
  "Email",
  "Phone",
];
const exactCompanyMapping = inferColumnMapping(exactCompanyHeaders);
assert.equal(exactCompanyMapping.company_name, "Company Name");
assert.equal(exactCompanyMapping.company_website, "Company Website");
assert.equal(exactCompanyMapping.company_domain, "Company Domain");
assert.equal(exactCompanyMapping.location, "Location");
assert.equal(exactCompanyMapping.country, "Country");
assert.equal(exactCompanyMapping.city, "City");
assert.equal(exactCompanyMapping.industry, "Industry");
assert.equal(exactCompanyMapping.company_size, "Company Size");
assert.equal(exactCompanyMapping.public_signal_url, "Public Signal URL");
assert.equal(exactCompanyMapping.public_signal_text, "Public Signal Text");
assert.equal(exactCompanyMapping.source_note, "Source Note");
assert.equal(exactCompanyMapping.first_name, "First Name");
assert.equal(exactCompanyMapping.last_name, "Last Name");
assert.equal(exactCompanyMapping.full_name, "Full Name");
assert.equal(exactCompanyMapping.job_title, "Job Title");
assert.equal(exactCompanyMapping.linkedin_profile_url, "LinkedIn Profile URL");
assert.equal(exactCompanyMapping.company_linkedin_url, "Company LinkedIn URL");
assert.equal(exactCompanyMapping.public_email, "Email");
assert.equal(exactCompanyMapping.public_phone, "Phone");

assert.throws(() => parseCsvText("\"unterminated,name\nvalue,test"), /malformed|quotes/i);
assert.throws(() => parseCsvText("A\nB", 10 * 1024 * 1024 + 1), /too large/i);
assert.throws(() => parseCsvText(`Name\n${Array.from({ length: 10001 }, (_, index) => `Row ${index}`).join("\n")}`), /too many rows/i);

assert.equal(normalizeHttpUrl("HTTPS://www.Example.com/path/?utm=1"), "https://example.com/path");
assert.equal(normalizeLinkedInUrl("https://www.linkedin.com/in/Avery-Stone/?trk=public_profile"), "https://linkedin.com/in/avery-stone");
assert.equal(normalizeEmail(" Test@Example.COM "), "test@example.com");

const linkedinRow = {
  first_name: "Avery",
  last_name: "Stone",
  full_name: "Avery Stone",
  job_title: "Head of Operations",
  company_name: "Northstar Test Systems",
  company_website: "https://example.com",
  company_domain: "example.com",
  linkedin_profile_url: "https://www.linkedin.com/in/avery-stone-test/?trk=sales",
  company_linkedin_url: "",
  location: "Test City",
  country: "United States",
  city: "Test City",
  industry: "Software",
  company_size: "51-200",
  public_email: "avery@example.test",
  public_phone: "",
  public_signal_url: "",
  public_signal_text: "",
  source_note: "fictional",
};

assert.equal(buildDedupeKey(linkedinRow), "linkedin:https://linkedin.com/in/avery-stone-test");
assert.equal(buildDedupeKey({ ...linkedinRow, linkedin_profile_url: "", public_email: "AVERY@EXAMPLE.TEST" }), "email:avery@example.test");
assert.equal(buildDedupeKey({ ...linkedinRow, linkedin_profile_url: "", public_email: "" }), "person_company:avery stone:northstar test systems");
assert.equal(buildDedupeKey({ ...linkedinRow, linkedin_profile_url: "", public_email: "", full_name: "", first_name: "", last_name: "" }), "title_company_domain:head of operations:northstar test systems:example.com");
assert.equal(buildDedupeKey({ ...linkedinRow, linkedin_profile_url: "", public_email: "", full_name: "", first_name: "", last_name: "", job_title: "" }), "company_domain:northstar test systems:example.com");

const companyOnlyRow = {
  ...linkedinRow,
  first_name: "",
  last_name: "",
  full_name: "",
  job_title: "",
  company_website: "",
  company_domain: "",
  linkedin_profile_url: "",
  company_linkedin_url: "",
  public_email: "",
  public_phone: "",
  public_signal_url: "",
  public_signal_text: "",
};
assert.equal(validateMappedRow({ ...companyOnlyRow, company_website: "https://company-only.example.com" }), "");
assert.equal(validateMappedRow({ ...companyOnlyRow, company_domain: "company-only.example.com" }), "");
assert.equal(validateMappedRow({ ...companyOnlyRow, public_signal_url: "https://public.example.com/signal/company-only" }), "");
assert.equal(validateMappedRow({ ...companyOnlyRow, company_linkedin_url: "https://www.linkedin.com/company/company-only-test" }), "");
assert.equal(validateMappedRow({ ...companyOnlyRow, linkedin_profile_url: "https://www.linkedin.com/in/company-source-test" }), "");
assert.match(validateMappedRow(companyOnlyRow), /company website, company domain, public signal URL, company LinkedIn URL, or LinkedIn profile URL/);

const preview = buildImportPreview({ text: `${commaCsv}\nAvery,Stone,Head of Operations,Northstar Test Systems,https://example.com,https://www.linkedin.com/in/avery-stone-test/?trk=again,,`, filename: "test.csv" });
assert.equal(preview.stats.totalRows, 3);
assert.equal(preview.stats.validRows, 2);
assert.equal(preview.stats.duplicateRows, 1);
assert.equal(preview.stats.rejectedRows, 0);
assert.equal(preview.previewRows[1].intent_score, null);
assert.equal(preview.previewRows[1].evidence_summary, "Intent not evidenced. No direct public buying-intent signal was supplied or verified.");

const companyOnlyCsv = [
  exactCompanyHeaders.join(","),
  ...Array.from({ length: 50 }, (_, index) => [
    `Company Only ${index + 1}`,
    `https://company-only-${index + 1}.example.com`,
    `company-only-${index + 1}.example.com`,
    "Manchester",
    "United Kingdom",
    "Manchester",
    "Construction",
    "11-50",
    "",
    "",
    "Company-only validation fixture",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ].join(",")),
].join("\n");
const companyOnlyPreview = buildImportPreview({ text: companyOnlyCsv, filename: "company-only-50.csv" });
assert.equal(companyOnlyPreview.stats.totalRows, 50);
assert.equal(companyOnlyPreview.stats.validRows, 50);
assert.equal(companyOnlyPreview.stats.rejectedRows, 0);
assert.equal(companyOnlyPreview.stats.duplicateRows, 0);
assert.equal(companyOnlyPreview.stats.rowsMissingCompany, 0);
assert.equal(companyOnlyPreview.stats.rowsMissingAllUsableSourceReferences, 0);
assert.equal(companyOnlyPreview.previewRows[0].first_name, "");
assert.equal(companyOnlyPreview.previewRows[0].job_title, "");
assert.equal(companyOnlyPreview.previewRows[0].dedupe_key, "company_domain:company only 1:company-only-1.example.com");
assert.equal(shouldQueueBuyerPipelineJobForState("website_verification_queued"), true);
assert.equal(shouldQueueBuyerPipelineJobForState("refresh_queued"), true);
assert.equal(shouldQueueBuyerPipelineJobForState("qualified"), false);
assert.equal(shouldReactivateBuyerPipelineJob("completed"), true);
assert.equal(shouldReactivateBuyerPipelineJob("queued"), false);

const attachedWorkbookPath = process.env.MARKETVIBE_XLSX_ACCEPTANCE_FILE || "C:\\Users\\qwerty\\Downloads\\marketvibe_us_builder_buyers_50.xlsx";
if (existsSync(attachedWorkbookPath)) {
  const attachedWorkbookPreview = await buildImportPreviewFromWorkbookBuffer({
    buffer: readFileSync(attachedWorkbookPath),
    filename: basename(attachedWorkbookPath),
  });
  assert.equal(attachedWorkbookPreview.sourceFormat, "xlsx");
  assert.equal(attachedWorkbookPreview.stats.totalRows, 50);
  assert.equal(attachedWorkbookPreview.stats.validRows, 50);
  assert.equal(attachedWorkbookPreview.stats.rejectedRows, 0);
  assert.equal(attachedWorkbookPreview.stats.duplicateRows, 0);
  assert.equal(attachedWorkbookPreview.stats.rowsMissingCompany, 0);
  assert.equal(attachedWorkbookPreview.stats.rowsMissingAllUsableSourceReferences, 0);
  assert.ok(attachedWorkbookPreview.worksheetName, "XLSX preview must report the worksheet used.");
  assert.ok(attachedWorkbookPreview.fileChecksum, "XLSX preview must archive a file checksum.");
  assert.equal(attachedWorkbookPreview.rowFingerprints.length, 50);
  assert.equal(attachedWorkbookPreview.mapping.company_name, "Company Name");
  assert.equal(attachedWorkbookPreview.mapping.company_website, "Company Website");
  assert.equal(attachedWorkbookPreview.mapping.company_domain, "Company Domain");
  assert.equal(attachedWorkbookPreview.mapping.public_signal_url, "Public Signal URL");

  const firstStore = new InMemoryOperationsStore();
  const firstImport = firstStore.importPreview(attachedWorkbookPreview);
  assert.equal(firstImport.totalRows, 50);
  assert.equal(firstImport.validRows, 50);
  assert.equal(firstImport.rejectedRows, 0);
  assert.equal(firstImport.duplicateRows, 0);
  assert.equal(firstImport.companiesCreated, 50);
  assert.equal(firstImport.companiesRemaining, 50);
  assert.equal(firstImport.queuedJobs, 50);
  assert.equal(Array.from(firstStore.companies.values()).every((company) => company.contactStatus === "unresolved"), true);
  assert.equal(Array.from(firstStore.companies.values()).every((company) => company.auditEventIds.length >= 1), true);

  const workerResult = firstStore.runWorker();
  const validDownstreamStates = new Set(["qualified", "rejected", "quarantined", "contact_unresolved", "retry_scheduled"]);
  assert.equal(workerResult.processed, 50);
  assert.equal(workerResult.states.every((state) => validDownstreamStates.has(state)), true);

  const restartedStore = InMemoryOperationsStore.fromSnapshot(firstStore.snapshot());
  assert.equal(restartedStore.companies.size, 50);
  assert.equal(restartedStore.jobs.filter((job) => job.status === "completed").length, 50);
  const secondImport = restartedStore.importPreview(attachedWorkbookPreview);
  assert.equal(secondImport.companiesCreated, 0);
  assert.equal(secondImport.duplicateRows, 50);
  assert.equal(secondImport.companiesRemaining, 50);
  assert.ok(restartedStore.auditEvents.filter((event) => event.eventType === "buyer_company_duplicate_import").length >= 50);
} else {
  console.warn(`Skipping attached XLSX acceptance fixture because it was not found at ${attachedWorkbookPath}.`);
}

assert.equal(isPrivateIpAddress("127.0.0.1"), true);
assert.equal(isPrivateIpAddress("10.0.0.5"), true);
assert.equal(isPrivateIpAddress("172.20.1.1"), true);
assert.equal(isPrivateIpAddress("192.168.1.5"), true);
await assert.rejects(() => assertSafePublicUrl("http://localhost:3000"), /blocked/i);
await assert.rejects(() => assertSafePublicUrl("https://www.linkedin.com/in/test"), /blocked/i);
await assert.rejects(
  () => importProspectsFromRows({ filename: "too-many.csv", rows: Array.from({ length: MAX_IMPORT_ROWS + 1 }, () => ({})), mapping: {} }),
  /too many rows/i,
);

assert.ok(calculateFitScore(linkedinRow) >= 80);
assert.equal(calculateIntentScore({ ...linkedinRow, public_signal_text: "", public_signal_url: "" }, null), null);
assert.equal(classifyEvidenceStatus({ ...linkedinRow, public_signal_text: "", public_signal_url: "" }, null), "profile_only");
assert.equal(classifyEvidenceStatus({ ...linkedinRow, public_signal_text: "Fictional public operations delay", public_signal_url: "" }, null), "public_signal_verified");

const adminApiRoutes: string[] = [];
function collectRoutes(directory: string) {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) collectRoutes(fullPath);
    if (stats.isFile() && entry === "route.ts") adminApiRoutes.push(fullPath);
  }
}
collectRoutes(join(process.cwd(), "src", "app", "api", "admin"));
for (const route of adminApiRoutes.filter((route) => !route.includes(`${join("admin", "logout")}`))) {
  const source = readFileSync(route, "utf8");
  assert.match(source, /requireAdminJson\(\)/, `Admin API route is missing server-side admin protection: ${route}`);
}

const redirects = await nextConfig.redirects?.();
assert.equal(
  redirects?.some((rule) => rule.source === "/admin/import/:path*"),
  false,
  "The authenticated CSV Import route must not be redirected back to /admin.",
);

const adminLayoutSource = readFileSync(join(process.cwd(), "src", "app", "admin", "layout.tsx"), "utf8");
assert.match(adminLayoutSource, /await\s+requireAdmin\(\)/, "Admin pages must keep server-side admin authentication.");

const adminImportPageSource = readFileSync(join(process.cwd(), "src", "app", "admin", "import", "page.tsx"), "utf8");
assert.match(adminImportPageSource, /AdminImportConsole/, "The /admin/import route must render the CSV import console.");
assert.doesNotMatch(adminImportPageSource, /redirect\(\s*["'`]\/admin["'`]/, "The /admin/import page must not redirect to /admin.");

const adminNavSource = readFileSync(join(process.cwd(), "src", "components", "AdminNav.tsx"), "utf8");
assert.match(adminNavSource, /"CSV Import",\s*"\/admin\/import"/, "Admin navigation must link CSV Import to /admin/import.");
assert.match(adminNavSource, /"Operations",\s*"\/admin\/operations"/, "Admin navigation must link the owner Operations screen.");
assert.match(adminNavSource, /"Exceptions",\s*"\/admin\/exceptions"/, "Admin navigation must link the Exceptions Inbox.");

const operationsMigration = readFileSync(join(process.cwd(), "supabase", "migrations", "0010_marketvibe_operations_pipeline.sql"), "utf8");
assert.match(operationsMigration, /create table if not exists marketvibe_buyer_companies/, "Operations migration must create buyer company pipeline storage.");
assert.match(operationsMigration, /create table if not exists marketvibe_job_queue/, "Operations migration must create durable queue storage.");
assert.match(operationsMigration, /create table if not exists marketvibe_job_locks/, "Operations migration must create worker lock storage.");
assert.match(operationsMigration, /create table if not exists marketvibe_audit_events/, "Operations migration must create audit event storage.");
assert.match(operationsMigration, /create table if not exists marketvibe_exceptions/, "Operations migration must create exceptions storage.");

const { AdminImportConsole } = localRequire("../src/components/AdminImportConsole.tsx") as {
  AdminImportConsole: React.ComponentType;
};
const adminImportMarkup = renderToStaticMarkup(React.createElement(AdminImportConsole));
assert.match(adminImportMarkup, /Lead Intake Console/, "The importer route must render the lead intake console.");
assert.match(adminImportMarkup, /Paste LinkedIn\/Sales Navigator URLs here\. No spreadsheet required\./, "The importer route must expose the Quick Paste workflow.");
assert.match(adminImportMarkup, /property developers or high-end builders/, "Quick Paste must point admins toward property/construction opportunity intake.");
assert.match(adminImportMarkup, /Advanced file import/, "The importer route must keep CSV/XLSX import available for advanced users.");
assert.doesNotMatch(adminImportMarkup, /Daily Operations/, "The importer route must not render the admin dashboard.");
const adminImportConsoleSource = readFileSync(join(process.cwd(), "src", "components", "AdminImportConsole.tsx"), "utf8");
assert.match(adminImportConsoleSource, /Auto-map and validate/, "CSV mapping must expose a primary auto-map and validate button.");
assert.match(adminImportConsoleSource, /Import valid rows/, "CSV mapping must expose a clear import-valid-rows button.");
assert.match(adminImportConsoleSource, /Ignore this column/, "Every source-column mapping dropdown must include an ignore option.");

const opportunityEngineSource = readFileSync(join(process.cwd(), "src", "lib", "opportunity-engine.ts"), "utf8");
assert.match(opportunityEngineSource, /Property Pipeline Buyers/, "Quick Paste default profile must be the property pipeline profile.");
assert.match(opportunityEngineSource, /High-ticket property, construction, and real estate service businesses/, "Quick Paste default buyer type must target high-ticket property customers.");
assert.doesNotMatch(opportunityEngineSource, /B2B Pipeline Buyers|SEO agency|web design agency/, "Quick Paste defaults must not target SEO or web-design agencies.");

const persistenceSource = readFileSync(join(process.cwd(), "src", "lib", "sales-navigator-persistence.ts"), "utf8");
assert.match(persistenceSource, /status:\s*"email_failed"/, "Delivery failures must be recorded.");
assert.match(persistenceSource, /throw new Error\(emailError instanceof Error/, "Delivery email failures must throw instead of returning false success.");
const cronBuyerPipelineSource = readFileSync(join(process.cwd(), "src", "app", "api", "cron", "buyer-pipeline", "route.ts"), "utf8");
assert.match(cronBuyerPipelineSource, /backfillImportedBuyerCompanies/, "Buyer-pipeline cron must backfill imported prospects before queue recovery.");

const token = "test-token";
const hash = tokenHash(token);
assert.equal(canCustomerAccessDelivery({ requestedEmail: "buyer@example.com", batchEmail: "buyer@example.com", token, tokenHashValue: hash }), true);
assert.equal(canCustomerAccessDelivery({ requestedEmail: "other@example.com", batchEmail: "buyer@example.com", token, tokenHashValue: hash }), false);

const csv = buildDeliveryCsv([
  {
    full_name: "=Avery Stone",
    job_title: "Head of Operations",
    company_name: "Northstar Test Systems",
    location: "Test City",
    industry: "Software",
    company_website: "https://example.com",
    linkedin_profile_url: "https://linkedin.com/in/avery-stone-test",
    public_email: "avery@example.test",
    public_phone: "",
    fit_score: 85,
    intent_score: null,
    evidence_status: "profile_only",
    evidence_summary: "Intent not evidenced.",
    public_signal_url: "",
    public_signal_text: "",
    suggested_outreach_angle: "No direct intent signal was supplied.",
    delivered_at: "2026-07-10T00:00:00Z",
  },
]);
assert.match(csv, /"Intent Score"/);
assert.match(csv, /"Intent not evidenced"/);
assert.match(csv, /"'=Avery Stone"/);

console.log("Sales Navigator CSV importer tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
