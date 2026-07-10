import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server.ts';
import { closeDb, getDb, insertPaidSampleRequest, upsertUserPlan } from '../backend/db.ts';
import { clearOutbox, readOutbox } from '../backend/mailer.ts';
import { runBuildProofPacks } from '../crons/build-proof-packs.ts';
import { runDailyRadar } from '../crons/daily-radar.ts';

let tempDir = '';

beforeEach(() => {
  tempDir = mkdtempSync(path.join(os.tmpdir(), 'marketvibe-'));
  process.env.NODE_ENV = 'test';
  process.env.SQLITE_PATH = path.join(tempDir, 'test.sqlite');
  process.env.PUBLIC_DIR = path.join(tempDir, 'public');
  process.env.PUBLIC_URL = 'http://127.0.0.1:5175';
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.SENDGRID_KEY = 'SG.mock';
  process.env.MAIL_OUTBOX_PATH = path.join(tempDir, 'mail', 'outbox.json');
  closeDb();
  clearOutbox();
  getDb();
});

afterEach(() => {
  closeDb();
  rmSync(tempDir, { recursive: true, force: true });
});

describe('MarketVibe go-live flow', () => {
  it('user can buy a proof pack and receive a checkout session URL', async () => {
    const app = createApp({ serveStatic: false });

    const response = await request(app)
      .post('/api/checkout')
      .send({ niche: 'Agencies', email: 'buyer@example.com' })
      .expect(200);

    expect(response.body.url).toContain('/thank-you?session_id=mock_proof_');
  });

  it('webhook inserts paid proof pack request', async () => {
    const app = createApp({ serveStatic: false });

    await request(app)
      .post('/api/stripe-webhook')
      .set('content-type', 'application/json')
      .send({
        id: 'evt_paid',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_paid',
            customer_email: 'paid@example.com',
            metadata: { niche: 'Agencies' },
          },
        },
      })
      .expect(200);

    const row = getDb()
      .prepare('SELECT * FROM sample_requests WHERE stripe_session_id = ?')
      .get('cs_test_paid') as { email: string; niche: string; status: string };

    expect(row).toMatchObject({
      email: 'paid@example.com',
      niche: 'Agencies',
      status: 'paid',
    });
  });

  it('cron builds proof pack PDF, sends email, and marks processed', async () => {
    insertPaidSampleRequest({
      email: 'proof@example.com',
      niche: 'Agencies',
      stripeSessionId: 'cs_test_cron',
      payload: { id: 'cs_test_cron' },
    });

    const processed = await runBuildProofPacks(new Date('2026-07-10T07:00:00.000Z'));
    expect(processed).toHaveLength(1);
    expect(existsSync(processed[0].pdfPath)).toBe(true);
    expect(existsSync(processed[0].csvPath)).toBe(true);

    const row = getDb()
      .prepare('SELECT status, processed_at, proofpack_path FROM sample_requests WHERE stripe_session_id = ?')
      .get('cs_test_cron') as { status: string; processed_at: string | null; proofpack_path: string | null };

    expect(row.status).toBe('processed');
    expect(row.processed_at).toBeTruthy();
    expect(row.proofpack_path).toContain('/proofpacks/20260710_agencies_');

    const outbox = readOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe('proof@example.com');
    expect(outbox[0].attachments?.map((item) => item.filename).join(' ')).toContain('.pdf');
  });

  it('daily Radar cron sends high-intent feed email', async () => {
    upsertUserPlan({
      email: 'radar@example.com',
      plan: 'radar',
      settings: ['Agencies'],
    });

    const sent = await runDailyRadar(new Date(Date.now() + 1000));
    expect(sent).toEqual([{ email: 'radar@example.com', leadCount: 2 }]);

    const outbox = readOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe('radar@example.com');
    expect(outbox[0].subject).toContain('MarketVibe Daily Radar');
  });
});
