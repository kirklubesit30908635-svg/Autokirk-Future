# AutoKirk Future System Layout

## Purpose

This document describes the cleaned repo layout for `autokirk-future`.

It is an authority map for the current runtime, not a backlog or architecture wishlist.

Canonical lifecycle:

`source event -> obligation -> resolution -> receipt`

## Canonical Active Surfaces

- `supabase/migrations/`
  The only executable schema authority.
- `supabase/functions/stripe-webhook/`
  The only canonical external ingress surface.
- `pages/`
  The active Next.js runtime for the dashboard and API routes.
- `scripts/`
  Proof and operator scripts for local verification.
- `sql/verify/`
  SQL proof assets for ingest, lifecycle, and watchdog behavior.
- `control/`, `constitution/`, `checklists/`, `docs/`
  Doctrine, cleanup rules, and system documentation.

## Reference-Only Surfaces

- `archive/reference-only/spine/`
  Historical SQL kept for reference only. Not executable.
- `archive/reference-only/supabase-snippets/`
  Archived query clutter kept out of active search paths. Not canonical.

## Runtime Architecture

### 1. External ingress

Canonical path:

`Stripe -> supabase/functions/stripe-webhook -> api.ingest_event_to_obligation() -> kernel.open_obligation_internal()`

Responsibilities:

- verify Stripe signatures
- normalize inbound event metadata
- resolve legal entity binding from `core.workspaces.entity_id`
- route all durable truth mutation through `api.*` and `kernel.*`
- avoid direct app-layer table writes

### 2. Manual intake commit

Canonical path:

`UI/request -> pages/api/intake/commit -> api.commit_intake_candidate() -> api.ingest_event_to_obligation() -> kernel.open_obligation_internal()`

Responsibilities:

- require authenticated operator identity
- verify workspace membership through `core.workspace_members`
- validate intake anchors and candidate metadata
- build deterministic intake event identity
- inherit legal attribution from the workspace-bound entity
- delegate into the same canonical ingest path used by external ingress

### 3. Resolution path

Resolution authority lives in database functions:

- `api.resolve_with_proof()`
- `api.resolve_with_insufficient_proof()`
- `api.resolve_rejected()`
- `api.resolve_overdue_obligations()`
- `api.resolve_obligation()`

All governed truth mutation flows into:

- `kernel.resolve_obligation_internal()`

Responsibilities:

- preserve a single mutation boundary
- classify proof outcomes
- update obligation truth
- emit durable receipts
- preserve entity attribution on receipts and lifecycle projection rows
- append lifecycle events
- enforce replay safety through idempotency

### 4. Read and monitoring path

Read flow:

`core + ingest + receipts -> projection.obligation_lifecycle / projection.entity_integrity_score / projection.entity_integrity_classification / projection.integrity_events -> public watchdog views -> Next.js API routes -> dashboard`

Responsibilities:

- expose lifecycle truth without mutating it
- aggregate deterministic entity-level integrity scoring from lifecycle truth
- classify raw integrity scores through queryable governance policy
- expose read-only integrity consequence events without enforcing them
- surface overdue and failed obligations
- expose watchdog delivery state separately from truth mutation

### 5. Watchdog delivery path

Current path:

`public.overdue_failure_emission_candidates -> pages/api/watchdog/emit-overdue-webhook -> control.watchdog_emissions -> outbound receiver`

Responsibilities:

- identify overdue unresolved obligations
- record emission attempts
- deliver outbound webhook payloads
- track retries and delivery status

This path is delivery tracking only. It does not define lifecycle truth.

## Next.js Surface Map

### UI

- `pages/index.tsx`
  Primary dashboard surface.
- `src/app/intake-test/page.tsx`
  Optional App Router test page only. It is not an API authority surface.

### Active Pages Router APIs

- `pages/api/intake/commit.ts`
  Canonical intake commit route.
- `pages/api/watchdog/failed-obligations.ts`
  Read-only watchdog aggregation route.
- `pages/api/watchdog/emit-overdue-webhook.ts`
  Outbound overdue failure emission route.
- `pages/api/integrations/watchdog-receiver.ts`
  Receiver used for watchdog delivery verification.

### Removed duplicate authorities

The following are no longer active runtime surfaces:

- `pages/api/webhook.ts`
- `pages/api/integrations/stripe-webhook.ts`
- `pages/api/integrations/stripe-webhook.stashed.ts`
- `src/app/api/intake/commit/route.ts`
- nested `Autokirk-Future/` tree

