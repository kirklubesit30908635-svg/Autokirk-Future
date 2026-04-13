select count(*) as event_count
from ledger.events
where obligation_id = '58c61a03-8535-412f-994f-33a0c96fdaae'::uuid;
