begin;

create or replace view learning.active_system_exhaust
with (security_invoker = true)
as
  select
    ie.workspace_id,
    ie.obligation_id,
    null::uuid as receipt_id,
    null::uuid as ledger_event_id,
    ie.id as intake_event_id,
    null::uuid as proof_evaluation_id,
    cs.claim_source_id,
    cs.authority_boundary_id,
    case
      when ie.agent_run_id is not null or cs.source_type in ('agent','multi_agent') then 'agentic_claim'
      else 'intake_signal'
    end as observation_type,
    'intake.ingestion_events:' || ie.id::text as signal_key,
    'intake'::text as source_schema,
    'ingestion_events'::text as source_table,
    ie.id as source_id,
    ie.received_at as occurred_at,
    jsonb_build_object(
      'status', ie.status,
      'source_system', ie.source_system,
      'source_event_key', ie.source_event_key,
      'source_event_type', ie.source_event_type,
      'trust_level', ie.trust_level,
      'agent_run_id', ie.agent_run_id,
      'mcp_tool_name', ie.mcp_tool_name,
      'workflow_chain', ie.workflow_chain,
      'payload_snapshot', ie.payload_snapshot
    ) as payload
  from intake.ingestion_events ie
  left join intake.connected_systems cs on cs.id = ie.connected_system_id

  union all

  select
    o.workspace_id,
    o.id as obligation_id,
    null::uuid as receipt_id,
    null::uuid as ledger_event_id,
    null::uuid as intake_event_id,
    null::uuid as proof_evaluation_id,
    occ.claim_source_id,
    occ.authority_boundary_id,
    case when o.status = 'open' then 'obligation_opened' else 'obligation_resolved' end as observation_type,
    'core.obligations:' || o.id::text || ':' || o.status as signal_key,
    'core'::text as source_schema,
    'obligations'::text as source_table,
    o.id as source_id,
    coalesce(o.resolved_at, o.created_at) as occurred_at,
    jsonb_build_object(
      'status', o.status,
      'resolution_type', o.resolution_type,
      'resolution_reason', o.resolution_reason,
      'proof_status', o.proof_status,
      'obligation_code', o.obligation_code,
      'truth_burden', o.truth_burden,
      'due_at', o.due_at,
      'entity_id', o.entity_id
    ) as payload
  from core.obligations o
  left join proof_boundary.obligation_claim_contexts occ on occ.obligation_id = o.id

  union all

  select
    pe.workspace_id,
    pe.obligation_id,
    per.receipt_id,
    null::uuid as ledger_event_id,
    null::uuid as intake_event_id,
    pe.id as proof_evaluation_id,
    pe.claim_source_id,
    pe.authority_boundary_id,
    case pe.decision
      when 'approve' then 'proof_approved'
      when 'deny' then 'proof_denied'
      else 'proof_conditional'
    end as observation_type,
    'proof_boundary.proof_evaluations:' || pe.id::text as signal_key,
    'proof_boundary'::text as source_schema,
    'proof_evaluations'::text as source_table,
    pe.id as source_id,
    pe.evaluated_at as occurred_at,
    jsonb_build_object(
      'decision', pe.decision,
      'evaluation_mode', pe.evaluation_mode,
      'rationale', pe.rationale,
      'cited_controls', pe.cited_controls,
      'required_follow_up', pe.required_follow_up,
      'evidence_snapshot', pe.evidence_snapshot,
      'rule_version', pe.rule_version
    ) as payload
  from proof_boundary.proof_evaluations pe
  left join proof_boundary.proof_evaluation_receipts per on per.proof_evaluation_id = pe.id

  union all

  select
    r.workspace_id,
    r.obligation_id,
    r.id as receipt_id,
    null::uuid as ledger_event_id,
    null::uuid as intake_event_id,
    rr.proof_evaluation_id,
    rr.claim_source_id,
    rr.authority_boundary_id,
    'receipt_emitted'::text as observation_type,
    'receipts.receipts:' || r.id::text as signal_key,
    'receipts'::text as source_schema,
    'receipts'::text as source_table,
    r.id as source_id,
    r.emitted_at as occurred_at,
    jsonb_build_object(
      'resolution_type', r.resolution_type,
      'proof_status', r.proof_status,
      'rule_version', r.rule_version,
      'chain_status', r.chain_status,
      'receipt_hash', r.receipt_hash,
      'entity_id', r.entity_id,
      'rationale', rr.machine_rationale,
      'authority_decision', rr.authority_decision
    ) as payload
  from receipts.receipts r
  left join proof_boundary.receipt_rationales rr on rr.receipt_id = r.id

  union all

  select
    le.workspace_id,
    le.obligation_id,
    null::uuid as receipt_id,
    le.id as ledger_event_id,
    null::uuid as intake_event_id,
    null::uuid as proof_evaluation_id,
    null::uuid as claim_source_id,
    null::uuid as authority_boundary_id,
    'ledger_event'::text as observation_type,
    'ledger.events:' || le.id::text as signal_key,
    'ledger'::text as source_schema,
    'events'::text as source_table,
    le.id as source_id,
    le.emitted_at as occurred_at,
    jsonb_build_object(
      'event_type', le.event_type,
      'reason', le.reason,
      'rule_version', le.rule_version,
      'chain_status', le.chain_status,
      'event_hash', le.event_hash
    ) as payload
  from ledger.events le

  union all

  select
    o.workspace_id,
    we.obligation_id,
    null::uuid as receipt_id,
    null::uuid as ledger_event_id,
    null::uuid as intake_event_id,
    null::uuid as proof_evaluation_id,
    null::uuid as claim_source_id,
    null::uuid as authority_boundary_id,
    'watchdog_emission'::text as observation_type,
    'control.watchdog_emissions:' || we.id::text as signal_key,
    'control'::text as source_schema,
    'watchdog_emissions'::text as source_table,
    we.id as source_id,
    coalesce(we.emitted_at, we.created_at) as occurred_at,
    jsonb_build_object(
      'delivery_target', we.delivery_target,
      'delivery_status', we.delivery_status,
      'attempt_count', we.attempt_count,
      'next_retry_at', we.next_retry_at,
      'payload', we.payload
    ) as payload
  from control.watchdog_emissions we
  join core.obligations o on o.id = we.obligation_id;

