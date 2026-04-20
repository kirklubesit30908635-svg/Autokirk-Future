create schema if not exists control;

create table if not exists control.watchdog_emissions (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null,
  emitted_at timestamptz not null default now(),
  delivery_target text not null default 'internal-watchdog',
  delivery_status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (obligation_id)
);

create or replace view public.overdue_failure_emission_candidates as
select
  w.obligation_id,
  w.obligation_code,
  w.workspace_id,
  w.obligation_created_at,
  w.source_event_id,
  w.source_system,
  w.source_event_key,
  w.source_event_type,
  w.source_event_created_at,
  w.receipt_id,
  w.resolution_type,
  w.proof_status,
  w.receipt_emitted_at,
  w.truth_burden,
  w.due_at,
  w.lifecycle_state
from public.overdue_failure_watchdog w
left join control.watchdog_emissions e
  on e.obligation_id = w.obligation_id
where e.obligation_id is null;
