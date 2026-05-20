begin;

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

comment on table control.watchdog_rules is 'Configurable Watchdog v2 detection rules for AutoKirk-Future. Rules detect overdue work, forgotten work, revenue leakage, proof problems, agentic claim risk, authority gaps, delivery retry problems, and integrity degradation without mutating obligation truth.';

create unique index if not exists watchdog_rules_global_rule_key_uidx
on control.watchdog_rules(rule_key)
where workspace_id is null;

create index if not exists watchdog_rules_workspace_enabled_idx on control.watchdog_rules(workspace_id, enabled, rule_type);
create index if not exists watchdog_rules_connected_system_idx on control.watchdog_rules(connected_system_id) where connected_system_id is not null;
create index if not exists watchdog_rules_claim_source_idx on control.watchdog_rules(claim_source_id) where claim_source_id is not null;
create index if not exists watchdog_rules_authority_boundary_idx on control.watchdog_rules(authority_boundary_id) where authority_boundary_id is not null;

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

comment on table control.watchdog_detections is 'Durable Watchdog v2 risk detections. A detection is the durable risk record; emissions are delivery attempts derived from detections.';

create index if not exists watchdog_detections_workspace_status_idx on control.watchdog_detections(workspace_id, status, severity, last_detected_at desc);
create index if not exists watchdog_detections_obligation_idx on control.watchdog_detections(obligation_id) where obligation_id is not null;
create index if not exists watchdog_detections_intake_event_idx on control.watchdog_detections(intake_event_id) where intake_event_id is not null;
create index if not exists watchdog_detections_type_idx on control.watchdog_detections(detection_type, status, last_detected_at desc);
create index if not exists watchdog_detections_claim_source_idx on control.watchdog_detections(claim_source_id) where claim_source_id is not null;

alter table control.watchdog_emissions
  add column if not exists workspace_id uuid references core.workspaces(id) on delete cascade,
  add column if not exists watchdog_detection_id uuid references control.watchdog_detections(id) on delete set null,
  add column if not exists rule_id uuid references control.watchdog_rules(id) on delete set null,
  add column if not exists severity text not null default 'medium',
  add column if not exists emission_key text,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists resolved_at timestamptz;

update control.watchdog_emissions we
set workspace_id = o.workspace_id
from core.obligations o
where we.workspace_id is null
  and we.obligation_id = o.id;

update control.watchdog_emissions we
set workspace_id = d.workspace_id
from control.watchdog_detections d
where we.workspace_id is null
  and we.watchdog_detection_id = d.id;

alter table control.watchdog_emissions alter column obligation_id drop not null;

create or replace function control.set_watchdog_emission_workspace()
returns trigger
language plpgsql
security definer
set search_path = control, core, public
as $$
begin
  if new.workspace_id is null and new.watchdog_detection_id is not null then
    select d.workspace_id into new.workspace_id
    from control.watchdog_detections d
    where d.id = new.watchdog_detection_id;
  end if;

  if new.workspace_id is null and new.obligation_id is not null then
    select o.workspace_id into new.workspace_id
    from core.obligations o
    where o.id = new.obligation_id;
  end if;

  if new.workspace_id is null then
    raise exception 'watchdog emission requires workspace_id, obligation_id, or watchdog_detection_id';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_watchdog_emission_workspace on control.watchdog_emissions;
create trigger trg_set_watchdog_emission_workspace
before insert or update on control.watchdog_emissions
for each row execute function control.set_watchdog_emission_workspace();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'watchdog_emissions_severity_check'
      and conrelid = 'control.watchdog_emissions'::regclass
  ) then
    alter table control.watchdog_emissions
      add constraint watchdog_emissions_severity_check
      check (severity = any (array['informational','low','medium','high','critical']));
  end if;
end $$;

create unique index if not exists watchdog_emissions_detection_target_active_uidx
on control.watchdog_emissions(watchdog_detection_id, delivery_target)
where watchdog_detection_id is not null
  and delivery_status in ('pending','delivered');

