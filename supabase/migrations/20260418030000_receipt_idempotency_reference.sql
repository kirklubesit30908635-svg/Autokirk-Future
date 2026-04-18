alter table receipts.receipts
add column if not exists idempotency_key text;

update receipts.receipts r
set idempotency_key = k.idempotency_key
from ledger.idempotency_keys k
where k.obligation_id = r.obligation_id
  and r.idempotency_key is null;
