create extension if not exists pgcrypto;

-- A small, server-only transactional outbox for the owner control plane.
-- Source triggers are deliberately fail-open: telemetry must never block an
-- import, qualification, delivery, or other customer-facing transaction.
create table if not exists public.marketvibe_operations_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique check (length(trim(event_key)) between 1 and 300),
  topic text not null check (topic in (
    'opportunity.qualified',
    'navigator.import.completed',
    'navigator.import.failed',
    'import.completed',
    'import.failed',
    'delivery.completed',
    'delivery.failed',
    'automation.failed'
  )),
  schema_version integer not null default 1 check (schema_version = 1),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status text not null default 'queued' check (status in (
    'queued', 'sending', 'retry_scheduled', 'delivered', 'dead_letter'
  )),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 8 check (max_attempts between 1 and 20),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  delivered_at timestamptz,
  response_status integer,
  last_error text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketvibe_operations_outbox_due_idx
  on public.marketvibe_operations_outbox(status, next_attempt_at, created_at)
  where status in ('queued', 'retry_scheduled', 'sending');

alter table public.marketvibe_operations_outbox enable row level security;

create or replace function public.enqueue_marketvibe_operations_event(
  p_event_key text,
  p_topic text,
  p_payload jsonb,
  p_occurred_at timestamptz default now()
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.marketvibe_operations_outbox (
    event_key, topic, payload, occurred_at
  ) values (
    left(trim(p_event_key), 300),
    p_topic,
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_occurred_at, now())
  )
  on conflict (event_key) do nothing;
end;
$$;

revoke all on function public.enqueue_marketvibe_operations_event(text, text, jsonb, timestamptz) from public;

create or replace function public.claim_marketvibe_operations_outbox(
  p_worker_id text,
  p_limit integer default 25,
  p_lease_seconds integer default 300
) returns setof public.marketvibe_operations_outbox
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if length(trim(coalesce(p_worker_id, ''))) = 0 then
    raise exception 'worker id is required';
  end if;

  return query
  with due as (
    select item.id
    from public.marketvibe_operations_outbox item
    where item.attempt_count < item.max_attempts
      and (
        (item.status in ('queued', 'retry_scheduled') and item.next_attempt_at <= now())
        or (
          item.status = 'sending'
          and item.locked_at < now() - make_interval(secs => greatest(30, p_lease_seconds))
        )
      )
    order by item.next_attempt_at, item.created_at
    for update skip locked
    limit least(greatest(coalesce(p_limit, 25), 1), 100)
  )
  update public.marketvibe_operations_outbox item
     set status = 'sending',
         attempt_count = item.attempt_count + 1,
         locked_at = now(),
         locked_by = trim(p_worker_id),
         updated_at = now()
    from due
   where item.id = due.id
  returning item.*;
end;
$$;

revoke all on function public.claim_marketvibe_operations_outbox(text, integer, integer) from public;
grant execute on function public.claim_marketvibe_operations_outbox(text, integer, integer) to service_role;

create or replace function public.marketvibe_outbox_opportunity_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  entered_qualified boolean := false;
begin
  if tg_op = 'INSERT' then
    entered_qualified := true;
  elsif tg_op = 'UPDATE' then
    entered_qualified := old.inventory_status not in ('QUALIFIED', 'IN_INVENTORY');
  end if;

  if new.is_test_data is false
     and new.inventory_status in ('QUALIFIED', 'IN_INVENTORY')
     and entered_qualified then
    begin
      perform public.enqueue_marketvibe_operations_event(
        'opportunity.qualified:' || new.id::text,
        'opportunity.qualified',
        jsonb_build_object(
          'opportunity_id', new.id,
          'company_name', left(coalesce(new.company_name, ''), 200),
          'overall_score', new.overall_score,
          'intent_score', new.intent_score,
          'evidence_score', new.evidence_score,
          'source_type', new.source_type,
          'inventory_status', new.inventory_status
        ),
        coalesce(new.updated_at, new.created_at, now())
      );
    exception when others then
      begin
        insert into public.marketvibe_audit_events (
          event_type, actor_type, related_record_type, related_record_id,
          destination_state, reason, event_payload
        ) values (
          'nerve_center_outbox_enqueue_failed', 'system', 'opportunity', new.id,
          'telemetry_skipped', left(sqlerrm, 2000),
          jsonb_build_object('topic', 'opportunity.qualified')
        );
      exception when others then null;
      end;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists marketvibe_outbox_opportunity on public.opportunities;
create trigger marketvibe_outbox_opportunity
after insert or update of inventory_status on public.opportunities
for each row execute function public.marketvibe_outbox_opportunity_trigger();

