-- =========================================================
-- 0012_idempotency_input_hash.sql
-- Enforce intent-level idempotency (not just key-level)
-- =========================================================

alter table ledger.idempotency_keys
add column if not exists input_hash text;

-- Optional index for lookup performance
create index if not exists idx_idempotency_input_hash
on ledger.idempotency_keys (input_hash);

