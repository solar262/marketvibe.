import sendgrid from '@sendgrid/mail';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type MailAttachment = {
  filename: string;
  content: string;
  type: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
};

export async function sendEmail(message: MailMessage) {
  if (isMockSendgrid()) {
    appendOutbox(message);
    return { mocked: true };
  }

  if (!process.env.SENDGRID_KEY) {
    throw new Error('SENDGRID_KEY is required for live e-mail delivery.');
  }

  sendgrid.setApiKey(process.env.SENDGRID_KEY);
  await sendgrid.send({
    to: message.to,
    from: process.env.SENDGRID_FROM || 'proof@marketvibe.local',
    subject: message.subject,
    html: message.html,
    attachments: message.attachments,
  });

  return { mocked: false };
}

export function readOutbox() {
  const file = outboxPath();
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as MailMessage[];
  } catch {
    return [];
  }
}

export function clearOutbox() {
  const file = outboxPath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, '[]');
}

function appendOutbox(message: MailMessage) {
  const file = outboxPath();
  mkdirSync(path.dirname(file), { recursive: true });
  const existing = readOutbox();
  existing.push({
    ...message,
    attachments: message.attachments?.map((attachment) => ({
      ...attachment,
      content: `[base64:${attachment.content.length}]`,
    })),
  });
  writeFileSync(file, JSON.stringify(existing, null, 2));
}

function outboxPath() {
  return process.env.MAIL_OUTBOX_PATH || path.join(process.cwd(), 'data', 'mail', 'outbox.json');
}

function isMockSendgrid() {
  return process.env.NODE_ENV === 'test' || !process.env.SENDGRID_KEY || process.env.SENDGRID_KEY.startsWith('SG.mock');
}
