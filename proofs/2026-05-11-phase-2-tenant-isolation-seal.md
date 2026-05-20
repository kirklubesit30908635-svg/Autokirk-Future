# Phase 2 Tenant Isolation Seal

## Local proof

- `npx supabase db reset`: passed
- `npm run build`: passed
- `npm run prove`: `SYSTEM_TRUTH_VERIFICATION_OK`

## Local cross-tenant proof

- User `11111111-1111-1111-1111-111111111111` sees Tenant A only.
- User `22222222-2222-2222-2222-222222222222` sees Tenant B only.
- Non-member `99999999-9999-9999-9999-999999999999` sees:
  - 0 workspaces
  - 0 obligations
  - 0 ledger events
  - 0 receipts

## Remote RLS verification

RLS is enabled on tenant/customer surfaces:

- `core.legal_entities`
- `core.workspaces`
- `core.workspace_members`
- `core.obligations`
- `core.obligation_sources`
- `ingest.source_events`
- `ledger.chain_heads`
- `ledger.events`
- `ledger.idempotency_keys`
- `receipts.receipts`
- `control.watchdog_emissions`
- `registry.entities`
- `registry.entity_workspaces`

Authenticated SELECT policies are present for all tenant/customer surfaces above.

## Reference tables left without RLS

- `core.proof_contracts`
- `governance.chain_activations`
- `governance.integrity_score_policy`
- `governance.protocol_test_vectors`

These are treated as protocol/reference tables unless later made tenant-owned.

## Known migration-history issue

Linked Supabase migration history still has legacy `20260430` drift. Do not run broad `migration up --linked --include-all`. Normalize migration history in a separate maintenance pass.
