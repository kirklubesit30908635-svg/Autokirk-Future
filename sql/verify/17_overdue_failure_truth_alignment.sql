select
  obligation_id,
  entity_id::text as entity_id,
  receipt_id,
  receipt_entity_id::text as receipt_entity_id,
  resolution_type,
  proof_status,
  lifecycle_state,
  due_at
from projection.obligation_lifecycle
where resolution_type = 'resolve_overdue'
  and proof_status = 'rejected'
  and lifecycle_state = 'failed'
order by receipt_emitted_at desc, obligation_created_at desc
limit 10;
