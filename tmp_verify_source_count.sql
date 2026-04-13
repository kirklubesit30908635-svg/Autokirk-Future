select count(*) as source_event_count
from ingest.source_events
where workspace_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  and source_system = 'test_harness'
  and source_event_key = 'evt_001';
