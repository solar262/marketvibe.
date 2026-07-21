import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildNerveCenterEnvelope,
  nerveCenterRetryDelayMs,
  responseRequiresDeadLetter,
  signNerveCenterPayload,
} from "../src/lib/nerve-center-outbox";

const row = {
  id: "7dc92adb-f9b7-4737-94d4-507764a1c201",
  event_key: "opportunity.qualified:3b4d5ca0-d99d-450b-b19a-81e39e9463a2",
  topic: "opportunity.qualified" as const,
  schema_version: 1,
  payload: { opportunity_id: "3b4d5ca0-d99d-450b-b19a-81e39e9463a2", overall_score: 91 },
  attempt_count: 1,
  max_attempts: 8,
  occurred_at: "2026-07-16T12:00:00.000Z",
};

assert.deepEqual(buildNerveCenterEnvelope(row), {
  event_id: row.event_key,
  topic: "opportunity.qualified",
  occurred_at: row.occurred_at,
  schema_version: 1,
  data: row.payload,
});

assert.equal(
  signNerveCenterPayload("{\"ok\":true}", "1784203200000", "shared-test-secret"),
  "cd29202a3694aa9b82d0ce2d54a2a26674ae932d0d274fb430fd570a2b3d3d0f",
);
assert.notEqual(
  signNerveCenterPayload("{\"ok\":true}", "1784203200000", "shared-test-secret"),
  signNerveCenterPayload("{\"ok\":false}", "1784203200000", "shared-test-secret"),
);
assert.match(signNerveCenterPayload("{}", "1784203200000", "secret"), /^[0-9a-f]{64}$/);

assert.equal(nerveCenterRetryDelayMs(1), 30_000);
assert.equal(nerveCenterRetryDelayMs(2), 60_000);
assert.equal(nerveCenterRetryDelayMs(99), 6 * 60 * 60_000);
assert.equal(responseRequiresDeadLetter(400), true);
assert.equal(responseRequiresDeadLetter(401), true);
assert.equal(responseRequiresDeadLetter(409), false);
assert.equal(responseRequiresDeadLetter(429), false);
assert.equal(responseRequiresDeadLetter(500), false);

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "0014_business_nerve_center_outbox.sql"),
  "utf8",
);
assert.match(migration, /create table if not exists public\.marketvibe_operations_outbox/i);
assert.match(migration, /for update skip locked/i);
assert.match(migration, /on conflict \(event_key\) do nothing/i);
assert.match(migration, /marketvibe_outbox_opportunity_trigger/);
assert.match(migration, /marketvibe_outbox_import_trigger/);
assert.match(migration, /marketvibe_outbox_delivery_trigger/);
assert.match(migration, /marketvibe_outbox_job_failure_trigger/);
assert.match(migration, /exception when others then/i, "Source triggers must fail open instead of blocking customer flows.");
assert.doesNotMatch(migration, /stripe/i, "The operations feed must not touch Stripe tables or functions.");

const revenueMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "0015_revenue_evidence.sql"),
  "utf8",
);
assert.match(revenueMigration, /revenue\.recorded/);
assert.match(revenueMigration, /marketvibe_outbox_revenue_trigger/);
assert.match(revenueMigration, /premium_orders/);
assert.match(revenueMigration, /amount_minor/);

const integrationSource = readFileSync(join(process.cwd(), "src", "lib", "operations-integrations.ts"), "utf8");
assert.match(integrationSource, /runNerveCenterOutbox/);
assert.match(integrationSource, /nerve_center: nerveCenter/);

console.log("MarketVibe owner-control-plane outbox tests passed.");
