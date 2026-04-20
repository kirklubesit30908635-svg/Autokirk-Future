create schema if not exists control;

create or replace view public.overdue_failure_emission_candidates as
select
  obligation_id,
  obligation_code,
  workspace_id,
  obligation_created_at,
  source_event_id,
  source_system,
  source_event_key,
  source_event_type,
  source_event_created_at,
  receipt_id,
  resolution_type,
  proof_status,
  receipt_emitted_at,
  truth_burden,
  due_at,
  lifecycle_state
from projection.obligation_lifecycle
where lifecycle_state = 'failed'
  and receipt_id is null;

create table if not exists control.watchdog_emissions (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null,
  delivery_target text not null,
  delivery_status text not null default 'pending',
  created_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  last_attempt_at timestamptz null,
  next_retry_at timestamptz null,
  max_attempts integer not null default 5
);

create index if not exists watchdog_emissions_obligation_id_idx
  on control.watchdog_emissions (obligation_id);