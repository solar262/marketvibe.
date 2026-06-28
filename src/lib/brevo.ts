type BrevoAttributes = Record<string, string | number | boolean | null | undefined>;

type TransactionalEmailInput = {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  scheduledAt?: string;
};

type SequenceEmail = {
  delayDays: number;
  subject: string;
  htmlContent: string;
  textContent: string;
};

export const marketVibeUrl = "https://www.marketvibe1.com";
export const leadSearchUrl = `${marketVibeUrl}/lead-search`;
export const pricingUrl = `${marketVibeUrl}/pricing`;

function brevoConfig() {
  return {
    apiKey: process.env.BREVO_API_KEY || "",
    senderEmail: process.env.BREVO_SENDER_EMAIL || process.env.OUTREACH_FROM_EMAIL || "hello@marketvibe1.com",
    senderName: process.env.BREVO_SENDER_NAME || process.env.OUTREACH_FROM_NAME || "MarketVibe",
    listId: process.env.BREVO_MARKETVIBE_LIST_ID || "",
  };
}

function cleanAttributes(attributes: BrevoAttributes = {}) {
  return Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

async function brevoFetch(path: string, init: RequestInit) {
  const config = brevoConfig();
  if (!config.apiKey) throw new Error("Brevo API key is not configured.");

  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    ...init,
    headers: {
      "api-key": config.apiKey,
      "content-type": "application/json",
      accept: "application/json",
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data?.message || `Brevo API error ${response.status}`);
  return data;
}

export function getBrevoStatus() {
  const config = brevoConfig();
  return {
    configured: Boolean(config.apiKey && config.senderEmail),
    hasApiKey: Boolean(config.apiKey),
    hasSenderEmail: Boolean(config.senderEmail),
    hasSenderName: Boolean(config.senderName),
    hasListId: Boolean(config.listId),
    senderEmail: config.senderEmail,
    senderName: config.senderName,
    listId: config.listId,
  };
}

export async function addOrUpdateContact(email: string, attributes: BrevoAttributes = {}) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
    throw new Error("A valid email address is required.");
  }

  return brevoFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      attributes: cleanAttributes(attributes),
      updateEnabled: true,
    }),
  });
}

export async function addContactToMarketVibeList(email: string, attributes: BrevoAttributes = {}) {
  const config = brevoConfig();
  await addOrUpdateContact(email, attributes);

  if (!config.listId) {
    return { skipped: true, reason: "BREVO_MARKETVIBE_LIST_ID is not configured." };
  }

  return brevoFetch(`/contacts/lists/${config.listId}/contacts/add`, {
    method: "POST",
    body: JSON.stringify({ emails: [email.trim().toLowerCase()] }),
  });
}

export async function sendTransactionalEmail({ to, subject, htmlContent, textContent, scheduledAt }: TransactionalEmailInput) {
  const config = brevoConfig();
  if (!config.senderEmail) throw new Error("Brevo sender email is not configured.");

  return brevoFetch("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { email: config.senderEmail, name: config.senderName },
      to: [{ email: to.trim().toLowerCase() }],
      subject,
      htmlContent,
      textContent,
      ...(scheduledAt ? { scheduledAt } : {}),
    }),
  });
}

function scheduledIso(delayDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + delayDays);
  return date.toISOString();
}

async function scheduleSequence(to: string, sequence: SequenceEmail[]) {
  const brevoTransactionalScheduleLimitDays = 3;
  const scheduled = [];
  const skipped = [];

  for (const email of sequence) {
    if (email.delayDays > brevoTransactionalScheduleLimitDays) {
      skipped.push({ subject: email.subject, reason: "Brevo transactional scheduling limit is 3 days." });
      continue;
    }

    await sendTransactionalEmail({
      to,
      subject: email.subject,
      htmlContent: email.htmlContent,
      textContent: email.textContent,
      scheduledAt: scheduledIso(email.delayDays),
    });
    scheduled.push({ subject: email.subject, delayDays: email.delayDays });
  }

  return { scheduled, skipped };
}

