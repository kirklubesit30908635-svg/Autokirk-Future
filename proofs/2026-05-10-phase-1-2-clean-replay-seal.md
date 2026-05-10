# Phase 1.2 Clean Replay Seal

Date: 2026-05-10

## 1) Migration History Audit (Local vs Linked Remote)

Commands:

```powershell
supabase db query "select version from supabase_migrations.schema_migrations where version like '20260430%' or version in ('20260510090000','20260510100000') order by version;" --local --output table
supabase db query "select version from supabase_migrations.schema_migrations where version like '20260430%' or version in ('20260510090000','20260510100000') order by version;" --linked --output table
```

Observed:

- Local history contains:
  - `20260430`
  - `20260430113000`
  - `20260510090000`
  - `20260510100000`
- Linked remote history contains:
  - `20260430113000`
  - `20260510090000`
- Linked remote does not contain:
  - `20260430`
  - `20260510100000`

Conclusion:

- The prior `supabase migration repair --status reverted 20260430` touched linked remote migration history.
- It was not local-only.

## 2) Historical Drift Stabilization Applied

Minimal replay fixes:

- `supabase/migrations/202604141000_0022_obligation_code.sql`
  - Restored obligation code column creation (`add column if not exists obligation_code ...`).
- `supabase/migrations/202604192100_0047_watchdog_emission_control.sql`
  - Added `emitted_at` and `payload` columns expected by the next migration/view contract.
- `supabase/migrations/20260505165754_add_api_create_watchdog_emission.sql`
  - Added explicit `drop function if exists api.create_watchdog_emission(uuid, text);` before redefining return type as `jsonb`.

No changes were made to:

- kernel receipt schema,
- Phase 1.1 hash-chain semantics,
- Phase 1.2 append-only semantics.

## 3) Clean Replay Proof

Command:

```powershell
supabase db reset
```

Result:

- Replay completed successfully through:
  - `20260510090000_phase1_hash_chain_protocol_v1.sql`
  - `20260510100000_phase1_2_append_only_enforcement.sql`

Phase activation checks:

```powershell
supabase db query "select version from supabase_migrations.schema_migrations where version in ('20260510090000','20260510100000') order by version;" --output table
supabase db query "select tgname, tgrelid::regclass::text as table_name from pg_trigger where not tgisinternal and tgname in ('trg_events_chain_advance','trg_receipts_chain_advance','trg_block_mutation_events','trg_block_mutation_receipts','trg_enforce_chain_head_advancement','trg_block_delete_chain_heads','trg_enforce_obligation_immutability','trg_block_delete_obligations') order by tgname;" --output table
```

Observed:

- Both migration versions present in local migration history.
- Chain advance + append-only + obligation immutability triggers present.

## 4) Mutation-Attempt Doctrine Evidence

Evidence file:

- `proofs/2026-05-10-phase-1-2-clean-replay-mutation-evidence.md`

Result summary:

- `UPDATE ledger.events` -> blocked
- `DELETE ledger.events` -> blocked
- `UPDATE receipts.receipts` -> blocked
- `DELETE receipts.receipts` -> blocked
- `DELETE core.obligations` -> blocked
- forbidden immutable-field `UPDATE core.obligations` -> blocked

All six attempts failed as expected.

## 5) Runtime Verification

Commands:

```powershell
npm run build
npm run prove
```

Results:

- `npm run build` passed.
- `npm run prove` passed:
  - `TERMINAL_STATE_VERIFICATION_OK`
  - `OVERDUE_FAILURE_VERIFICATION_MANUAL_OK`
  - `SYSTEM_TRUTH_VERIFICATION_OK`

## Seal Statement

Phase 1.2 is sealed on clean migration replay in local environment.