create unique index if not exists watchdog_emissions_workspace_target_key_active_uidx
on control.watchdog_emissions(workspace_id, delivery_target, emission_key)
where emission_key is not null
  and delivery_status in ('pending','delivered');

create index if not exists watchdog_emissions_workspace_status_idx on control.watchdog_emissions(workspace_id, delivery_status, severity, created_at desc);
create index if not exists watchdog_emissions_detection_idx on control.watchdog_emissions(watchdog_detection_id) where watchdog_detection_id is not null;
create index if not exists watchdog_emissions_ready_idx on control.watchdog_emissions(delivery_status, next_retry_at, lease_expires_at, severity);

create or replace view control.watchdog_unified_candidates
with (security_invoker = true)
as
select
  o.workspace_id,
  o.id as obligation_id,
  null::uuid as receipt_id,
  null::uuid as intake_event_id,
  null::uuid as proof_evaluation_id,
  occ.claim_source_id,
  occ.authority_boundary_id,
  'overdue_obligation'::text as detection_type,
  case
    when o.due_at < now() - interval '7 days' then 'critical'
    when o.due_at < now() - interval '1 day' then 'high'
    else 'medium'
  end as severity,
  'overdue_obligation:' || o.id::text as detection_key,
  jsonb_build_object(
    'status', o.status,
    'proof_status', o.proof_status,
    'due_at', o.due_at,
    'obligation_code', o.obligation_code,
    'truth_burden', o.truth_burden
  ) as evidence,
  o.due_at as candidate_at
from core.obligations o
left join proof_boundary.obligation_claim_contexts occ on occ.obligation_id = o.id
where o.status = 'open'
  and o.due_at is not null
  and o.due_at < now()

union all

select
  o.workspace_id,
  o.id as obligation_id,
  null::uuid as receipt_id,
  null::uuid as intake_event_id,
  null::uuid as proof_evaluation_id,
  occ.claim_source_id,
  occ.authority_boundary_id,
  'missing_proof'::text as detection_type,
  'high'::text as severity,
  'missing_proof:' || o.id::text as detection_key,
  jsonb_build_object(
    'status', o.status,
    'proof_status', o.proof_status,
    'resolution_type', o.resolution_type,
    'obligation_code', o.obligation_code
  ) as evidence,
  coalesce(o.resolved_at, o.created_at) as candidate_at
from core.obligations o
left join proof_boundary.obligation_claim_contexts occ on occ.obligation_id = o.id
where o.status <> 'open'
  and coalesce(o.proof_status, '') in ('pending','missing','insufficient','rejected')

union all

select
  ie.workspace_id,
  ie.obligation_id,
  null::uuid as receipt_id,
  ie.id as intake_event_id,
  null::uuid as proof_evaluation_id,
  cs.claim_source_id,
  cs.authority_boundary_id,
  case when cs.connector_type = 'payment' then 'revenue_leak_risk' else 'forgotten_work_risk' end as detection_type,
  case when cs.connector_type = 'payment' then 'high' else 'medium' end as severity,
  (case when cs.connector_type = 'payment' then 'revenue_leak_risk:' else 'forgotten_work_risk:' end) || ie.id::text as detection_key,
  jsonb_build_object(
    'source_system', ie.source_system,
    'source_event_key', ie.source_event_key,
    'source_event_type', ie.source_event_type,
    'connected_system_id', ie.connected_system_id,
    'connector_type', cs.connector_type,
    'watched_work', cs.watched_work,
    'proof_required', cs.proof_required,
    'payload_snapshot', ie.payload_snapshot
  ) as evidence,
  ie.received_at as candidate_at
from intake.ingestion_events ie
left join intake.connected_systems cs on cs.id = ie.connected_system_id
where ie.status = 'accepted'
  and ie.obligation_id is null
  and ie.received_at < now() - interval '30 minutes'

