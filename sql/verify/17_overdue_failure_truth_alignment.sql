select
  obligation_id,
  entity_id::text as entity_id,
  receipt_entity_id::text as receipt_entity_id,
  resolution_type,
  proof_status,
  lifecycle_state,
  due_at
from projection.obligation_lifecycle
where due_at is not null
  and due_at < now()
  and receipt_id is null
order by obligation_created_at desc
limit 10;
