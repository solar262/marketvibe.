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
export const proofPackUrl = `${marketVibeUrl}/sample`;
export const dashboardUrl = `${marketVibeUrl}/dashboard`;
export const pricingUrl = `${marketVibeUrl}/pricing`;
export const engineUrl = pricingUrl;
export const leadSearchUrl = pricingUrl;

function brevoConfig() {
  return {
    apiKey: process.env.BREVO_API_KEY || "",
    resendApiKey: process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || "",
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
    configured: Boolean((config.apiKey || config.resendApiKey) && config.senderEmail),
    hasApiKey: Boolean(config.apiKey),
    hasResendApiKey: Boolean(config.resendApiKey),
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
  if (!config.apiKey && config.resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: `${config.senderName} <${config.senderEmail}>`,
        to: [to.trim().toLowerCase()],
        subject,
        html: htmlContent,
        text: textContent,
        ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || `Resend API error ${response.status}`);
    return { messageId: String(data?.id || "") };
  }

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
      subject: "Validate buyer-intent quality with a Proof Pack",
      htmlContent: `<p>${greeting}</p><p>A focused Proof Pack helps you review real buyer-intent context before committing to recurring Radar delivery.</p><p><a href="${proofPackUrl}">Get a Proof Pack</a></p><p><a href="${pricingUrl}">Compare plans</a></p>`,
      textContent: `${greeting}\n\nA focused Proof Pack helps you review real buyer-intent context before committing to recurring Radar delivery.\n\nGet a Proof Pack:\n${proofPackUrl}\n\nCompare plans:\n${pricingUrl}`,
    },
    {
      delayDays: 3,
      subject: "How MarketVibe turns public pain into opportunity",
      htmlContent: `<p>${greeting}</p><p>MarketVibe scores urgency, relevance, source quality, and pain clarity so outreach starts from context rather than guesswork.</p><p><a href="${pricingUrl}">Compare premium plans</a></p>`,
      textContent: `${greeting}\n\nMarketVibe scores urgency, relevance, source quality, and pain clarity so outreach starts from context rather than guesswork.\n\nCompare premium plans:\n${pricingUrl}`,
    },
    {
      delayDays: 5,
      subject: "Proof Pack first, Radar when the signal fits",
      htmlContent: `<p>${greeting}</p><p>Start with a one-off Proof Pack. If the signals fit your market, Radar gives you recurring buyer-intent delivery.</p><p><a href="${proofPackUrl}">Start with Proof Pack</a></p><p><a href="${pricingUrl}">Compare Radar and Growth Desk</a></p>`,
      textContent: `${greeting}\n\nStart with a one-off Proof Pack. If the signals fit your market, Radar gives you recurring buyer-intent delivery.\n\nStart with Proof Pack:\n${proofPackUrl}\n\nCompare Radar and Growth Desk:\n${pricingUrl}`,
    },
    {
      delayDays: 7,
      subject: "Choose the right MarketVibe product",
      htmlContent: `<p>${greeting}</p><p>Proof Pack is a one-off validation purchase, Radar is recurring dashboard access, and Growth Desk is managed delivery for focused niches and territories.</p><p><a href="${pricingUrl}">View pricing</a></p>`,
      textContent: `${greeting}\n\nProof Pack is a one-off validation purchase, Radar is recurring dashboard access, and Growth Desk is managed delivery for focused niches and territories.\n\nView pricing:\n${pricingUrl}`,
    },
  ]);
}

export async function scheduleBuyerSequence(to: string, firstName = "") {
  const greeting = `Hi${firstName ? ` ${firstName}` : ""},`;
  return scheduleSequence(to, [
    {
      delayDays: 2,
      subject: "Get more value from your MarketVibe access",
      htmlContent: `<p>${greeting}</p><p>Use your access to compare buyer-intent signals before choosing where to spend outreach time. Stronger source context usually makes for clearer first messages.</p><p><a href="${dashboardUrl}">Open your dashboard</a></p><p><a href="${pricingUrl}">Review premium options</a></p>`,
      textContent: `${greeting}\n\nUse your access to compare buyer-intent signals before choosing where to spend outreach time. Stronger source context usually makes for clearer first messages.\n\nOpen your dashboard:\n${dashboardUrl}\n\nReview premium options:\n${pricingUrl}`,
    },
    {
      delayDays: 6,
      subject: "Your next MarketVibe opportunity is waiting",
      htmlContent: `<p>${greeting}</p><p>Your next opportunity can come from a different niche, territory, or buyer pain. Keep the workflow focused and use source-backed context to prioritize.</p><p><a href="${dashboardUrl}">Open your dashboard</a></p><p><a href="${pricingUrl}">See MarketVibe pricing</a></p>`,
      textContent: `${greeting}\n\nYour next opportunity can come from a different niche, territory, or buyer pain. Keep the workflow focused and use source-backed context to prioritize.\n\nOpen your dashboard:\n${dashboardUrl}\n\nSee MarketVibe pricing:\n${pricingUrl}`,
    },
  ]);
}