union all

select
  ie.workspace_id,
  ie.obligation_id,
  null::uuid as receipt_id,
  ie.id as intake_event_id,
  null::uuid as proof_evaluation_id,
  cs.claim_source_id,
  cs.authority_boundary_id,
  'agentic_claim_risk'::text as detection_type,
  case when cs.requires_human_approval then 'high' else 'medium' end as severity,
  'agentic_claim_risk:' || ie.id::text as detection_key,
  jsonb_build_object(
    'agent_run_id', ie.agent_run_id,
    'mcp_tool_name', ie.mcp_tool_name,
    'workflow_chain', ie.workflow_chain,
    'trust_level', ie.trust_level,
    'allow_auto_resolution', cs.allow_auto_resolution,
    'requires_human_approval', cs.requires_human_approval
  ) as evidence,
  ie.received_at as candidate_at
from intake.ingestion_events ie
left join intake.connected_systems cs on cs.id = ie.connected_system_id
where (ie.agent_run_id is not null or cs.source_type in ('agent','multi_agent'))
  and coalesce(cs.allow_auto_resolution, false) = false
  and ie.obligation_id is not null

union all

select
  pe.workspace_id,
  pe.obligation_id,
  per.receipt_id,
  null::uuid as intake_event_id,
  pe.id as proof_evaluation_id,
  pe.claim_source_id,
  pe.authority_boundary_id,
  case when pe.decision = 'conditional' then 'weak_proof' else 'authority_boundary_gap' end as detection_type,
  case when pe.decision = 'deny' then 'high' else 'medium' end as severity,
  (case when pe.decision = 'conditional' then 'weak_proof:' else 'authority_boundary_gap:' end) || pe.id::text as detection_key,
  jsonb_build_object(
    'decision', pe.decision,
    'evaluation_mode', pe.evaluation_mode,
    'rationale', pe.rationale,
    'required_follow_up', pe.required_follow_up,
    'evidence_snapshot', pe.evidence_snapshot,
    'rule_version', pe.rule_version
  ) as evidence,
  pe.evaluated_at as candidate_at
from proof_boundary.proof_evaluations pe
left join proof_boundary.proof_evaluation_receipts per on per.proof_evaluation_id = pe.id
where pe.decision in ('deny','conditional');

comment on view control.watchdog_unified_candidates is 'Watchdog v2 unified candidate surface for overdue work, missing proof, forgotten accepted intake, revenue leakage risk, agentic claim risk, and weak or denied proof.';

create or replace function api.materialize_watchdog_detections()
returns jsonb
language plpgsql
security definer
set search_path = api, control, core, intake, proof_boundary, public
as $$
declare
  v_inserted integer := 0;
  v_updated integer := 0;
begin
  with upserted as (
    insert into control.watchdog_detections (
      workspace_id,
      obligation_id,
      receipt_id,
      intake_event_id,
      proof_evaluation_id,
      claim_source_id,
      authority_boundary_id,
      detection_key,
      detection_type,
      severity,
      evidence,
      first_detected_at,
      last_detected_at
    )
    select
      c.workspace_id,
      c.obligation_id,
      c.receipt_id,
      c.intake_event_id,
      c.proof_evaluation_id,
      c.claim_source_id,
      c.authority_boundary_id,
      c.detection_key,
      c.detection_type,
      c.severity,
      c.evidence,
      now(),
      now()
    from control.watchdog_unified_candidates c
    on conflict (workspace_id, detection_key)
    do update set
      last_detected_at = excluded.last_detected_at,
      severity = excluded.severity,
      evidence = excluded.evidence,
      status = case when control.watchdog_detections.status = 'resolved' then 'open' else control.watchdog_detections.status end
    returning (xmax = 0) as inserted
  )
  select
    count(*) filter (where inserted),
    count(*) filter (where not inserted)
  into v_inserted, v_updated
  from upserted;

  return jsonb_build_object('ok', true, 'inserted_count', v_inserted, 'updated_count', v_updated);
