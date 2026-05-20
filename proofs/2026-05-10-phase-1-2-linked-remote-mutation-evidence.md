# Phase 1.2 Linked Remote Mutation Evidence

- Date: 2026-05-10
- Environment: linked remote Supabase project

## Direct Mutation Attack Attempts

### UPDATE ledger.events
- SQL: update ledger.events set reason='tamper' where id=(select id from ledger.events where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid order by emitted_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
Initialising login role...
unexpected status 400: {"message":"Failed to run sql query: ERROR:  P0001: APPEND_ONLY_VIOLATION: ledger.events does not allow UPDATE\nCONTEXT:  PL/pgSQL function kernel.block_mutation() line 10 at RAISE\n"}
Try rerunning the command with --debug to troubleshoot the error.
```

### DELETE ledger.events
- SQL: delete from ledger.events where id=(select id from ledger.events where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid order by emitted_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
Initialising login role...
unexpected status 400: {"message":"Failed to run sql query: ERROR:  P0001: APPEND_ONLY_VIOLATION: ledger.events does not allow DELETE\nCONTEXT:  PL/pgSQL function kernel.block_mutation() line 10 at RAISE\n"}
Try rerunning the command with --debug to troubleshoot the error.
```

### UPDATE receipts.receipts
- SQL: update receipts.receipts set reason='tamper' where id=(select id from receipts.receipts where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid order by emitted_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
Initialising login role...
unexpected status 400: {"message":"Failed to run sql query: ERROR:  P0001: APPEND_ONLY_VIOLATION: receipts.receipts does not allow UPDATE\nCONTEXT:  PL/pgSQL function kernel.block_mutation() line 10 at RAISE\n"}
Try rerunning the command with --debug to troubleshoot the error.
```

### DELETE receipts.receipts
- SQL: delete from receipts.receipts where id=(select id from receipts.receipts where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid order by emitted_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
Initialising login role...
unexpected status 400: {"message":"Failed to run sql query: ERROR:  P0001: APPEND_ONLY_VIOLATION: receipts.receipts does not allow DELETE\nCONTEXT:  PL/pgSQL function kernel.block_mutation() line 10 at RAISE\n"}
Try rerunning the command with --debug to troubleshoot the error.
```

### DELETE core.obligations
- SQL: delete from core.obligations where id=(select id from core.obligations where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid order by created_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
Initialising login role...
unexpected status 400: {"message":"Failed to run sql query: ERROR:  P0001: DELETE_FORBIDDEN: core.obligations is append-only\nCONTEXT:  PL/pgSQL function kernel.block_delete() line 7 at RAISE\n"}
Try rerunning the command with --debug to troubleshoot the error.
```

### FORBIDDEN UPDATE core.obligations immutable field
- SQL: update core.obligations set obligation_code='tamper_rewrite' where id=(select id from core.obligations where workspace_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid order by created_at desc limit 1);
- Exit code: 1
- Result: EXPECTED FAILURE (PASS)
- Output:
```text
Initialising login role...
unexpected status 400: {"message":"Failed to run sql query: ERROR:  P0001: OBLIGATION_IMMUTABLE_FIELD: obligation_code\nCONTEXT:  PL/pgSQL function kernel.enforce_obligation_immutability() line 20 at RAISE\n"}
Try rerunning the command with --debug to troubleshoot the error.
```
