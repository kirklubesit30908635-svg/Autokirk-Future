# Linked Remote Migration Reconciliation

Date: 2026-05-10

## Objective

Align linked remote migration history with local proven chain before Phase 2.

## Starting divergence

- Linked remote missing `20260510100000`.
- Linked remote missing `20260430` while local history included it.

Observed from `supabase migration list --linked`:
- CLI required `--include-all` due missing earlier migration:
  - `supabase/migrations/20260430_0040_fix_overdue_resolution_candidate_contract.sql`

## Applied reconciliation command

```powershell
supabase migration up --linked --include-all
```

Applied on linked remote:

- `20260430_0040_fix_overdue_resolution_candidate_contract.sql`
- `20260510100000_phase1_2_append_only_enforcement.sql`

## Reconciled state verification

Command:

```powershell
supabase db query "select version from supabase_migrations.schema_migrations where version in ('20260430','20260430113000','20260510090000','20260510100000') order by version;" --linked --output table
```

Result:

- `20260430`
- `20260430113000`
- `20260510090000`
- `20260510100000`

## Reconciliation conclusion

- `20260430` state is now explicitly reconciled on linked remote (history includes both `20260430` and `20260430113000`).
- Phase 1.2 migration version is present on linked remote (`20260510100000`).
- No additional semantic migration beyond chain alignment was applied.