export async function scheduleFreeLeadSequence(to: string, firstName = "") {
  const greeting = `Hi${firstName ? ` ${firstName}` : ""},`;
  return scheduleSequence(to, [
    {
      delayDays: 1,
      subject: "Turn one weak website into a paid client",
      htmlContent: `<p>${greeting}</p><p>Look for one business with a weak website, missing booking route, or unclear call-to-action. A focused audit gives you a practical reason to start a paid conversation.</p><p><a href="${leadSearchUrl}">Run a MarketVibe lead search</a></p><p><a href="${pricingUrl}">View MarketVibe pricing</a></p>`,
      textContent: `${greeting}\n\nLook for one business with a weak website, missing booking route, or unclear call-to-action. A focused audit gives you a practical reason to start a paid conversation.\n\nRun a MarketVibe lead search:\n${leadSearchUrl}\n\nView MarketVibe pricing:\n${pricingUrl}`,
    },
    {
      delayDays: 3,
      subject: "Try a fresh MarketVibe search today",
      htmlContent: `<p>${greeting}</p><p>Try a new city, service type, or business category today. A fresh search can surface businesses with stronger improvement signals.</p><p><a href="${leadSearchUrl}">Find fresh leads</a></p><p><a href="${pricingUrl}">Compare plans</a></p>`,
      textContent: `${greeting}\n\nTry a new city, service type, or business category today. A fresh search can surface businesses with stronger improvement signals.\n\nFind fresh leads:\n${leadSearchUrl}\n\nCompare plans:\n${pricingUrl}`,
    },
    {
      delayDays: 5,
      subject: "Unlock full audit reports when a lead looks strong",
      htmlContent: `<p>${greeting}</p><p>When a lead looks promising, unlock the full audit report for the detailed findings, suggested offer, and pitch-ready next steps.</p><p><a href="${leadSearchUrl}">Review lead opportunities</a></p><p><a href="${pricingUrl}">Unlock audit access</a></p>`,
      textContent: `${greeting}\n\nWhen a lead looks promising, unlock the full audit report for the detailed findings, suggested offer, and pitch-ready next steps.\n\nReview lead opportunities:\n${leadSearchUrl}\n\nUnlock audit access:\n${pricingUrl}`,
    },
    {
      delayDays: 7,
      subject: "Starter gives you 50 lead opportunities per month",
      htmlContent: `<p>${greeting}</p><p>Starter gives you 50 lead opportunities per month so you can build a steady prospecting routine without manual research.</p><p><a href="${leadSearchUrl}">Search leads</a></p><p><a href="${pricingUrl}">Start with Starter</a></p>`,
      textContent: `${greeting}\n\nStarter gives you 50 lead opportunities per month so you can build a steady prospecting routine without manual research.\n\nSearch leads:\n${leadSearchUrl}\n\nStart with Starter:\n${pricingUrl}`,
    },
  ]);
}

export async function scheduleBuyerSequence(to: string, firstName = "") {
  const greeting = `Hi${firstName ? ` ${firstName}` : ""},`;
  return scheduleSequence(to, [
    {
      delayDays: 2,
      subject: "Get more value from your MarketVibe access",
      htmlContent: `<p>${greeting}</p><p>Use your access to compare several leads before choosing where to spend your outreach time. Stronger website and conversion gaps usually make for clearer pitches.</p><p><a href="${leadSearchUrl}">Run another lead search</a></p><p><a href="${pricingUrl}">Review your plan options</a></p>`,
      textContent: `${greeting}\n\nUse your access to compare several leads before choosing where to spend your outreach time. Stronger website and conversion gaps usually make for clearer pitches.\n\nRun another lead search:\n${leadSearchUrl}\n\nReview your plan options:\n${pricingUrl}`,
    },
    {
      delayDays: 6,
      subject: "Your next MarketVibe opportunity is waiting",
      htmlContent: `<p>${greeting}</p><p>Your next opportunity can come from a different city, niche, or service angle. Keep searches focused and use the audits to prioritize the best-fit businesses.</p><p><a href="${leadSearchUrl}">Find your next opportunity</a></p><p><a href="${pricingUrl}">See MarketVibe pricing</a></p>`,
      textContent: `${greeting}\n\nYour next opportunity can come from a different city, niche, or service angle. Keep searches focused and use the audits to prioritize the best-fit businesses.\n\nFind your next opportunity:\n${leadSearchUrl}\n\nSee MarketVibe pricing:\n${pricingUrl}`,
    },
  ]);
}
