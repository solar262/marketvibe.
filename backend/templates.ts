import type { Lead, SampleRequest, User } from './db.ts';

export function renderProofPackHtml(request: SampleRequest, leads: Lead[]) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>MarketVibe Proof Pack</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; color: #160622; padding: 32px; }
          h1 { font-family: Georgia, serif; color: #4c1d95; margin-bottom: 8px; }
          .meta { color: #6b587d; margin-bottom: 28px; }
          article { border: 1px solid #ddd6fe; border-radius: 12px; padding: 16px; margin: 0 0 14px; }
          strong { color: #7c3aed; }
          .score { float: right; font-size: 22px; }
          .angle { background: #f5f3ff; padding: 10px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>MarketVibe Proof Pack: ${escapeHtml(request.niche)}</h1>
        <p class="meta">Prepared for ${escapeHtml(request.email)}. Includes the top ${leads.length} buyer-intent signals.</p>
        ${leads
          .map(
            (lead) => `
              <article>
                <strong class="score">${lead.intent_score}</strong>
                <h2>${escapeHtml(lead.company)}</h2>
                <p><strong>${escapeHtml(lead.intent)}</strong> | ${escapeHtml(lead.buyer)} | ${escapeHtml(lead.location)}</p>
                <p>${escapeHtml(lead.pain)}</p>
                <p class="angle">${escapeHtml(lead.angle)}</p>
              </article>
            `,
          )
          .join('')}
      </body>
    </html>
  `;
}

export function renderProofPackCsv(leads: Lead[]) {
  const rows = [
    ['company', 'buyer', 'source', 'location', 'niche', 'intent', 'intent_score', 'pain', 'angle'],
    ...leads.map((lead) => [
      lead.company,
      lead.buyer,
      lead.source,
      lead.location,
      lead.niche,
      lead.intent,
      lead.intent_score,
      lead.pain,
      lead.angle,
    ]),
  ];

  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
}

export function renderDailyRadarMjml(user: User, leads: Lead[]) {
  const leadRows = leads
    .map(
      (lead) => `
        <mj-section background-color="#ffffff" padding="12px 24px">
          <mj-column>
            <mj-text font-size="18px" font-weight="700" color="#4c1d95">${escapeHtml(lead.company)} - ${lead.intent_score}</mj-text>
            <mj-text color="#463151">${escapeHtml(lead.pain)}</mj-text>
            <mj-text color="#6d28d9">${escapeHtml(lead.angle)}</mj-text>
          </mj-column>
        </mj-section>
      `,
    )
    .join('');

  return `
    <mjml>
      <mj-head>
        <mj-title>MarketVibe Daily Radar</mj-title>
        <mj-preview>Today’s highest-intent signals for your niche.</mj-preview>
      </mj-head>
      <mj-body background-color="#10051f">
        <mj-section background-color="#4c1d95" padding="28px 24px">
          <mj-column>
            <mj-text color="#ffffff" font-size="28px" font-weight="800">MarketVibe Daily Radar</mj-text>
            <mj-text color="#e9d5ff">Prepared for ${escapeHtml(user.email)}</mj-text>
          </mj-column>
        </mj-section>
        ${leadRows}
        <mj-section background-color="#ffffff" padding="24px">
          <mj-column>
            <mj-button background-color="#a855f7" color="#ffffff" href="${publicUrl()}/login">Open workspace</mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;
}

export async function renderMjmlToHtml(mjml: string, fallbackTitle = 'MarketVibe Daily Radar') {
  try {
    const module = await import('mjml');
    const render = (module.default || module) as (source: string, options?: Record<string, unknown>) => { html: string };
    return render(mjml, { validationLevel: 'soft' }).html;
  } catch {
    return `
      <!doctype html>
      <html>
        <body style="font-family: Inter, Arial, sans-serif; background:#10051f; color:#fff; padding:24px;">
          <h1>${escapeHtml(fallbackTitle)}</h1>
          <p>Your MJML renderer is not installed in this environment. The radar job still generated this fallback HTML.</p>
        </body>
      </html>
    `;
  }
}

function publicUrl() {
  return process.env.PUBLIC_URL || 'http://127.0.0.1:5175';
}

export function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
