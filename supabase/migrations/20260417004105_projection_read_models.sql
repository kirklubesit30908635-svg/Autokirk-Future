create schema if not exists projection;

create or replace view projection.obligation_lifecycle as
select
  o.id as obligation_id,
  o.obligation_code,
  o.workspace_id,
  o.created_at as obligation_created_at,
  os.source_event_id,
  se.source_system,
  se.source_event_key,
  se.source_event_type,
  se.created_at as source_event_created_at,
  r.id as receipt_id,
  r.resolution_type,
  r.proof_status,
  r.emitted_at as receipt_emitted_at
from core.obligation_sources os
join core.obligations o
  on o.id = os.obligation_id
left join ingest.source_events se
  on se.id = os.source_event_id
left join receipts.receipts r
  on r.obligation_id = o.id;
