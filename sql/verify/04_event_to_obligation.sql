select
  'source_events' as surface,
  count(*)::text as count
from ingest.source_events
where source_system = 'test_system'
  and source_event_key = 'event-1'

union all

select
  'obligation_sources' as surface,
  count(*)::text as count
from core.obligation_sources
where source_system = 'test_system'
  and source_event_key = 'event-1'

union all

select
  'obligations' as surface,
  count(*)::text as count
from core.obligations o
join core.obligation_sources os
  on os.obligation_id = o.id
where os.source_system = 'test_system'
  and os.source_event_key = 'event-1';
