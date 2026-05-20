# Phase 1.2 Linked Remote Seal

Date: 2026-05-10

## Scope

Seal Phase 1.2 on linked remote by proving:

1. migration history aligned,
2. governed mutation path still functions,
3. event/receipt chains advance,
4. direct mutation attempts fail.

## Migration alignment

Applied:

```powershell
supabase migration up --linked --include-all
```

Linked remote migration history includes:

- `20260430`
- `20260430113000`
- `20260510090000` (Phase 1.1)
- `20260510100000` (Phase 1.2)

## Trigger verification (Phase 1.1 + 1.2)

Verified on linked remote:

- `trg_events_chain_advance` on `ledger.events`
- `trg_receipts_chain_advance` on `receipts.receipts`
- `trg_block_mutation_events` on `ledger.events`
- `trg_block_mutation_receipts` on `receipts.receipts`
- `trg_enforce_chain_head_advancement` on `ledger.chain_heads`
- `trg_block_delete_chain_heads` on `ledger.chain_heads`
- `trg_enforce_obligation_immutability` on `core.obligations`
- `trg_block_delete_obligations` on `core.obligations`

## Governed entrypoint discovery (remote deployed surface)

Remote exposes governed resolution entrypoints:

- `api.resolve_with_proof(...)`
- `api.resolve_with_insufficient_proof(...)`
- `api.resolve_rejected(...)`
- `api.resolve_overdue_obligations(...)`

Deployment-surface finding:

- `api.resolve_obligation(...)` is absent on linked remote.
- This is a remote API-surface mismatch versus local proof scripts, not a Phase 1.2 append-only failure.

## Controlled governed proof action (remote)

Used:

- `api.ingest_event_to_obligation(...)`
- `api.resolve_with_proof(...)`

Artifact:

- `sql/temp/remote_phase12_controlled_proof.sql`

Observed result:

- obligation opened and resolved successfully through governed API path.
- emitted event hash and receipt id returned.

## Chain advancement proof (remote)

Workspace: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`

`ledger.chain_heads` before controlled proof:

- `events:v1` seq = `0`
- `receipts:v1` seq = `0`

`ledger.chain_heads` after controlled proof:

- `events:v1` seq = `1`
- `receipts:v1` seq = `1`

Conclusion:

- event chain advanced.
- receipt chain advanced.

## Direct mutation failure proof (remote)

Evidence file:

- `proofs/2026-05-10-phase-1-2-linked-remote-mutation-evidence.md`

Result summary:

- `UPDATE ledger.events` -> blocked
- `DELETE ledger.events` -> blocked
- `UPDATE receipts.receipts` -> blocked
- `DELETE receipts.receipts` -> blocked
- `DELETE core.obligations` -> blocked
- forbidden immutable-field `UPDATE core.obligations` -> blocked

All six mutation attempts failed as expected.

## Seal statement

Phase 1.2 is sealed across local + linked remote.
