select count(*) as receipt_count
from receipts.receipts
where obligation_id = 'ff42436c-8c2c-4e96-940b-796dbcbc647f'::uuid;