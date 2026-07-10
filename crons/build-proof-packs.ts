import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  getPendingPaidSampleRequests,
  getTopLeadsForNiche,
  markSampleRequestProcessed,
} from '../backend/db.ts';
import { sendEmail } from '../backend/mailer.ts';
import { renderPdfFromHtml } from '../backend/pdf.ts';
import { renderProofPackCsv, renderProofPackHtml } from '../backend/templates.ts';

export const schedule = '0 7 * * *';

export async function runBuildProofPacks(now = new Date()) {
  const requests = getPendingPaidSampleRequests();
  const processed: Array<{ requestId: number; pdfPath: string; csvPath: string }> = [];

  for (const request of requests) {
    const leads = getTopLeadsForNiche(request.niche, 30);
    const datePrefix = formatDate(now);
    const slug = slugify(request.niche);
    const publicDir = process.env.PUBLIC_DIR || path.join(process.cwd(), 'public');
    const proofpackDir = path.join(publicDir, 'proofpacks');
    mkdirSync(proofpackDir, { recursive: true });

    const pdfPath = path.join(proofpackDir, `${datePrefix}_${slug}_${request.id}.pdf`);
    const csvPath = path.join(proofpackDir, `${datePrefix}_${slug}_${request.id}.csv`);

    const html = renderProofPackHtml(request, leads);
    const csv = renderProofPackCsv(leads);
    await renderPdfFromHtml(html, pdfPath);
    writeFileSync(csvPath, csv);

    await sendEmail({
      to: request.email,
      subject: `Your MarketVibe Proof Pack: ${request.niche}`,
      html: `
        <p>Your MarketVibe Proof Pack is attached.</p>
        <p>It includes ${leads.length} buyer-intent signals, a PDF report, and a CSV export.</p>
      `,
      attachments: [
        {
          filename: path.basename(pdfPath),
          type: 'application/pdf',
          content: readFileSync(pdfPath).toString('base64'),
        },
        {
          filename: path.basename(csvPath),
          type: 'text/csv',
          content: Buffer.from(csv).toString('base64'),
        },
      ],
    });

    const publicPath = `/proofpacks/${path.basename(pdfPath)}`;
    markSampleRequestProcessed(request.id, publicPath);
    processed.push({ requestId: request.id, pdfPath, csvPath });
  }

  return processed;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBuildProofPacks().then((result) => {
    console.log(`Processed ${result.length} proof pack(s).`);
  });
}
