select obligation_id, count(*)::int as receipt_count
from receipts.receipts
group by obligation_id
having count(*) > 1;
