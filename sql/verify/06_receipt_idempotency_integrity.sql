select
  count(*) filter (where k.id is null) as null_idempotency_keys,
  count(*) as total_receipts
from receipts.receipts r
left join ledger.idempotency_keys k
  on r.id = k.receipt_id;
