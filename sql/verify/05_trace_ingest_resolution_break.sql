with target as (
  select '3b1c2a6c-ae41-47c9-8247-71e4d57cced0'::uuid as obligation_id
),
core_obligation_state as (
  select
    'core.obligations'::text as section,
    jsonb_build_object(
      'id', o.id,
      'workspace_id', o.workspace_id,
      'status', o.status,
      'proof_status', o.proof_status,
      'resolution_type', o.resolution_type,
      'resolution_reason', o.resolution_reason,
      'created_at', o.created_at,
      'resolved_at', o.resolved_at
    ) as data
  from core.obligations o
  where o.id = (select obligation_id from target)
),
kernel_obligation_state as (
  select
    'kernel.obligations'::text as section,
    jsonb_build_object(
      'id', o.id,
      'workspace_id', o.workspace_id,
      'status', o.status,
      'resolution_code', o.resolution_code,
      'resolution_reason', o.resolution_reason,
      'last_receipt_id', o.last_receipt_id,
      'created_at', o.created_at,
      'updated_at', o.updated_at,
      'resolved_at', o.resolved_at
    ) as data
  from kernel.obligations o
  where o.id = (select obligation_id from target)
),
kernel_receipt_state as (
  select
    'kernel.receipts'::text as section,
    jsonb_build_object(
      'id', r.id,
      'workspace_id', r.workspace_id,
      'obligation_id', r.obligation_id,
      'event_id', r.event_id,
      'receipt_type', r.receipt_type,
      'created_at', r.created_at
    ) as data
  from kernel.receipts r
  where r.obligation_id = (select obligation_id from target)
),
ledger_event_state as (
  select
    'ledger.events'::text as section,
    jsonb_build_object(
      'id', e.id,
      'obligation_id', e.obligation_id,
      'workspace_id', e.workspace_id,
      'actor_id', e.actor_id,
      'event_type', e.event_type,
      'reason', e.reason,
      'evidence_present', e.evidence_present,
      'failed_checks', e.failed_checks,
      'rule_version', e.rule_version,
      'emitted_at', e.emitted_at
    ) as data
  from ledger.events e
  where e.obligation_id = (select obligation_id from target)
),
kernel_event_state as (
  select
    'kernel.events'::text as section,
    jsonb_build_object(
      'id', e.id,
      'workspace_id', e.workspace_id,
      'obligation_id', e.obligation_id,
      'event_type', e.event_type,
      'actor_id', e.actor_id,
      'created_at', e.created_at
    ) as data
  from kernel.events e
  where e.obligation_id = (select obligation_id from target)
)
select * from core_obligation_state
union all
select * from kernel_obligation_state
union all
select * from kernel_receipt_state
union all
select * from ledger_event_state
union all
select * from kernel_event_state;
