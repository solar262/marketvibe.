import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (filename: string) => DatabaseLike };

type DatabaseLike = {
  exec(sql: string): unknown;
  prepare(sql: string): StatementLike;
  close(): void;
};

type StatementLike = {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
};

export type Plan = 'free' | 'radar' | 'growth' | 'partner';

export type Lead = {
  id: number;
  company: string;
  buyer: string;
  source: string;
  location: string;
  niche: string;
  intent: string;
  intent_score: number;
  pain: string;
  angle: string;
  created_at: string;
};

export type SampleRequest = {
  id: number;
  email: string;
  niche: string;
  stripe_session_id: string | null;
  status: 'pending' | 'paid' | 'processed';
  payload_json: string | null;
  processed_at: string | null;
  proofpack_path: string | null;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: number;
  email: string;
  plan: Plan;
  stripe_customer_id: string | null;
  settings_json: string;
  created_at: string;
  updated_at: string;
};

let db: DatabaseLike | null = null;

const seedLeads = [
  {
    external_id: 'MV-1041',
    company: 'Northstar Web Studio',
    buyer: 'Agency founder',
    source: 'LinkedIn founder post',
    location: 'Manchester, UK',
    niche: 'Agencies',
    intent: 'Needs clients now',
    intent_score: 94,
    pain: 'Asked how other small studios are filling the next 60 days after referrals slowed down.',
    angle:
      'Open with a short pipeline teardown: 3 nearby B2B niches, 12 companies showing website refresh signals, and a founder-led outreach script.',
  },
  {
    external_id: 'MV-1042',
    company: 'Beacon Legal Ops',
    buyer: 'Operations consultant',
    source: 'Public community thread',
    location: 'Dublin, IE',
    niche: 'Consultants',
    intent: 'Seeking growth system',
    intent_score: 88,
    pain: 'Asked for non-ad channels to reach funded startups that need process automation.',
    angle:
      'Lead with a niche signal feed: funded startups hiring ops roles, mentioning document chaos, or changing tooling.',
  },
  {
    external_id: 'MV-1043',
    company: 'Atlas Roofing Group',
    buyer: 'Local business owner',
    source: 'Google Business Profile discussion',
    location: 'Austin, US',
    niche: 'Local Services',
    intent: 'Visibility problem',
    intent_score: 82,
    pain: 'Competitors with fewer reviews are showing higher in local search results.',
    angle: 'Start with a 3-point visibility audit: map pack rank, review velocity, and category mismatch.',
  },
  {
    external_id: 'MV-1044',
    company: 'OrbitCRM',
    buyer: 'SaaS founder',
    source: 'Founder forum post',
    location: 'Berlin, DE',
    niche: 'SaaS',
    intent: 'Needs outbound channel',
    intent_score: 91,
    pain: 'Inbound is inconsistent and the team needs qualified sales conversations.',
    angle:
      'Position MarketVibe as a weekly feed of companies changing CRMs, hiring sales ops, or complaining about follow-up gaps.',
  },
  {
    external_id: 'MV-1047',
    company: 'ClearPath Automation',
    buyer: 'AI automation agency',
    source: 'Public agency group',
    location: 'Amsterdam, NL',
    niche: 'Agencies',
    intent: 'Seeking agency clients',
    intent_score: 86,
    pain: 'Asked which industries have urgent demand for AI workflow automation this quarter.',
    angle:
      'Deliver a signal brief around admin-heavy firms hiring operations support or complaining about manual follow-ups.',
  },
];

export function getDb() {
  if (db) return db;

  const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'marketvibe.sqlite');
  if (sqlitePath !== ':memory:') {
    mkdirSync(path.dirname(path.resolve(sqlitePath)), { recursive: true });
  }

  db = new DatabaseSync(sqlitePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  seedLeadVault(db);
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export function migrate(database = getDb()) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS sample_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      niche TEXT NOT NULL,
      stripe_session_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      payload_json TEXT,
      processed_at TEXT,
      proofpack_path TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lead_vault (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE,
      company TEXT NOT NULL,
      buyer TEXT NOT NULL,
      source TEXT NOT NULL,
      location TEXT NOT NULL,
      niche TEXT NOT NULL,
      intent TEXT NOT NULL,
      intent_score INTEGER NOT NULL,
      pain TEXT NOT NULL,
      angle TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      plan TEXT NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT UNIQUE,
      settings_json TEXT NOT NULL DEFAULT '["Agencies"]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function insertPaidSampleRequest(input: {
  email: string;
  niche: string;
  stripeSessionId?: string | null;
  payload?: unknown;
}) {
  const database = getDb();
  database
    .prepare(
      `
      INSERT INTO sample_requests (email, niche, stripe_session_id, status, payload_json, updated_at)
      VALUES (?, ?, ?, 'paid', ?, ?)
      ON CONFLICT(stripe_session_id) DO UPDATE SET
        email = excluded.email,
        niche = excluded.niche,
        status = 'paid',
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `,
    )
    .run(
      input.email,
      input.niche,
      input.stripeSessionId || null,
      input.payload ? JSON.stringify(input.payload) : null,
      new Date().toISOString(),
    );

  return database
    .prepare('SELECT * FROM sample_requests WHERE stripe_session_id IS ? ORDER BY id DESC LIMIT 1')
    .get(input.stripeSessionId || null) as SampleRequest | undefined;
}

