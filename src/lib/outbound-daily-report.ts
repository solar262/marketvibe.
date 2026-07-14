import { marketVibeUrl, sendTransactionalEmail } from "@/lib/brevo";
import { salesOutboundConfig } from "@/lib/sales-pipeline";
import { getSupabaseAdmin } from "@/lib/supabase";

type CountResult = {
  value: number;
  error?: string;
};

type RecentLeadRow = {
  email?: string | null;
  company_name?: string | null;
  region?: string | null;
  source_url?: string | null;
  source_evidence?: string | null;
  last_contacted_at?: string | null;
};

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function missingTableMessage(error: unknown) {
  const message = String((error as { message?: unknown })?.message || error || "").toLowerCase();
  return message.includes("could not find the table")
    || message.includes("schema cache")
    || (message.includes("relation") && message.includes("does not exist"));
}

function startOfUtcDay(date = new Date()) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export function outboundDailyReportRecipient() {
  return cleanString(process.env.SALES_OUTBOUND_REPORT_EMAIL || process.env.ADMIN_EMAIL || "");
}

async function countRows(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, table: string, applyQuery: (query: any) => any): Promise<CountResult> {
  const result = await applyQuery(supabase.from(table).select("id", { count: "exact", head: true }));
  if (result.error) {
    if (missingTableMessage(result.error)) return { value: 0, error: result.error.message };
    throw new Error(result.error.message);
  }
  return { value: result.count || 0 };
}

async function selectRows<T>(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, table: string, columns: string, applyQuery: (query: any) => any): Promise<T[]> {
  const result = await applyQuery(supabase.from(table).select(columns));
  if (result.error) {
    if (missingTableMessage(result.error)) return [];
    throw new Error(result.error.message);
  }
  return (result.data || []) as T[];
}

function leadListHtml(leads: RecentLeadRow[]) {
  if (!leads.length) return "<p>No outbound contacts were marked contacted today.</p>";
  return `<ol>${leads.map((lead) => `
    <li>
      <strong>${escapeHtml(lead.company_name || lead.email || "Unknown company")}</strong>
      ${lead.region ? ` (${escapeHtml(lead.region)})` : ""}
      ${lead.last_contacted_at ? ` - ${escapeHtml(formatDateTime(lead.last_contacted_at))}` : ""}
      ${lead.source_evidence ? `<br><span>${escapeHtml(lead.source_evidence)}</span>` : ""}
      ${lead.source_url ? `<br><a href="${escapeHtml(lead.source_url)}">${escapeHtml(lead.source_url)}</a>` : ""}
    </li>
  `).join("")}</ol>`;
}

function leadListText(leads: RecentLeadRow[]) {
  if (!leads.length) return "No outbound contacts were marked contacted today.";
  return leads.map((lead, index) => {
    const company = lead.company_name || lead.email || "Unknown company";
    const contacted = lead.last_contacted_at ? ` - ${formatDateTime(lead.last_contacted_at)}` : "";
    const evidence = lead.source_evidence ? `\n   Evidence: ${lead.source_evidence}` : "";
    const source = lead.source_url ? `\n   Source: ${lead.source_url}` : "";
    return `${index + 1}. ${company}${lead.region ? ` (${lead.region})` : ""}${contacted}${evidence}${source}`;
  }).join("\n");
}

