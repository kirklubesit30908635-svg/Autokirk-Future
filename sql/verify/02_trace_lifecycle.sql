select
  o.id::text as obligation_id,
  o.status,
  o.resolution_type,
  o.resolution_reason,
  o.proof_status,
  o.resolved_at,
  r.id::text as receipt_id,
  r.resolution_type as receipt_resolution_type,
  r.reason as receipt_reason,
  r.proof_status as receipt_proof_status,
  r.emitted_at as receipt_emitted_at,
  e.id::text as event_id,
  e.event_type,
  e.reason as event_reason,
  e.emitted_at as event_emitted_at
from core.obligations o
left join receipts.receipts r
  on r.obligation_id = o.id
left join ledger.events e
  on e.obligation_id = o.id
where o.id in (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
)
order by
  o.id,
  e.emitted_at nulls last,
  r.emitted_at nulls last;