## Database Layout

Active schemas include:

- `public`
- `control`
- `core`
- `ingest`
- `receipts`
- `projection`
- `governance`
- `kernel`
- `ledger`
- `api`

### Core truth tables

- `core.legal_entities`
  Canonical legal-actor table for workspace-bound attribution.
- `core.workspaces`
  Workspace root authority, bound to exactly one `entity_id`.
- `core.workspace_members`
  Sole membership truth substrate.
- `core.obligations`
  Durable obligation truth, including `entity_id`.
- `core.obligation_sources`
  Link between obligations and accepted source events.
- `ingest.source_events`
  Canonical accepted inbound events, including `entity_id`.
- `receipts.receipts`
  Durable resolution artifacts, including `entity_id`.
- `ledger.events`
  Lifecycle event log.
- `ledger.idempotency_keys`
  Replay guard substrate.
- `control.watchdog_emissions`
  Outbound watchdog delivery tracking.
- `governance.integrity_score_policy`
  Queryable interpretation thresholds and floor conditions for integrity classification.

### Canonical projection views

- `projection.obligation_lifecycle`
  Canonical lifecycle read model.
- `projection.entity_integrity_score`
  Raw proof-backed reliability score per entity.
- `projection.entity_integrity_classification`
  Policy-wrapped interpretation of the raw integrity score.
- `projection.integrity_events`
  Read-only consequence/event projection derived from failed contractual integrity classifications.

### Canonical write boundary

Application code should call:

- `api.ingest_event_to_obligation()`
- `api.commit_intake_candidate()`
- `api.resolve_obligation()`
- `api.resolve_with_proof()`
- `api.resolve_with_insufficient_proof()`
- `api.resolve_rejected()`
- `api.resolve_overdue_obligations()`
- `api.record_watchdog_attempt()`

Kernel truth mutation remains inside:

- `kernel.open_obligation_internal()`
- `kernel.resolve_obligation_internal()`

Rule:

- app code calls `api.*`
- `kernel.*` mutates truth
- projections observe truth
- tables are not mutated directly from the web layer

## Verification Layout

### Command entry points

- `npm run prove`
  Runs the canonical proof harness.
- `npm run prove:reset`
  Resets the local database and reruns proof.

### Proof scripts

- `scripts/verify-system-truth.ps1`
  Main proof entry point.
- `scripts/verify-terminal-states.ps1`
  Confirms sufficient, insufficient, and rejected terminal states through `projection.obligation_lifecycle`, including entity propagation.
- `scripts/verify-overdue-failure.ps1`
  Confirms overdue failure mutation, watchdog-aligned truth, and non-null entity attribution on overdue rows.

### SQL proof assets

- `sql/verify/08_prove_full_loop.sql`
- `sql/verify/11_prove_insufficient_proof.sql`
- `sql/verify/14_prove_rejected_path.sql`
- `sql/verify/16_prove_overdue_failure.sql`
- `sql/verify/17_overdue_failure_truth_alignment.sql`
- `sql/verify/19_entity_integrity_score.sql`
- `sql/verify/20_entity_integrity_classification.sql`
- `sql/verify/21_integrity_events.sql`
- additional `sql/verify/*` files for narrower checks

Operational baseline:

- `supabase db reset --local`
- `npm run prove`

Current proof also verifies entity propagation through lifecycle projection rows and overdue watchdog truth.
Current proof also verifies that `projection.entity_integrity_score` is populated, count-consistent, and bounded to the published `[-100, 100]` range.
Current proof also verifies that `projection.entity_integrity_classification` resolves deterministically from `governance.integrity_score_policy`.
Current proof also verifies that `projection.integrity_events` emits only the read-side failed contractual integrity events derived from classification.

## Current Structural Reality

The repo is now collapsed to one active authority path per concern:

- one executable migration tree: `supabase/migrations/`
- one external ingress authority: `supabase/functions/stripe-webhook/`
- one intake commit route: `pages/api/intake/commit.ts`
- one active repo root
- archived historical SQL moved out of active paths
- one canonical workspace-to-entity binding carried through source events, obligations, receipts, and lifecycle projection

Legal attribution is now part of kernel truth, not a later reconstruction layer.

## Mental Model

Treat the system as five layers:

1. doctrine and cleanup boundaries
2. canonical database mutation authority
3. ingress and transport wrappers
4. projections and watchdog read surfaces
5. UI and proof harness

If a change creates a second authority surface in any layer, it is drift.
