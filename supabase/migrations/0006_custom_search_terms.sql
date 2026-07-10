alter table if exists public.search_runs
  add column if not exists custom_search_term text,
  add column if not exists search_mode text not null default 'preset';

alter table if exists public.leads
  add column if not exists custom_search_term text,
  add column if not exists search_mode text not null default 'preset';

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'search_runs_search_mode_check'
      and n.nspname = 'public'
      and t.relname = 'search_runs'
  ) then
    alter table public.search_runs
      add constraint search_runs_search_mode_check
      check (search_mode in ('preset', 'custom'));
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'leads_search_mode_check'
      and n.nspname = 'public'
      and t.relname = 'leads'
  ) then
    alter table public.leads
      add constraint leads_search_mode_check
      check (search_mode in ('preset', 'custom'));
  end if;
end $$;

create index if not exists search_runs_search_mode_idx
  on public.search_runs(search_mode);

create index if not exists leads_search_mode_idx
  on public.leads(search_mode);
