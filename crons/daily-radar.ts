import { getDailyRadarLeads, getDailyRadarUsers } from '../backend/db.ts';
import { sendEmail } from '../backend/mailer.ts';
import { renderDailyRadarMjml, renderMjmlToHtml } from '../backend/templates.ts';

export const schedule = '30 6 * * *';

export async function runDailyRadar(now = new Date()) {
  const users = getDailyRadarUsers();
  const sent: Array<{ email: string; leadCount: number }> = [];
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  for (const user of users) {
    const settings = parseSettings(user.settings_json);
    const leads = getDailyRadarLeads(settings, since, 20);
    if (!leads.length) continue;

    const mjml = renderDailyRadarMjml(user, leads);
    const html = await renderMjmlToHtml(mjml);

    await sendEmail({
      to: user.email,
      subject: `MarketVibe Daily Radar: ${leads.length} high-intent signals`,
      html,
    });

    sent.push({ email: user.email, leadCount: leads.length });
  }

  return sent;
}

function parseSettings(settingsJson: string) {
  try {
    const parsed = JSON.parse(settingsJson);
    return Array.isArray(parsed) ? parsed.map(String) : ['Agencies'];
  } catch {
    return ['Agencies'];
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyRadar().then((result) => {
    console.log(`Sent ${result.length} radar email(s).`);
  });
}
