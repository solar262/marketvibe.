import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export async function renderPdfFromHtml(html: string, outputPath: string) {
  mkdirSync(path.dirname(outputPath), { recursive: true });

  if (process.env.NODE_ENV === 'test' || process.env.MOCK_PDF === 'true') {
    writeFileSync(outputPath, fallbackPdfBuffer(html));
    return outputPath;
  }

  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
    await browser.close();
    return outputPath;
  } catch (error) {
    if (process.env.ALLOW_PDF_FALLBACK === 'true') {
      writeFileSync(outputPath, fallbackPdfBuffer(html));
      return outputPath;
    }
    throw error;
  }
}

function fallbackPdfBuffer(html: string) {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 1600);
  const stream = `BT /F1 12 Tf 48 780 Td (${escapePdf(text)}) Tj ET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];
  const body = objects.join('\n');
  return Buffer.from(`%PDF-1.4\n${body}\ntrailer << /Root 1 0 R >>\n%%EOF`);
}

function escapePdf(value: string) {
  return value.replace(/[()\\]/g, '\\$&');
}
