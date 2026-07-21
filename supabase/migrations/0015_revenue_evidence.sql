-- Persist successful Stripe revenue as a signed Mission Control outbox event.
-- The trigger is fail-open so payment and customer fulfilment never depend on
-- the availability of the external control plane.
alter table public.marketvibe_operations_outbox
  drop constraint if exists marketvibe_operations_outbox_topic_check;

alter table public.marketvibe_operations_outbox
  add constraint marketvibe_operations_outbox_topic_check check (topic in (
    'opportunity.qualified',
    'navigator.import.completed',
    'navigator.import.failed',
    'import.completed',
    'import.failed',
    'delivery.completed',
    'delivery.failed',
    'revenue.recorded',
    'automation.failed'
  ));

create or replace function public.marketvibe_outbox_revenue_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'completed'
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    begin
      perform public.enqueue_marketvibe_operations_event(
        'revenue.recorded:' || new.stripe_session_id,
        'revenue.recorded',
        jsonb_build_object(
          'order_id', new.id,
          'order_number', new.order_number,
          'stripe_session_id', new.stripe_session_id,
          'product_code', new.product_code,
          'requested_product', new.requested_product,
          'amount_minor', new.amount_total,
          'amount', round(new.amount_total::numeric / 100, 2),
          'currency', upper(new.currency),
          'mode', new.mode,
          'status', new.status
        ),
        coalesce(new.updated_at, new.created_at, now())
      );
    exception when others then
      begin
        insert into public.marketvibe_audit_events (
          event_type, actor_type, related_record_type, related_record_id,
          destination_state, reason, event_payload
        ) values (
          'nerve_center_outbox_enqueue_failed', 'system', 'premium_order', new.id,
          'telemetry_skipped', left(sqlerrm, 2000),
          jsonb_build_object('topic', 'revenue.recorded', 'stripe_session_id', new.stripe_session_id)
        );
      exception when others then null;
      end;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists marketvibe_outbox_revenue on public.premium_orders;
create trigger marketvibe_outbox_revenue
after insert or update of status on public.premium_orders
for each row execute function public.marketvibe_outbox_revenue_trigger();
