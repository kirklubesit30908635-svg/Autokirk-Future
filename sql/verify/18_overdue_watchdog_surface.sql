select
  obligation_id,
  entity_id::text as entity_id,
  receipt_entity_id::text as receipt_entity_id,
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
from public.overdue_failure_watchdog
order by receipt_emitted_at desc, obligation_created_at desc;
