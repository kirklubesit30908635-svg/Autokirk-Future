select
  o.id as obligation_id,
  o.status,
  o.proof_status as obligation_proof_status,
  r.id as receipt_id,
  r.resolution_type,
  r.proof_status as receipt_proof_status,
  se.source_event_key,
  o.obligation_code,
  o.truth_burden
from core.obligations o
join core.obligation_sources os
  on os.obligation_id = o.id
join ingest.source_events se
  on se.id = os.source_event_id
left join receipts.receipts r
  on r.obligation_id = o.id
where se.source_event_key = 'event-reject-1';
