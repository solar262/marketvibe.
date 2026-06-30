# Outreach database schema

Adds/repairs `buyer_prospects` and `outreach_queue`.

Email sending remains disabled until provider settings are configured.

Apply migration in Supabase SQL Editor or Supabase CLI, then test:

/api/admin/outreach/queue-from-leads?limit=10
/admin/outreach
