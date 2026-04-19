select
  count(*) filter (where idempotency_key is null) as null_idempotency_keys,
  count(*) as total_receipts
from receipts.receipts;
