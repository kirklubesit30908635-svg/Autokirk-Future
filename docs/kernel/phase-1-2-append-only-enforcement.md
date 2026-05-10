# Phase 1.2 - Append-Only Enforcement

## Scope Truth

Phase 1.2 hardens storage mutability boundaries without redesigning the kernel.

Canonical lifecycle remains:

`event -> obligation -> resolution -> receipt`

## Trigger Coverage Matrix

| Table | UPDATE | DELETE | Notes |
| --- | --- | --- | --- |
| `ledger.events` | blocked | blocked | absolute immutable event history |
| `receipts.receipts` | blocked | blocked | absolute immutable receipt artifacts |
| `ledger.chain_heads` | restricted | blocked | monotonic head advancement only (`seq + 1`, hash rewrite blocked) |
| `core.obligations` | restricted | blocked | governed state advancement only; immutable identity/history fields |

Note:
- `ledger.receipt_heads` is represented by `ledger.chain_heads` rows where `chain_key = 'receipts:v1'`.

## Immutable Kernel Trigger Package

Migration `supabase/migrations/20260510100000_phase1_2_append_only_enforcement.sql` installs:

- `kernel.block_mutation()`
- `kernel.block_delete()`
- `kernel.enforce_obligation_immutability()`
- `kernel.enforce_chain_head_advancement()`

Bypass behavior:
- Only `app.kernel_mode = 'migration'` bypasses mutation blockers.
- Runtime paths do not set this mode.

## Mutation Exception Audit (Current Runtime Surface)

### Allowed governed mutation paths

- `kernel.open_obligation_internal(...)`
  - opens obligations and links source events under kernel authority.
  - now serializes by source event advisory lock and no longer deletes race losers.
- `kernel.resolve_obligation_internal(...)`
  - appends `ledger.events`, appends `receipts.receipts`, advances `core.obligations` terminal state.

### Blocked direct mutation paths

- Direct `UPDATE/DELETE` on protected tables for `anon`, `authenticated`, `service_role`:
  - `ledger.events`
  - `receipts.receipts`
  - `ledger.chain_heads`
  - `core.obligations`

### Suspect/bypass surfaces to treat as audit scope

- Any ad-hoc SQL client path attempting direct `UPDATE/DELETE` on protected tables.
- Any migration that sets `app.kernel_mode = 'migration'` but is not bounded to explicit data correction.
- Any future helper that reintroduces row cleanup deletes instead of compensating records.

## Compensating Event Protocol

Errors are corrected by forward records, never historical rewrite.

Required correction mode:

1. Append compensating event in `ledger.events`.
2. Resolve with governed kernel path to emit a new `receipts.receipts` artifact.
3. Preserve prior rows intact; mark supersession in forward data where needed.
4. Keep projections explanatory only; no projection-side truth rewriting.

Examples:

- void/override by a new governed resolution event + new receipt.
- reversal by a new event linked to the affected obligation.
- superseding obligation opened from a correction source event.

## Verification Contract

After applying Phase 1.2:

- `npm run build`
- `npm run prove`
- `git diff --check`
- `git status --short`

Note:
- `git diff --check` scoped to changed Phase 1.2 files, or global with known generated whitespace exc

Expected outcomes:

- historical events/receipts cannot be updated or deleted,
- obligations cannot be deleted and cannot rewrite immutable identity/history fields,
- replay and chain verification remain deterministic under governed APIs.
