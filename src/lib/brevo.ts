type BrevoAttributes = Record<string, string | number | boolean | null | undefined>;

type TransactionalEmailInput = {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
};

function brevoConfig() {
  return {
    apiKey: process.env.BREVO_API_KEY || "",
    senderEmail: process.env.BREVO_SENDER_EMAIL || process.env.OUTREACH_FROM_EMAIL || "",
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

export async function sendTransactionalEmail({ to, subject, htmlContent, textContent }: TransactionalEmailInput) {
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
    }),
  });
}
