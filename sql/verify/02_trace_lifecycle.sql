select
  o.id as obligation_id,
  o.status as obligation_status,
  o.proof_status as obligation_proof_status,
  e.id as event_id,
  e.event_type,
  r.id as receipt_id,
  r.resolution_type,
  r.proof_status as receipt_proof_status
from core.obligations o
left join ledger.events e
  on e.obligation_id = o.id
left join receipts.receipts r
  on r.obligation_id = o.id;
