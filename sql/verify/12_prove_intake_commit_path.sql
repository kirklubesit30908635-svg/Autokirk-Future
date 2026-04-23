select
  se.id as source_event_id,
  se.workspace_id,
  se.source_system,
  se.source_event_key,
  se.source_event_type,
  os.obligation_id,
  o.obligation_code,
  o.truth_burden,
  o.status,
  o.proof_status
from ingest.source_events se
join core.obligation_sources os
  on os.source_event_id = se.id
join core.obligations o
  on o.id = os.obligation_id
where se.source_system = 'intake'
  and se.source_event_key like 'intake:%:candidate-001'
order by se.created_at desc;