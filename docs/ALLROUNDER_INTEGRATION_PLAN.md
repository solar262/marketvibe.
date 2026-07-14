# AllRounder integration plan

## Objective

Add a real, admin-only, mobile-friendly command layer inside the existing MarketVibe application. It must execute existing MarketVibe operations and return verified results. It must never fabricate completed work.

## Existing foundations to reuse

- Admin session authentication.
- Supabase-backed buyer and opportunity pipelines.
- The existing self-healing autopilot route.
- Brevo delivery email workflows.
- Vercel cron scheduling.
- Existing opportunity verification, matching, replacement, and delivery functions.

## First production-safe slice

Create `/admin/allrounder` and an authenticated `/api/admin/allrounder` endpoint supporting:

1. Live health/status summary.
2. Run complete MarketVibe autopilot.
3. Run buyer-pipeline recovery.
4. Discover and verify opportunities.
5. Replace stale opportunities.
6. Publish due deliveries and retry pending delivery emails.

## Safety rules

- No paid AI API.
- No new external provider.
- No browser scraping or mass outreach.
- No production merge until build and tests pass.
- Unsupported commands must be rejected clearly rather than answered with invented plans.
- Sending or publishing actions must state exactly what was executed and return underlying results.

## Later phases

After the MarketVibe connector is proven end to end, add separate authenticated adapters for HairHub and HomeSafeMart. Do not mix those businesses into MarketVibe's database or operational logic.
