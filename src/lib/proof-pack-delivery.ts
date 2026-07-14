import { getSupabaseAdmin } from "@/lib/supabase";
import { sendSendGridEmail } from "@/lib/sendgrid";

export type SampleRequestRow = {
  id: string;
  customer_email: string;
  customer_name?: string | null;
  niche?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type LeadVaultRow = {
  id?: string;
  company_name?: string | null;
  website?: string | null;
  source_url?: string | null;
  niche?: string | null;
  intent_score?: number | null;
  evidence_summary?: string | null;
  public_signal_text?: string | null;
  created_at?: string | null;
  payload?: Record<string, unknown> | null;
  [key: string]: unknown;
};

function cleanText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapLine(value: string, maxLength = 92) {
  const words = cleanText(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function simplePdf(lines: string[]) {
  const pageLines = lines.flatMap((line) => wrapLine(line)).slice(0, 72);
  const stream = pageLines
    .map((line, index) => {
      const y = 770 - index * 13;
      return `BT /F1 10 Tf 48 ${y} Td (${escapePdfText(line)}) Tj ET`;
    })
    .join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

export function buildProofPackPdfBuffer({
  request,
  leads,
}: {
  request: SampleRequestRow;
  leads: LeadVaultRow[];
}) {
  const lines = [
    "MarketVibe Proof Pack",
    `Customer: ${request.customer_email}`,
    `Niche: ${request.niche || "Not specified"}`,
    `Paid at: ${request.paid_at || request.created_at || "Recorded payment"}`,
    "",
    leads.length > 0
      ? "Evidence-backed rows from lead_vault:"
      : "No matching lead_vault rows were available when this PDF was generated.",
  ];

  leads.slice(0, 30).forEach((lead, index) => {
    const company = lead.company_name || "Unnamed company";
    const score = typeof lead.intent_score === "number" ? String(lead.intent_score) : "Not scored";
    const website = lead.website || lead.source_url || "No source URL";
    const evidence = lead.evidence_summary || lead.public_signal_text || "No evidence summary supplied.";
    lines.push("");
    lines.push(`${index + 1}. ${company}`);
    lines.push(`Intent score: ${score}`);
    lines.push(`Source: ${website}`);
    lines.push(`Evidence: ${evidence}`);
  });

  return simplePdf(lines);
}

function safeLimit(value?: number) {
  if (!value || !Number.isFinite(value)) return 10;
  return Math.max(1, Math.min(50, Math.floor(value)));
}

function cleanIlikeTerm(value: string) {
  return value.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchProofPackLeads(niche?: string | null) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [] as LeadVaultRow[];

  let query = supabase
    .from("lead_vault")
    .select("*")
    .order("intent_score", { ascending: false })
    .limit(30);

  const term = cleanIlikeTerm(String(niche || ""));
  if (term) query = query.ilike("niche", `%${term}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as LeadVaultRow[];
}

export async function sendPendingProofPackPdfs({ limit = 10 }: { limit?: number } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, skipped: true, sent: 0, failed: 0, reason: "Supabase server writes are not configured." };

  const { data: requests, error } = await supabase
    .from("sample_requests")
    .select("*")
    .eq("status", "paid")
    .order("created_at", { ascending: true })
    .limit(safeLimit(limit));

  if (error) throw error;

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const request of (requests || []) as SampleRequestRow[]) {
    if (!String(request.niche || "").trim()) {
      await supabase.from("sample_requests").update({
        error_summary: { waiting_for: "customer_onboarding" },
        updated_at: new Date().toISOString(),
      }).eq("id", request.id);
      skipped += 1;
      continue;
    }
    const leads = await fetchProofPackLeads(request.niche);
    if (leads.length === 0) {
      await supabase.from("sample_requests").update({
        error_summary: { waiting_for: "matching_supply" },
        updated_at: new Date().toISOString(),
      }).eq("id", request.id);
      skipped += 1;
      continue;
    }
    const pdf = buildProofPackPdfBuffer({ request, leads });
    const result = await sendSendGridEmail({
      to: request.customer_email,
      templateId: process.env.SENDGRID_PROOF_PACK_TEMPLATE_ID || undefined,
      subject: "Your MarketVibe Proof Pack",
      textContent: `Your MarketVibe Proof Pack PDF is attached.\n\nNiche: ${request.niche || "Not specified"}\nRows included: ${leads.length}`,
      dynamicTemplateData: {
        customer_email: request.customer_email,
        customer_name: request.customer_name || "",
        niche: request.niche || "",
        lead_count: leads.length,
      },
      attachments: [
        {
          content: pdf.toString("base64"),
          filename: "marketvibe-proof-pack.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    });

    if (result.ok) {
      await supabase.from("sample_requests").update({
        status: "pdf_sent",
        pdf_generated_at: new Date().toISOString(),
        pdf_sent_at: new Date().toISOString(),
        sendgrid_message_id: result.messageId,
        error_summary: {},
        updated_at: new Date().toISOString(),
      }).eq("id", request.id);
      sent += 1;
      continue;
    }

    const update = {
      ...(result.skipped ? {} : { status: "email_failed" }),
      error_summary: { sendgrid: result.error, skipped: result.skipped },
      updated_at: new Date().toISOString(),
    };
    await supabase.from("sample_requests").update(update).eq("id", request.id);
    if (result.skipped) skipped += 1;
    else failed += 1;
  }

  return { ok: failed === 0, skipped: false, sent, failed, configSkipped: skipped, attempted: requests?.length || 0 };
}
