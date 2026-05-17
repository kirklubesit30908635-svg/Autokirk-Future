begin;

create schema if not exists learning;

comment on schema learning is 'Governed learning schema for AutoKirk-Future active-system exhaust.';

create table if not exists learning.signal_observations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references core.workspaces(id) on delete cascade,
  obligation_id uuid references core.obligations(id) on delete set null,
  receipt_id uuid references receipts.receipts(id) on delete set null,
  ledger_event_id uuid references ledger.events(id) on delete set null,
  intake_event_id uuid references intake.ingestion_events(id) on delete set null,
  proof_evaluation_id uuid references proof_boundary.proof_evaluations(id) on delete set null,
  claim_source_id uuid references proof_boundary.claim_sources(id) on delete set null,
  authority_boundary_id uuid references proof_boundary.authority_boundaries(id) on delete set null,
  observation_type text not null check (observation_type = any (array[
    'intake_signal',
    'obligation_opened',
    'obligation_resolved',
    'proof_approved',
    'proof_denied',
    'proof_conditional',
    'receipt_emitted',
    'ledger_event',
    'watchdog_emission',
    'integrity_event',
    'revenue_leak_risk',
    'forgotten_work_risk',
    'agentic_claim',
    'authority_boundary_signal'
  ])),
  signal_key text not null,
  source_schema text not null,
  source_table text not null,
  source_id uuid,
  signal_strength numeric not null default 1 check (signal_strength >= 0),
  confidence numeric not null default 1 check (confidence >= 0 and confidence <= 1),
  payload jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (workspace_id, signal_key)
);

comment on table learning.signal_observations is 'Append-only normalized learning observations derived from governed AutoKirk-Future exhaust.';
comment on column learning.signal_observations.signal_key is 'Stable idempotency key for a learning observation, usually derived from source table and source id.';
comment on column learning.signal_observations.observation_type is 'Current-system learning signal type. Must come from governed intake, obligation, proof, receipt, ledger, watchdog, or governance outcome.';

create index if not exists signal_observations_workspace_detected_idx on learning.signal_observations(workspace_id, detected_at desc);
create index if not exists signal_observations_obligation_idx on learning.signal_observations(obligation_id) where obligation_id is not null;
create index if not exists signal_observations_receipt_idx on learning.signal_observations(receipt_id) where receipt_id is not null;
create index if not exists signal_observations_type_idx on learning.signal_observations(observation_type, detected_at desc);

create table if not exists learning.daily_workspace_rollups (
  workspace_id uuid not null references core.workspaces(id) on delete cascade,
  rollup_date date not null,
  intake_signal_count bigint not null default 0 check (intake_signal_count >= 0),
  obligations_opened_count bigint not null default 0 check (obligations_opened_count >= 0),
  obligations_resolved_count bigint not null default 0 check (obligations_resolved_count >= 0),
  obligations_failed_count bigint not null default 0 check (obligations_failed_count >= 0),
  proof_approved_count bigint not null default 0 check (proof_approved_count >= 0),
  proof_denied_count bigint not null default 0 check (proof_denied_count >= 0),
  proof_conditional_count bigint not null default 0 check (proof_conditional_count >= 0),
  receipts_emitted_count bigint not null default 0 check (receipts_emitted_count >= 0),
  watchdog_emission_count bigint not null default 0 check (watchdog_emission_count >= 0),
  agentic_claim_count bigint not null default 0 check (agentic_claim_count >= 0),
  forgotten_work_risk_count bigint not null default 0 check (forgotten_work_risk_count >= 0),
  revenue_leak_risk_count bigint not null default 0 check (revenue_leak_risk_count >= 0),
  metrics jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  primary key (workspace_id, rollup_date)
);

comment on table learning.daily_workspace_rollups is 'Daily workspace-level learning rollups from active AutoKirk-Future exhaust.';

create table if not exists learning.pattern_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references core.workspaces(id) on delete cascade,
  pattern_key text not null,
  pattern_type text not null check (pattern_type = any (array[
    'forgotten_work',
    'revenue_leakage',
    'weak_proof',
    'late_completion',
    'agent_reliability',
    'authority_boundary_gap',
    'source_quality',
    'repeat_failure',
    'receipt_quality',
    'operational_drift'
  ])),
  severity text not null default 'informational' check (severity = any (array['informational','low','medium','high','critical'])),
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  recommended_action jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status = any (array['active','acknowledged','dismissed','resolved'])),
  created_at timestamptz not null default now(),
  unique (workspace_id, pattern_key)
);

comment on table learning.pattern_findings is 'Non-mutating learned patterns. These findings may recommend actions but do not directly mutate kernel truth.';

create index if not exists pattern_findings_workspace_status_idx on learning.pattern_findings(workspace_id, status, severity);
create index if not exists pattern_findings_type_idx on learning.pattern_findings(pattern_type, last_seen_at desc);

create table if not exists learning.recommendations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references core.workspaces(id) on delete cascade,
  pattern_finding_id uuid references learning.pattern_findings(id) on delete set null,
  recommendation_key text not null,
  recommendation_type text not null check (recommendation_type = any (array[
    'create_proof_rule',
    'tighten_authority_boundary',
    'add_watchdog_route',
    'review_revenue_leak',
    'require_human_approval',
    'adjust_connected_system',
    'investigate_source',
    'improve_receipt_rationale',
    'create_client_intake_rule'
  ])),
  priority text not null default 'normal' check (priority = any (array['low','normal','high','urgent'])),
  recommendation jsonb not null default '{}'::jsonb,
  basis jsonb not null default '{}'::jsonb,
  status text not null default 'proposed' check (status = any (array['proposed','accepted','rejected','implemented','superseded'])),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid,
  unique (workspace_id, recommendation_key)
);

comment on table learning.recommendations is 'Founder/operator-facing recommendations generated from learning findings. Recommendations are proposals, not autonomous kernel mutations.';

create index if not exists recommendations_workspace_status_idx on learning.recommendations(workspace_id, status, priority);

alter table learning.signal_observations enable row level security;
alter table learning.daily_workspace_rollups enable row level security;
alter table learning.pattern_findings enable row level security;
alter table learning.recommendations enable row level security;

grant usage on schema learning to authenticated, service_role;
grant select on learning.signal_observations, learning.daily_workspace_rollups, learning.pattern_findings, learning.recommendations to authenticated;
grant all on learning.signal_observations, learning.daily_workspace_rollups, learning.pattern_findings, learning.recommendations to service_role;

commit;
