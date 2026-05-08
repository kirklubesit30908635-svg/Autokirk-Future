begin;

create or replace view projection.overdue_failure_resolution_candidates as
select
  obligation_id,
  entity_id,
  obligation_code,
  workspace_id,
  obligation_created_at,
  source_event_id,
  source_system,
  source_event_key,
  source_event_type,
  source_event_created_at,
  receipt_id,
  receipt_entity_id,
  resolution_type,
  proof_status,
  receipt_emitted_at,
  truth_burden,
  due_at,
  lifecycle_state
from projection.obligation_lifecycle
where receipt_id is null
  and due_at is not null
  and due_at < now();

commit;