create or replace function public.marketvibe_outbox_import_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  event_topic text;
begin
  if new.status in ('completed', 'failed')
     and new.status is distinct from old.status then
    event_topic := case
      when new.source_type = 'sales_navigator_csv' then 'navigator.import.' || new.status
      else 'import.' || new.status
    end;
    begin
      perform public.enqueue_marketvibe_operations_event(
        event_topic || ':' || new.id::text,
        event_topic,
        jsonb_build_object(
          'batch_id', new.id,
          'source_type', new.source_type,
          'status', new.status,
          'total_rows', new.total_rows,
          'imported_rows', new.imported_rows,
          'duplicate_rows', new.duplicate_rows,
          'rejected_rows', new.rejected_rows,
          'summary', coalesce(new.import_summary, '{}'::jsonb)
        ),
        coalesce(new.completed_at, now())
      );
    exception when others then
      begin
        insert into public.marketvibe_audit_events (
          event_type, actor_type, related_record_type, related_record_id,
          destination_state, reason, event_payload
        ) values (
          'nerve_center_outbox_enqueue_failed', 'system', 'import_batch', new.id,
          'telemetry_skipped', left(sqlerrm, 2000), jsonb_build_object('topic', event_topic)
        );
      exception when others then null;
      end;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists marketvibe_outbox_import on public.premium_import_batches;
create trigger marketvibe_outbox_import
after update of status on public.premium_import_batches
for each row execute function public.marketvibe_outbox_import_trigger();

create or replace function public.marketvibe_outbox_delivery_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  event_topic text;
begin
  if new.status in ('delivered', 'failed', 'email_failed')
     and new.status is distinct from old.status then
    event_topic := case when new.status = 'delivered' then 'delivery.completed' else 'delivery.failed' end;
    begin
      perform public.enqueue_marketvibe_operations_event(
        event_topic || ':' || new.id::text,
        event_topic,
        jsonb_build_object(
          'delivery_batch_id', new.id,
          'product_code', new.product_code,
          'opportunity_count', new.opportunity_count,
          'status', new.status,
          'email_sent_at', new.email_sent_at
        ),
        coalesce(new.email_sent_at, now())
      );
    exception when others then
      begin
        insert into public.marketvibe_audit_events (
          event_type, actor_type, related_record_type, related_record_id,
          destination_state, reason, event_payload
        ) values (
          'nerve_center_outbox_enqueue_failed', 'system', 'opportunity_delivery_batch', new.id,
          'telemetry_skipped', left(sqlerrm, 2000), jsonb_build_object('topic', event_topic)
        );
      exception when others then null;
      end;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists marketvibe_outbox_delivery on public.opportunity_delivery_batches;
create trigger marketvibe_outbox_delivery
after update of status on public.opportunity_delivery_batches
for each row execute function public.marketvibe_outbox_delivery_trigger();

create or replace function public.marketvibe_outbox_job_failure_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.queue_status = 'permanent_failure'
     and new.queue_status is distinct from old.queue_status then
    begin
      perform public.enqueue_marketvibe_operations_event(
        'automation.job.failed:' || new.id::text,
        'automation.failed',
        jsonb_build_object(
          'component', 'job_queue',
          'job_id', new.id,
          'job_name', new.job_name,
          'related_record_type', new.related_record_type,
          'attempt_count', new.retry_count,
          'failure', left(coalesce(new.last_error, 'permanent failure'), 1000)
        ),
        coalesce(new.updated_at, now())
      );
    exception when others then null;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists marketvibe_outbox_job_failure on public.marketvibe_job_queue;
create trigger marketvibe_outbox_job_failure
after update of queue_status on public.marketvibe_job_queue
for each row execute function public.marketvibe_outbox_job_failure_trigger();

create or replace function public.marketvibe_outbox_run_failure_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status in ('failed', 'partial')
     and new.status is distinct from old.status then
    begin
      perform public.enqueue_marketvibe_operations_event(
        'automation.run.failed:' || new.id::text,
        'automation.failed',
        jsonb_build_object(
          'component', 'source_run',
          'run_id', new.id,
          'run_type', new.run_type,
          'status', new.status,
          'records_failed', coalesce(new.records_rejected, 0),
          'source_failure_count', jsonb_array_length(coalesce(new.source_failures, '[]'::jsonb))
        ),
        coalesce(new.finished_at, now())
      );
    exception when others then null;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists marketvibe_outbox_run_failure on public.opportunity_source_runs;
create trigger marketvibe_outbox_run_failure
after update of status on public.opportunity_source_runs
for each row execute function public.marketvibe_outbox_run_failure_trigger();

insert into public.marketvibe_provider_configurations (
  provider_identifier, provider_name, provider_type, enabled, credential_state,
  health_status, health_message, settings
) values (
  'business_nerve_center', 'Business Nerve Center', 'content', false, 'not_configured',
  'Blocked', 'Signed operations feed is disabled until its URL and shared secret are configured.',
  jsonb_build_object('purpose', 'owner_control_plane', 'contains_payment_actions', false)
)
on conflict (provider_identifier) do nothing;
