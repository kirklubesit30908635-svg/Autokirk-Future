# Phase 1.2 Append-Only Enforcement Evidence

- Date: 2026-05-10
- Environment: local Supabase Postgres container (supabase_db_autokirk-future)
- Runner: direct psql superuser path (tamper attempt surface)

## Direct Mutation Attack Attempts

### UPDATE ledger.events
- SQL: update ledger.events set reason='tamper' where id=(select id from ledger.events order by emitted_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
ERROR:  APPEND_ONLY_VIOLATION: ledger.events does not allow UPDATE
CONTEXT:  PL/pgSQL function kernel.block_mutation() line 10 at RAISE
```

### DELETE ledger.events
- SQL: delete from ledger.events where id=(select id from ledger.events order by emitted_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
ERROR:  APPEND_ONLY_VIOLATION: ledger.events does not allow DELETE
CONTEXT:  PL/pgSQL function kernel.block_mutation() line 10 at RAISE
```

### UPDATE receipts.receipts
- SQL: update receipts.receipts set reason='tamper' where id=(select id from receipts.receipts order by emitted_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
ERROR:  APPEND_ONLY_VIOLATION: receipts.receipts does not allow UPDATE
CONTEXT:  PL/pgSQL function kernel.block_mutation() line 10 at RAISE
```

### DELETE receipts.receipts
- SQL: delete from receipts.receipts where id=(select id from receipts.receipts order by emitted_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
ERROR:  APPEND_ONLY_VIOLATION: receipts.receipts does not allow DELETE
CONTEXT:  PL/pgSQL function kernel.block_mutation() line 10 at RAISE
```

### DELETE core.obligations
- SQL: delete from core.obligations where id=(select id from core.obligations order by created_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
ERROR:  DELETE_FORBIDDEN: core.obligations is append-only
CONTEXT:  PL/pgSQL function kernel.block_delete() line 7 at RAISE
```

### FORBIDDEN UPDATE core.obligations immutable field
- SQL: update core.obligations set obligation_code='tamper_rewrite' where id=(select id from core.obligations order by created_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
ERROR:  OBLIGATION_IMMUTABLE_FIELD: obligation_code
CONTEXT:  PL/pgSQL function kernel.enforce_obligation_immutability() line 20 at RAISE
```