export async function buildOutboundDailyReport(now = new Date()) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const since = startOfUtcDay(now).toISOString();
  const config = salesOutboundConfig();
  const [
    newProspects,
    contactedToday,
    sentToday,
    failedToday,
    skippedToday,
    queuedNow,
    approvedNow,
    manualReviewNow,
    blockedNow,
    suppressedNow,
  ] = await Promise.all([
    countRows(supabase, "sales_leads", (query) => query.eq("source", "cold_outbound").gte("created_at", since)),
    countRows(supabase, "sales_leads", (query) => query.eq("source", "cold_outbound").gte("last_contacted_at", since)),
    countRows(supabase, "sales_email_events", (query) => query.eq("status", "sent").gte("sent_at", since)),
    countRows(supabase, "sales_email_events", (query) => query.eq("status", "failed").gte("created_at", since)),
    countRows(supabase, "sales_email_events", (query) => query.eq("status", "skipped").gte("created_at", since)),
    countRows(supabase, "sales_email_events", (query) => query.eq("status", "queued")),
    countRows(supabase, "sales_leads", (query) => query.eq("source", "cold_outbound").eq("compliance_status", "approved")),
    countRows(supabase, "sales_leads", (query) => query.eq("source", "cold_outbound").eq("compliance_status", "manual_review")),
    countRows(supabase, "sales_leads", (query) => query.eq("source", "cold_outbound").eq("compliance_status", "blocked")),
    countRows(supabase, "sales_suppression_list", (query) => query),
  ]);

  const recentContacted = await selectRows<RecentLeadRow>(
    supabase,
    "sales_leads",
    "email,company_name,region,source_url,source_evidence,last_contacted_at",
    (query) => query
      .eq("source", "cold_outbound")
      .gte("last_contacted_at", since)
      .order("last_contacted_at", { ascending: false })
      .limit(15),
  );

  const stats = {
    date: now.toISOString().slice(0, 10),
    dailyLimit: config.dailyLimit,
    enabled: config.enabled,
    allowedRegions: config.allowedRegions.join(", "),
    newProspects: newProspects.value,
    contactedToday: contactedToday.value,
    sentToday: sentToday.value,
    failedToday: failedToday.value,
    skippedToday: skippedToday.value,
    queuedNow: queuedNow.value,
    approvedNow: approvedNow.value,
    manualReviewNow: manualReviewNow.value,
    blockedNow: blockedNow.value,
    suppressedNow: suppressedNow.value,
    warnings: [
      newProspects.error,
      contactedToday.error,
      sentToday.error,
      failedToday.error,
      skippedToday.error,
      queuedNow.error,
      approvedNow.error,
      manualReviewNow.error,
      blockedNow.error,
      suppressedNow.error,
    ].filter(Boolean),
  };

  const subject = `MarketVibe outbound report: ${stats.sentToday} sent, ${stats.newProspects} new prospects`;
  const htmlContent = `
    <h2>MarketVibe outbound daily report</h2>
    <p><strong>Date:</strong> ${escapeHtml(stats.date)}</p>
    <p><strong>Autopilot:</strong> ${stats.enabled ? "enabled" : "disabled"} | <strong>Daily limit:</strong> ${stats.dailyLimit} | <strong>Regions:</strong> ${escapeHtml(stats.allowedRegions)}</p>
    <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#d8dee9;">
      <tr><td>New prospects found today</td><td><strong>${stats.newProspects}</strong></td></tr>
      <tr><td>Outbound contacts marked contacted today</td><td><strong>${stats.contactedToday}</strong></td></tr>
      <tr><td>Emails sent today</td><td><strong>${stats.sentToday}</strong></td></tr>
      <tr><td>Emails failed today</td><td><strong>${stats.failedToday}</strong></td></tr>
      <tr><td>Emails skipped today</td><td><strong>${stats.skippedToday}</strong></td></tr>
      <tr><td>Queued emails remaining</td><td><strong>${stats.queuedNow}</strong></td></tr>
      <tr><td>Approved outbound prospects total</td><td><strong>${stats.approvedNow}</strong></td></tr>
      <tr><td>Manual review total</td><td><strong>${stats.manualReviewNow}</strong></td></tr>
      <tr><td>Blocked total</td><td><strong>${stats.blockedNow}</strong></td></tr>
      <tr><td>Suppression list total</td><td><strong>${stats.suppressedNow}</strong></td></tr>
    </table>
    <h3>Recent contacted companies</h3>
    ${leadListHtml(recentContacted)}
    ${stats.warnings.length ? `<p><strong>Warnings:</strong> ${escapeHtml(stats.warnings.join(" | "))}</p>` : ""}
    <p><a href="${marketVibeUrl}/admin/outbound">Open outbound admin</a></p>
  `;
  const textContent = [
    "MarketVibe outbound daily report",
    `Date: ${stats.date}`,
    `Autopilot: ${stats.enabled ? "enabled" : "disabled"}`,
    `Daily limit: ${stats.dailyLimit}`,
    `Regions: ${stats.allowedRegions}`,
    "",
    `New prospects found today: ${stats.newProspects}`,
    `Outbound contacts marked contacted today: ${stats.contactedToday}`,
    `Emails sent today: ${stats.sentToday}`,
    `Emails failed today: ${stats.failedToday}`,
    `Emails skipped today: ${stats.skippedToday}`,
    `Queued emails remaining: ${stats.queuedNow}`,
    `Approved outbound prospects total: ${stats.approvedNow}`,
    `Manual review total: ${stats.manualReviewNow}`,
    `Blocked total: ${stats.blockedNow}`,
    `Suppression list total: ${stats.suppressedNow}`,
    "",
    "Recent contacted companies:",
    leadListText(recentContacted),
    stats.warnings.length ? `\nWarnings: ${stats.warnings.join(" | ")}` : "",
    "",
    `Open outbound admin: ${marketVibeUrl}/admin/outbound`,
  ].filter(Boolean).join("\n");

  return { subject, htmlContent, textContent, stats, recentContacted };
}

export async function sendOutboundDailyReport() {
  const to = outboundDailyReportRecipient();
  if (!to) {
    return {
      ok: false,
      skipped: "SALES_OUTBOUND_REPORT_EMAIL or ADMIN_EMAIL is not configured.",
    };
  }

  const report = await buildOutboundDailyReport();
  const sent = await sendTransactionalEmail({
    to,
    subject: report.subject,
    htmlContent: report.htmlContent,
    textContent: report.textContent,
  });

  return { ok: true, to, stats: report.stats, sent };
}
