export type SendGridAttachment = {
  content: string;
  filename: string;
  type?: string;
  disposition?: "attachment" | "inline";
};

export type SendGridEmailInput = {
  to: string | string[];
  subject?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  textContent?: string;
  htmlContent?: string;
  attachments?: SendGridAttachment[];
};

export type SendGridEmailResult =
  | { ok: true; skipped: false; messageId: string }
  | { ok: false; skipped: boolean; error: string };

const SENDGRID_TIMEOUT_MS = 15000;

function senderConfig() {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.OUTREACH_FROM_EMAIL || "";
  const fromName = process.env.SENDGRID_FROM_NAME || process.env.OUTREACH_FROM_NAME || "MarketVibe";
  const replyTo = process.env.SENDGRID_REPLY_TO || process.env.OUTREACH_REPLY_TO || fromEmail;
  return { fromEmail, fromName, replyTo };
}

function recipients(to: string | string[]) {
  const values = Array.isArray(to) ? to : [to];
  return values
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    .map((email) => ({ email }));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = SENDGRID_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function sendSendGridEmail(input: SendGridEmailInput): Promise<SendGridEmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY || "";
  const { fromEmail, fromName, replyTo } = senderConfig();
  const to = recipients(input.to);

  if (!apiKey) return { ok: false, skipped: true, error: "SENDGRID_API_KEY is not configured." };
  if (!fromEmail) return { ok: false, skipped: true, error: "SENDGRID_FROM_EMAIL or OUTREACH_FROM_EMAIL is not configured." };
  if (to.length === 0) return { ok: false, skipped: true, error: "No valid SendGrid recipient email was supplied." };

  const personalization: Record<string, unknown> = { to };
  if (input.dynamicTemplateData) personalization.dynamic_template_data = input.dynamicTemplateData;

  const body: Record<string, unknown> = {
    personalizations: [personalization],
    from: { email: fromEmail, name: fromName },
  };
  if (replyTo) body.reply_to = { email: replyTo };

  if (input.templateId) {
    body.template_id = input.templateId;
  } else {
    if (!input.subject || !input.textContent) {
      return { ok: false, skipped: true, error: "A SendGrid template ID or subject/text content is required." };
    }
    body.subject = input.subject;
    body.content = [
      { type: "text/plain", value: input.textContent },
      ...(input.htmlContent ? [{ type: "text/html", value: input.htmlContent }] : []),
    ];
  }

  if (input.attachments?.length) {
    body.attachments = input.attachments.map((attachment) => ({
      content: attachment.content,
      filename: attachment.filename,
      type: attachment.type || "application/octet-stream",
      disposition: attachment.disposition || "attachment",
    }));
  }

  const response = await fetchWithTimeout("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { ok: false, skipped: false, error: errorText || `SendGrid error ${response.status}` };
  }

  return { ok: true, skipped: false, messageId: response.headers.get("x-message-id") || "" };
}
