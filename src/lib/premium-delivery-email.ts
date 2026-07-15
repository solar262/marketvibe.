import { sendTransactionalEmail } from "@/lib/brevo";
import { appendCustomerAccessParams, createCustomerAccessToken } from "@/lib/customer-access";
import { filterDeliverableBuyerIntentAssignments } from "@/lib/customer-delivery-quality";
import { buildProofPackPdf, proofPackPdfItemsFromOpportunityRows } from "@/lib/proof-pack-pdf";
import { getSupabaseAdmin } from "@/lib/supabase";

type DeliveryBatchRow = {
  id: string;
  customer_email: string;
  product_code: "proof_pack" | "radar" | "growth_desk";
  opportunity_count?: number | null;
  premium_email_sent_at?: string | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function radarHighlights(rows: Array<Record<string, unknown>>) {
  return rows.slice(0, 5).map((row) => {
    const opportunity = (row.opportunities || {}) as Record<string, unknown>;
    const company = String(opportunity.company_name || "Buyer-intent opportunity");
    const sourceTitle = String(opportunity.source_title || opportunity.source_name || "Verified public source");
    const score = Number(opportunity.overall_score || 0);
    return {
      company,
      sourceTitle,
      score: Number.isFinite(score) ? Math.round(score) : 0,
    };
  });
}

function deliveryCopy({
  productCode,
  count,
  dashboardUrl,
  csvUrl,
  pdfUrl,
  rows,
}: {
  productCode: DeliveryBatchRow["product_code"];
  count: number;
  dashboardUrl: string;
  csvUrl: string;
  pdfUrl: string;
  rows: Array<Record<string, unknown>>;
}) {
  if (productCode === "proof_pack") {
    return {
      subject: `Your MarketVibe Proof Pack PDF is ready (${count} verified opportunities)`,
      htmlContent: `
        <p>Your MarketVibe Proof Pack is ready.</p>
        <p>It contains ${count} verified buyer-intent opportunities matched to your onboarding brief. The PDF is attached to this email.</p>
        <p><a href="${pdfUrl}">Download the PDF again</a></p>
        <p><a href="${dashboardUrl}">Open your dashboard</a></p>
        <p><a href="${csvUrl}">Download the CSV</a></p>
        <p>MarketVibe does not include generic company profiles, fabricated records, or unverified local-business lists.</p>
      `,
      textContent: `Your MarketVibe Proof Pack is ready.\n\nIt contains ${count} verified buyer-intent opportunities matched to your onboarding brief. The PDF is attached to this email.\n\nDownload PDF:\n${pdfUrl}\n\nDashboard:\n${dashboardUrl}\n\nCSV:\n${csvUrl}\n\nMarketVibe does not include generic company profiles, fabricated records, or unverified local-business lists.`,
    };
  }

  if (productCode === "radar") {
    const highlights = radarHighlights(rows);
    const htmlHighlights = highlights
      .map((item) => `<li><strong>${escapeHtml(item.company)}</strong> — score ${item.score}<br>${escapeHtml(item.sourceTitle)}</li>`)
      .join("");
    const textHighlights = highlights
      .map((item) => `- ${item.company} — score ${item.score}: ${item.sourceTitle}`)
      .join("\n");
    return {
      subject: `Your MarketVibe Radar update: ${count} verified opportunities`,
      htmlContent: `
        <p>Your latest MarketVibe Radar delivery is ready.</p>
        <p>${count} verified buyer-intent opportunities have been matched to your niche, offer, ideal buyer, and territory.</p>
        ${htmlHighlights ? `<ul>${htmlHighlights}</ul>` : ""}
        <p><a href="${dashboardUrl}">Review the full Radar delivery</a></p>
        <p><a href="${csvUrl}">Download the CSV</a></p>
      `,
      textContent: `Your latest MarketVibe Radar delivery is ready.\n\n${count} verified buyer-intent opportunities have been matched to your niche, offer, ideal buyer, and territory.\n\n${textHighlights}\n\nReview the full delivery:\n${dashboardUrl}\n\nDownload CSV:\n${csvUrl}`,
    };
  }

  return {
    subject: `Your managed MarketVibe delivery is ready (${count} verified opportunities)`,
    htmlContent: `
      <p>Your managed Growth Desk delivery is ready.</p>
      <p>${count} verified buyer-intent opportunities have been matched to your custom brief.</p>
      <p><a href="${dashboardUrl}">Open your dashboard</a></p>
      <p><a href="${csvUrl}">Download the CSV</a></p>
    `,
    textContent: `Your managed Growth Desk delivery is ready.\n\n${count} verified buyer-intent opportunities have been matched to your custom brief.\n\nDashboard:\n${dashboardUrl}\n\nCSV:\n${csvUrl}`,
  };
}

export async function sendPendingPremiumDeliveryEmails({ limit = 50 }: { limit?: number } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const { data, error } = await supabase
    .from("opportunity_delivery_batches")
    .select("id,customer_email,product_code,opportunity_count,premium_email_sent_at,status,created_at")
    .in("status", ["published", "delivered"])
    .is("premium_email_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 100)));

  if (error) throw error;

  const counters = {
    examined: 0,
    sent: 0,
    proofPackPdfs: 0,
    radarEmails: 0,
    growthDeskEmails: 0,
    skippedNoVerifiedOpportunities: 0,
    failures: [] as Array<{ batchId: string; customerEmail: string; error: string }>,
  };

  for (const rawBatch of data || []) {
    const batch = rawBatch as DeliveryBatchRow;
    counters.examined += 1;

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("opportunity_assignments")
      .select("*, opportunities(*)")
      .eq("delivery_batch_id", batch.id)
      .in("assignment_status", ["published", "delivered"])
      .order("delivered_at", { ascending: false });

    if (assignmentError) {
      counters.failures.push({
        batchId: batch.id,
        customerEmail: batch.customer_email,
        error: assignmentError.message,
      });
      continue;
    }

    const assignments = filterDeliverableBuyerIntentAssignments((assignmentData || []) as Array<Record<string, unknown>>);
    if (assignments.length === 0) {
      counters.skippedNoVerifiedOpportunities += 1;
      continue;
    }

    const customerEmail = batch.customer_email.trim().toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.marketvibe1.com";
    const accessToken = createCustomerAccessToken(customerEmail);
    const dashboardUrl = `${baseUrl}${appendCustomerAccessParams("/dashboard", customerEmail, accessToken)}`;
    const csvUrl = `${baseUrl}/api/opportunities/csv?email=${encodeURIComponent(customerEmail)}&access_token=${encodeURIComponent(accessToken)}`;
    const pdfUrl = `${baseUrl}/api/proof-pack/pdf?email=${encodeURIComponent(customerEmail)}&access_token=${encodeURIComponent(accessToken)}`;
    const copy = deliveryCopy({
      productCode: batch.product_code,
      count: assignments.length,
      dashboardUrl,
      csvUrl,
      pdfUrl,
      rows: assignments,
    });

    try {
      const attachments = batch.product_code === "proof_pack"
        ? [{
            name: "marketvibe-proof-pack.pdf",
            content: buildProofPackPdf(
              proofPackPdfItemsFromOpportunityRows(assignments),
              { customerEmail, generatedAt: new Date().toISOString() },
            ).toString("base64"),
          }]
        : undefined;

      await sendTransactionalEmail({
        to: customerEmail,
        subject: copy.subject,
        htmlContent: copy.htmlContent,
        textContent: copy.textContent,
        attachments,
      });

      const sentAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("opportunity_delivery_batches")
        .update({
          premium_email_sent_at: sentAt,
          delivery_email_provider: "brevo",
        })
        .eq("id", batch.id)
        .is("premium_email_sent_at", null);
      if (updateError) throw updateError;

      counters.sent += 1;
      if (batch.product_code === "proof_pack") counters.proofPackPdfs += 1;
      else if (batch.product_code === "radar") counters.radarEmails += 1;
      else counters.growthDeskEmails += 1;
    } catch (emailError) {
      const message = emailError instanceof Error ? emailError.message : "Premium delivery email failed.";
      counters.failures.push({ batchId: batch.id, customerEmail, error: message });
      await supabase
        .from("opportunity_delivery_batches")
        .update({
          delivery_email_provider: "brevo",
          error_summary: { premium_delivery_email: message },
        })
        .eq("id", batch.id);
    }
  }

  return counters;
}
