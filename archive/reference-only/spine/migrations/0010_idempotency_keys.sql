create table if not exists ledger.idempotency_keys (
    id uuid primary key default gen_random_uuid(),
    idempotency_key text not null,
    obligation_id uuid not null references core.obligations(id) on delete cascade,
    resolution_type text not null,
    event_id uuid not null references ledger.events(id) on delete cascade,
    receipt_id uuid not null references receipts.receipts(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (idempotency_key),
    unique (obligation_id, resolution_type, idempotency_key)
);
