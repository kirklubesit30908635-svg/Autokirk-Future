select count(*) as event_count
from ledger.events
where obligation_id = 'ff42436c-8c2c-4e96-940b-796dbcbc647f'::uuid;