end;
$$;

comment on function api.materialize_watchdog_detections() is 'Materializes Watchdog v2 candidates into durable detections. Detection does not mutate obligation truth.';

create or replace function api.create_watchdog_emissions_from_detections(p_delivery_target text default 'internal_ops')
returns jsonb
language plpgsql
security definer
set search_path = api, control, core, public
as $$
declare
  v_created integer := 0;
begin
  insert into control.watchdog_emissions (
    workspace_id,
    obligation_id,
    delivery_target,
    delivery_status,
    watchdog_detection_id,
    rule_id,
    severity,
    emission_key,
    payload,
    max_attempts
  )
  select
    d.workspace_id,
    d.obligation_id,
    coalesce(r.delivery_target, p_delivery_target),
    'pending',
    d.id,
    d.rule_id,
    d.severity,
    d.detection_key,
    jsonb_build_object(
      'detection_id', d.id,
      'detection_type', d.detection_type,
      'severity', d.severity,
      'evidence', d.evidence,
      'first_detected_at', d.first_detected_at,
      'last_detected_at', d.last_detected_at
    ),
    coalesce(r.max_attempts, 5)
  from control.watchdog_detections d
  left join control.watchdog_rules r on r.id = d.rule_id
  where d.status = 'open'
    and not exists (
      select 1 from control.watchdog_emissions we
      where we.watchdog_detection_id = d.id
        and we.delivery_target = coalesce(r.delivery_target, p_delivery_target)
        and we.delivery_status in ('pending','delivered')
    );

  get diagnostics v_created = row_count;

  update control.watchdog_detections d
  set status = 'emitted'
  where d.status = 'open'
    and exists (
      select 1 from control.watchdog_emissions we
      where we.watchdog_detection_id = d.id
        and we.delivery_status in ('pending','delivered')
    );

  return jsonb_build_object('ok', true, 'created_count', v_created);
end;
$$;

comment on function api.create_watchdog_emissions_from_detections(text) is 'Creates Watchdog v2 delivery emissions from durable detections, including pre-obligation detections, without duplicating active emissions.';

alter table control.watchdog_rules enable row level security;
alter table control.watchdog_detections enable row level security;

drop policy if exists watchdog_rules_select_workspace_members on control.watchdog_rules;
create policy watchdog_rules_select_workspace_members
on control.watchdog_rules
for select
to authenticated
using (
  workspace_id is null
  or exists (
    select 1 from core.workspace_members wm
    where wm.workspace_id = watchdog_rules.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists watchdog_detections_select_workspace_members on control.watchdog_detections;
create policy watchdog_detections_select_workspace_members
on control.watchdog_detections
for select
to authenticated
using (
  exists (
    select 1 from core.workspace_members wm
    where wm.workspace_id = watchdog_detections.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists watchdog_rules_service_role_all on control.watchdog_rules;
create policy watchdog_rules_service_role_all on control.watchdog_rules
for all
to service_role
using (true)
with check (true);

drop policy if exists watchdog_detections_service_role_all on control.watchdog_detections;
create policy watchdog_detections_service_role_all on control.watchdog_detections
for all
to service_role
using (true)
with check (true);

grant select on control.watchdog_rules, control.watchdog_detections to authenticated;
grant select on control.watchdog_unified_candidates to authenticated, service_role;
grant all on control.watchdog_rules, control.watchdog_detections to service_role;
grant execute on function api.materialize_watchdog_detections() to service_role;
grant execute on function api.create_watchdog_emissions_from_detections(text) to service_role;
revoke execute on function api.materialize_watchdog_detections() from public, anon, authenticated;
revoke execute on function api.create_watchdog_emissions_from_detections(text) from public, anon, authenticated;

commit;
