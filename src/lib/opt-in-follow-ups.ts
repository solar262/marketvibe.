import { sendTransactionalEmail } from "./brevo";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.marketvibe1.com";
const leadSearchUrl = `${baseUrl}/lead-search`;
const pricingUrl = `${baseUrl}/pricing`;

function wrap(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;"><div style="max-width:620px;margin:0 auto;padding:28px 18px;"><div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:26px;"><h1 style="font-size:22px;line-height:30px;margin:0 0 14px;color:#020617;">${title}</h1>${body}<p style="margin:22px 0 0;"><a href="${leadSearchUrl}" style="display:inline-block;background:#020617;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:12px 18px;">Run lead search</a></p><p style="font-size:14px;line-height:22px;margin:18px 0 0;color:#334155;">Plans: <a href="${pricingUrl}" style="color:#047857;">${pricingUrl}</a></p></div></div></body></html>`;
}

function plain(title: string, body: string) {
  return `${title}\n\n${body}\n\nRun lead search:\n${leadSearchUrl}\n\nPlans:\n${pricingUrl}\n\nMarketVibe`;
}

export async function sendOptInFollowUp(email: string, step: 1 | 2 | 3 | 4) {
  const messages = {
    1: {
      subject: "Turn one weak website into a paid service offer",
      title: "Turn one weak website into a paid service offer",
      body: "<p style=\"font-size:16px;line-height:24px;margin:0 0 14px;\">Look for a business with no clear call-to-action, weak booking flow, poor mobile experience, or missing review visibility. That is your opening for web design, SEO, booking setup, or conversion work.</p>",
      text: "Look for a business with no clear call-to-action, weak booking flow, poor mobile experience, or missing review visibility. That is your opening for web design, SEO, booking setup, or conversion work.",
    },
    2: {
      subject: "Your next MarketVibe search can find better prospects",
      title: "Your next MarketVibe search can find better prospects",
      body: "<p style=\"font-size:16px;line-height:24px;margin:0 0 14px;\">Try a different city and business type. Salons, dentists, gyms, restaurants, trades, and local clinics often have visible gaps that can become practical service offers.</p>",
      text: "Try a different city and business type. Salons, dentists, gyms, restaurants, trades, and local clinics often have visible gaps that can become practical service offers.",
    },
    3: {
      subject: "Unlock the full audit when a prospect looks strong",
      title: "Unlock the full audit when a prospect looks strong",
      body: "<p style=\"font-size:16px;line-height:24px;margin:0 0 14px;\">When a preview looks useful, unlock the full audit to get lead details, specific issues, a fix checklist, and a ready-to-edit outreach message.</p>",
      text: "When a preview looks useful, unlock the full audit to get lead details, specific issues, a fix checklist, and a ready-to-edit outreach message.",
    },
    4: {
      subject: "Starter gives you 50 lead opportunities per month",
      title: "Starter gives you 50 lead opportunities per month",
      body: "<p style=\"font-size:16px;line-height:24px;margin:0 0 14px;\">If you prospect every week, Starter gives you a steady source of local opportunities without manually checking business websites one by one.</p>",
      text: "If you prospect every week, Starter gives you a steady source of local opportunities without manually checking business websites one by one.",
    },
  } as const;

  const message = messages[step];
  return sendTransactionalEmail({
    to: email,
    subject: message.subject,
    htmlContent: wrap(message.title, message.body),
    textContent: plain(message.title, message.text),
  });
}