export function getPendingPaidSampleRequests() {
  return getDb()
    .prepare(
      `
      SELECT *
      FROM sample_requests
      WHERE status = 'paid' AND processed_at IS NULL
      ORDER BY created_at ASC
    `,
    )
    .all() as SampleRequest[];
}

export function markSampleRequestProcessed(id: number, proofpackPath: string) {
  getDb()
    .prepare(
      `
      UPDATE sample_requests
      SET status = 'processed', processed_at = ?, proofpack_path = ?, updated_at = ?
      WHERE id = ?
    `,
    )
    .run(new Date().toISOString(), proofpackPath, new Date().toISOString(), id);
}

export function getTopLeadsForNiche(niche: string, limit = 30) {
  return getDb()
    .prepare(
      `
      SELECT *
      FROM lead_vault
      WHERE niche = ?
      ORDER BY intent_score DESC, created_at DESC
      LIMIT ?
    `,
    )
    .all(niche, limit) as Lead[];
}

export function getDailyRadarUsers() {
  return getDb()
    .prepare(
      `
      SELECT *
      FROM users
      WHERE plan IN ('radar', 'growth', 'partner')
      ORDER BY created_at ASC
    `,
    )
    .all() as User[];
}

export function getDailyRadarLeads(niches: string[], sinceIso: string, limit = 20) {
  if (!niches.length) return [];
  const placeholders = niches.map(() => '?').join(', ');
  return getDb()
    .prepare(
      `
      SELECT *
      FROM lead_vault
      WHERE intent_score >= 85
        AND created_at >= ?
        AND niche IN (${placeholders})
      ORDER BY intent_score DESC, created_at DESC
      LIMIT ?
    `,
    )
    .all(sinceIso, ...niches, limit) as Lead[];
}

export function upsertUserPlan(input: {
  email?: string | null;
  stripeCustomerId?: string | null;
  plan: Plan;
  settings?: string[];
}) {
  const email = input.email || `${input.stripeCustomerId}@stripe.marketvibe.local`;
  const settingsJson = JSON.stringify(input.settings || ['Agencies']);
  getDb()
    .prepare(
      `
      INSERT INTO users (email, stripe_customer_id, plan, settings_json, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        stripe_customer_id = COALESCE(excluded.stripe_customer_id, users.stripe_customer_id),
        plan = excluded.plan,
        settings_json = COALESCE(excluded.settings_json, users.settings_json),
        updated_at = excluded.updated_at
    `,
    )
    .run(email, input.stripeCustomerId || null, input.plan, settingsJson, new Date().toISOString());

  if (input.stripeCustomerId) {
    getDb()
      .prepare('UPDATE users SET plan = ?, updated_at = ? WHERE stripe_customer_id = ?')
      .run(input.plan, new Date().toISOString(), input.stripeCustomerId);
  }
}

export function getUserByEmail(email: string) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

function seedLeadVault(database: DatabaseLike) {
  const count = database.prepare('SELECT COUNT(*) AS count FROM lead_vault').get() as { count: number };
  if (count.count > 0) return;

  const now = new Date().toISOString();
  const insert = database.prepare(`
    INSERT OR IGNORE INTO lead_vault
      (external_id, company, buyer, source, location, niche, intent, intent_score, pain, angle, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const lead of seedLeads) {
    insert.run(
      lead.external_id,
      lead.company,
      lead.buyer,
      lead.source,
      lead.location,
      lead.niche,
      lead.intent,
      lead.intent_score,
      lead.pain,
      lead.angle,
      now,
    );
  }
}
