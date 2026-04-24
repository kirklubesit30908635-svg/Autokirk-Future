select *
from ledger.events
where obligation_id = 'ff42436c-8c2c-4e96-940b-796dbcbc647f'::uuid
order by emitted_at desc;