comment on view learning.active_system_exhaust is 'Canonical active-system learning exhaust for AutoKirk-Future. Replaces legacy ak.job_events and ak.audit_log references.';

create or replace view learning.workspace_daily_exhaust
with (security_invoker = true)
as
select
  workspace_id,
  occurred_at::date as rollup_date,
  count(*) filter (where observation_type = 'intake_signal') as intake_signal_count,
  count(*) filter (where observation_type = 'obligation_opened') as obligations_opened_count,
  count(*) filter (where observation_type = 'obligation_resolved') as obligations_resolved_count,
  count(*) filter (where observation_type = 'proof_approved') as proof_approved_count,
  count(*) filter (where observation_type = 'proof_denied') as proof_denied_count,
  count(*) filter (where observation_type = 'proof_conditional') as proof_conditional_count,
  count(*) filter (where observation_type = 'receipt_emitted') as receipts_emitted_count,
  count(*) filter (where observation_type = 'watchdog_emission') as watchdog_emission_count,
  count(*) filter (where observation_type = 'agentic_claim') as agentic_claim_count,
  jsonb_build_object(
    'source_tables', jsonb_agg(distinct source_schema || '.' || source_table),
    'observation_types', jsonb_agg(distinct observation_type)
  ) as metrics
from learning.active_system_exhaust
where occurred_at is not null
group by workspace_id, occurred_at::date;

comment on view learning.workspace_daily_exhaust is 'Live daily rollup view over active AutoKirk-Future learning exhaust.';

drop policy if exists signal_observations_select_workspace_members on learning.signal_observations;
create policy signal_observations_select_workspace_members
on learning.signal_observations
for select
to authenticated
using (
  exists (
    select 1 from core.workspace_members wm
    where wm.workspace_id = signal_observations.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists daily_workspace_rollups_select_workspace_members on learning.daily_workspace_rollups;
create policy daily_workspace_rollups_select_workspace_members
on learning.daily_workspace_rollups
for select
to authenticated
using (
  exists (
    select 1 from core.workspace_members wm
    where wm.workspace_id = daily_workspace_rollups.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists pattern_findings_select_workspace_members on learning.pattern_findings;
create policy pattern_findings_select_workspace_members
on learning.pattern_findings
for select
to authenticated
using (
  exists (
    select 1 from core.workspace_members wm
    where wm.workspace_id = pattern_findings.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists recommendations_select_workspace_members on learning.recommendations;
create policy recommendations_select_workspace_members
on learning.recommendations
for select
to authenticated
using (
  exists (
    select 1 from core.workspace_members wm
    where wm.workspace_id = recommendations.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists signal_observations_service_role_all on learning.signal_observations;
create policy signal_observations_service_role_all on learning.signal_observations for all to service_role using (true) with check (true);

drop policy if exists daily_workspace_rollups_service_role_all on learning.daily_workspace_rollups;
create policy daily_workspace_rollups_service_role_all on learning.daily_workspace_rollups for all to service_role using (true) with check (true);

drop policy if exists pattern_findings_service_role_all on learning.pattern_findings;
create policy pattern_findings_service_role_all on learning.pattern_findings for all to service_role using (true) with check (true);

drop policy if exists recommendations_service_role_all on learning.recommendations;
create policy recommendations_service_role_all on learning.recommendations for all to service_role using (true) with check (true);

grant select on learning.active_system_exhaust to authenticated, service_role;
grant select on learning.workspace_daily_exhaust to authenticated, service_role;

commit;
