create or replace view projection.overdue_failure_resolution_candidates as
select
  pl.obligation_id,
  pl.entity_id,
  pl.obligation_code,
  pl.workspace_id,
  pl.obligation_created_at,
  pl.source_event_id,
  pl.source_system,
  pl.source_event_key,
  pl.source_event_type,
  pl.source_event_created_at,
  pl.receipt_id,
  pl.receipt_entity_id,
  pl.resolution_type,
  pl.proof_status,
  pl.receipt_emitted_at,
  pl.truth_burden,
  pl.due_at,
  pl.lifecycle_state
from projection.obligation_lifecycle pl
where pl.receipt_id is null
  and pl.due_at is not null
  and pl.due_at < now();

comment on view projection.overdue_failure_resolution_candidates is
  'Operational candidate surface for explicit overdue resolution. Selects unresolved overdue obligations by authoritative receipt/due_at state; resolver authors failed truth through kernel/API resolution.';