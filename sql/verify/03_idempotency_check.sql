select
  obligation_id,
  count(*) as receipt_count
from receipts.receipts
group by obligation_id;
