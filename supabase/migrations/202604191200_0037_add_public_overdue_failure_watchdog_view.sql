drop view if exists public.overdue_failure_watchdog;

create view public.overdue_failure_watchdog as
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
