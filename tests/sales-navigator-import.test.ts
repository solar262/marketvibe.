import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  assertSafePublicUrl,
  buildDeliveryCsv,
  buildDedupeKey,
  buildImportPreview,
  calculateFitScore,
  calculateIntentScore,
  classifyEvidenceStatus,
  detectDelimiter,
  inferColumnMapping,
  isPrivateIpAddress,
  normalizeEmail,
  normalizeLinkedInUrl,
  normalizeHttpUrl,
  parseCsvText,
  tokenHash,
} from "../src/lib/sales-navigator-import";
import { canCustomerAccessDelivery } from "../src/lib/sales-navigator-persistence";

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

const preview = buildImportPreview({ text: `${commaCsv}\nAvery,Stone,Head of Operations,Northstar Test Systems,https://example.com,https://www.linkedin.com/in/avery-stone-test/?trk=again,,`, filename: "test.csv" });
assert.equal(preview.stats.totalRows, 3);
assert.equal(preview.stats.validRows, 2);
assert.equal(preview.stats.duplicateRows, 1);
assert.equal(preview.stats.rejectedRows, 0);
assert.equal(preview.previewRows[1].intent_score, null);
assert.equal(preview.previewRows[1].evidence_summary, "Intent not evidenced. No direct public buying-intent signal was supplied or verified.");

assert.equal(isPrivateIpAddress("127.0.0.1"), true);
assert.equal(isPrivateIpAddress("10.0.0.5"), true);
assert.equal(isPrivateIpAddress("172.20.1.1"), true);
assert.equal(isPrivateIpAddress("192.168.1.5"), true);
await assert.rejects(() => assertSafePublicUrl("http://localhost:3000"), /blocked/i);
await assert.rejects(() => assertSafePublicUrl("https://www.linkedin.com/in/test"), /blocked/i);

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

const persistenceSource = readFileSync(join(process.cwd(), "src", "lib", "sales-navigator-persistence.ts"), "utf8");
assert.match(persistenceSource, /status:\s*"email_failed"/, "Delivery failures must be recorded.");
assert.match(persistenceSource, /throw new Error\(emailError instanceof Error/, "Delivery email failures must throw instead of returning false success.");

const token = "test-token";
const hash = tokenHash(token);
assert.equal(canCustomerAccessDelivery({ requestedEmail: "buyer@example.com", batchEmail: "buyer@example.com", token, tokenHashValue: hash }), true);
assert.equal(canCustomerAccessDelivery({ requestedEmail: "other@example.com", batchEmail: "buyer@example.com", token, tokenHashValue: hash }), false);

const csv = buildDeliveryCsv([
  {
    full_name: "Avery Stone",
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

console.log("Sales Navigator CSV importer tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
