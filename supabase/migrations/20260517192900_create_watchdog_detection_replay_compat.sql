begin;

create schema if not exists control;

-- Replay compatibility for 20260517193000.
-- The learning exhaust migration reads control.watchdog_detections before the
-- full Watchdog v2 migration runs. Create the durable v2 detection shape here
-- so clean replay can compile learning without making Watchdog the parent of it.
create table if not exists control.watchdog_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references core.workspaces(id) on delete cascade,
  rule_key text not null,
  rule_name text not null,
  rule_type text not null check (rule_type = any (array[
    'overdue_obligation',
    'missing_proof',
    'weak_proof',
    'revenue_leak_risk',
    'forgotten_work_risk',
    'agentic_claim_risk',
    'authority_boundary_gap',
    'delivery_retry',
    'integrity_degradation'
  ])),
  applies_to text not null default 'workspace' check (applies_to = any (array[
    'global',
    'workspace',
    'connected_system',
    'claim_source',
    'authority_boundary',
    'obligation_code'
  ])),
  obligation_code text,
  connected_system_id uuid references intake.connected_systems(id) on delete cascade,
  claim_source_id uuid references proof_boundary.claim_sources(id) on delete cascade,
  authority_boundary_id uuid references proof_boundary.authority_boundaries(id) on delete cascade,
  severity text not null default 'medium' check (severity = any (array['informational','low','medium','high','critical'])),
  delivery_target text not null default 'internal_ops',
  threshold_minutes integer not null default 0 check (threshold_minutes >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  retry_backoff_minutes integer not null default 30 check (retry_backoff_minutes >= 0),
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, rule_key)
);

create unique index if not exists watchdog_rules_global_rule_key_uidx
on control.watchdog_rules(rule_key)
where workspace_id is null;

create table if not exists control.watchdog_detections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references core.workspaces(id) on delete cascade,
  rule_id uuid references control.watchdog_rules(id) on delete set null,
  obligation_id uuid references core.obligations(id) on delete cascade,
  receipt_id uuid references receipts.receipts(id) on delete set null,
  intake_event_id uuid references intake.ingestion_events(id) on delete set null,
  proof_evaluation_id uuid references proof_boundary.proof_evaluations(id) on delete set null,
  claim_source_id uuid references proof_boundary.claim_sources(id) on delete set null,
  authority_boundary_id uuid references proof_boundary.authority_boundaries(id) on delete set null,
  detection_key text not null,
  detection_type text not null check (detection_type = any (array[
    'overdue_obligation',
    'missing_proof',
    'weak_proof',
    'revenue_leak_risk',
    'forgotten_work_risk',
    'agentic_claim_risk',
    'authority_boundary_gap',
    'delivery_retry',
    'integrity_degradation'
  ])),
  severity text not null default 'medium' check (severity = any (array['informational','low','medium','high','critical'])),
  status text not null default 'open' check (status = any (array['open','emitted','acknowledged','suppressed','resolved'])),
  evidence jsonb not null default '{}'::jsonb,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, detection_key)
);

-- 20260517193000 reads these optional Watchdog v2 emission links before the
-- full Watchdog v2 migration (20260517203000) adds them. Add them here so the
-- learning exhaust view can compile during clean replay without bypassing the
-- later Watchdog v2 migration, which still owns the operational behavior.
alter table control.watchdog_emissions
  add column if not exists workspace_id uuid references core.workspaces(id) on delete cascade,
  add column if not exists watchdog_detection_id uuid references control.watchdog_detections(id) on delete set null,
  add column if not exists rule_id uuid references control.watchdog_rules(id) on delete set null,
  add column if not exists severity text not null default 'medium',
  add column if not exists emission_key text,
  add column if not exists emitted_at timestamptz,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists resolved_at timestamptz;

comment on table control.watchdog_detections is 'Durable Watchdog v2 risk detections. Created before learning exhaust so clean replay can compile optional Watchdog signal reads.';

commit;
