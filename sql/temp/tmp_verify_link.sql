select
  se.id as source_event_id,
  os.obligation_id,
  o.status,
  o.proof_status,
  o.created_at,
  o.resolved_at
from ingest.source_events se
join core.obligation_sources os on os.source_event_id = se.id
join core.obligations o on o.id = os.obligation_id
where se.workspace_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  and se.source_system = 'test_harness'
  and se.source_event_key = 'evt_001';
