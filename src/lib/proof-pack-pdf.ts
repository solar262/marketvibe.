export type ProofPackPdfItem = {
  companyName: string;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  location?: string | null;
  score?: number | null;
  summary?: string | null;
  recommendedAction?: string | null;
};

type PdfLine = {
  text: string;
  size?: number;
  leading?: number;
};

type PositionedPdfLine = PdfLine & {
  y: number;
};

const PAGE_TOP = 744;
const PAGE_BOTTOM = 48;
const DEFAULT_LEADING = 12;

function cleanPdfText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: unknown, maxLength = 88) {
  const text = cleanPdfText(value);
  if (!text) return [];

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    if (word.length <= maxLength) {
      current = word;
      continue;
    }

    for (let index = 0; index < word.length; index += maxLength) {
      const part = word.slice(index, index + maxLength);
      if (part.length === maxLength) lines.push(part);
      else current = part;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function prefixedLines(label: string, value: unknown, maxLength = 88): PdfLine[] {
  const wrapped = wrapText(`${label}${cleanPdfText(value)}`, maxLength);
  return wrapped.map((text) => ({ text }));
}

export function proofPackPdfItemsFromOpportunityRows(rows: Array<Record<string, unknown>>): ProofPackPdfItem[] {
  return rows.map((row) => {
    const opportunity = (row.opportunities || row.opportunity || row) as Record<string, unknown>;
    return {
      companyName: cleanPdfText(opportunity.company_name) || "Unnamed opportunity",
      sourceTitle: cleanPdfText(opportunity.source_title || opportunity.source_name),
      sourceUrl: cleanPdfText(opportunity.source_url),
      location: cleanPdfText(opportunity.company_location || opportunity.target_location || opportunity.company_country),
      score: Number.isFinite(Number(opportunity.overall_score)) ? Number(opportunity.overall_score) : null,
      summary: cleanPdfText(opportunity.customer_summary || opportunity.source_text || opportunity.company_description),
      recommendedAction: cleanPdfText(opportunity.recommended_action),
    };
  });
}

function documentLines(items: ProofPackPdfItem[], customerEmail?: string, generatedAt?: string): PdfLine[] {
  const lines: PdfLine[] = [
    { text: "MarketVibe Proof Pack", size: 18, leading: 24 },
    { text: "Verified buyer-intent opportunity intelligence", size: 11, leading: 18 },
  ];

  if (customerEmail) lines.push({ text: `Prepared for: ${cleanPdfText(customerEmail)}` });
  lines.push({ text: `Generated: ${cleanPdfText(generatedAt || new Date().toISOString())}`, leading: 18 });

  if (items.length === 0) {
    lines.push(
      { text: "No verified buyer-intent opportunities are available in this delivery." },
      { text: "MarketVibe does not pad Proof Packs with generic or unverified records." },
    );
    return lines;
  }

  for (const [index, item] of items.entries()) {
    const score = typeof item.score === "number" ? ` | score ${Math.round(item.score)}` : "";
    lines.push({ text: `${index + 1}. ${cleanPdfText(item.companyName) || "Unnamed opportunity"}${score}`, size: 11, leading: 15 });
    if (item.location) lines.push(...prefixedLines("Location: ", item.location));
    if (item.sourceTitle) lines.push(...prefixedLines("Source: ", item.sourceTitle));
    if (item.summary) lines.push(...prefixedLines("Opportunity: ", item.summary));
    if (item.recommendedAction) lines.push(...prefixedLines("Recommended action: ", item.recommendedAction));
    if (item.sourceUrl) lines.push(...prefixedLines("Evidence link: ", item.sourceUrl));
    lines.push({ text: "", leading: 8 });
  }

  return lines;
}

function paginate(lines: PdfLine[]) {
  const pages: PositionedPdfLine[][] = [];
  let current: PositionedPdfLine[] = [];
  let y = PAGE_TOP;

  for (const line of lines) {
    const leading = line.leading || DEFAULT_LEADING;
    if (current.length > 0 && y - leading < PAGE_BOTTOM) {
      pages.push(current);
      current = [];
      y = PAGE_TOP;
    }

    current.push({ ...line, y });
    y -= leading;
  }

  if (current.length > 0) pages.push(current);
  return pages.length > 0 ? pages : [[{ text: "MarketVibe Proof Pack", size: 18, y: PAGE_TOP }]];
}

function pageContent(lines: PositionedPdfLine[], pageNumber: number, pageCount: number) {
  const commands = ["BT"];
  for (const line of lines) {
    const size = line.size || 9;
    commands.push(`/F1 ${size} Tf`);
    commands.push(`1 0 0 1 48 ${line.y} Tm (${escapePdfText(cleanPdfText(line.text))}) Tj`);
  }
  commands.push("/F1 8 Tf");
  commands.push(`1 0 0 1 48 28 Tm (MarketVibe | Page ${pageNumber} of ${pageCount}) Tj`);
  commands.push("ET");
  return commands.join("\n");
}

export function buildProofPackPdf(
  items: ProofPackPdfItem[],
  options: { customerEmail?: string; generatedAt?: string } = {},
) {
  const pages = paginate(documentLines(items, options.customerEmail, options.generatedAt));
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  const pageReferences: string[] = [];
  pages.forEach((lines, index) => {
    const pageObject = 4 + index * 2;
    const contentObject = pageObject + 1;
    const stream = pageContent(lines, index + 1, pages.length);
    pageReferences.push(`${pageObject} 0 R`);
    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageReferences.join(" ")}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\n%MarketVibe\n";
  const offsets: number[] = [0];
  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    offsets[objectNumber] = Buffer.byteLength(pdf, "utf8");
    pdf += `${objectNumber} 0 obj\n${objects[objectNumber]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    pdf += `${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
