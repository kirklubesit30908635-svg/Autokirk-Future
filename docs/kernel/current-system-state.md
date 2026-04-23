# Current System State

## Status

Current governed system boundary for the active AutoKirk Future phase.

This document freezes what is true now.
It is not a backlog, design exploration, or future-state proposal.

## Canonical Lifecycle

Canonical lifecycle:

`source event -> obligation -> resolution -> receipt`

This lifecycle is kernel-authoritative.
All durable truth mutation must preserve this order and meaning.

## Current Integrity Stack

The active integrity chain is:

`projection.obligation_lifecycle -> projection.entity_integrity_score -> projection.entity_integrity_classification -> projection.integrity_events -> projection.integrity_watchdog_candidates`

Meaning:

- `projection.obligation_lifecycle` is the canonical read model for lifecycle truth
- `projection.entity_integrity_score` is the raw proof-backed reliability score per entity
- `projection.entity_integrity_classification` is the policy-defined interpretation layer
- `projection.integrity_events` is a deterministic current-state consequence projection for failed contractual classifications
- `projection.integrity_watchdog_candidates` is the contractual-only observational consumer slice derived from `projection.integrity_events`

## What Is Authoritative

The following surfaces are authoritative for durable truth:

- `supabase/migrations/`
- `api.ingest_event_to_obligation()`
- `api.commit_intake_candidate()`
- `api.resolve_obligation()`
- `api.resolve_with_proof()`
- `api.resolve_with_insufficient_proof()`
- `api.resolve_rejected()`
- `api.resolve_overdue_obligations()`
- `kernel.open_obligation_internal()`
- `kernel.resolve_obligation_internal()`
- `core.obligations`
- `ingest.source_events`
- `receipts.receipts`
- `ledger.events`

Rule:

- app code calls `api.*`
- `kernel.*` mutates truth
- projections observe truth
- delivery tracking does not redefine lifecycle truth

## What Is Projection Only

The following surfaces are read models, not mutation authority:

- `projection.obligation_lifecycle`
- `projection.entity_integrity_score`
- `projection.entity_integrity_classification`
- `projection.integrity_events`

Projection doctrine:

- projections derive from authoritative truth
- projections may be recomputed
- projections must not be treated as write surfaces
- `projection.integrity_events` is not append-only event history
- deterministic rows may reappear after recovery and later failure without implying replay semantics

## What Is Observational Only

The following surfaces are observational only:

- `projection.integrity_events`
- `projection.integrity_watchdog_candidates`
- `public.overdue_failure_emission_candidates`
- `control.watchdog_emissions`
- `pages/api/watchdog/failed-obligations.ts`
- `pages/api/watchdog/emit-overdue-webhook.ts`
- `pages/api/integrations/watchdog-receiver.ts`

Observational doctrine:

- these surfaces expose state, consequence candidates, or delivery tracking
- they do not create contract consequences by themselves
- they do not mutate kernel truth by observation alone
- watchdog delivery state is separate from lifecycle truth

## What Is Explicitly Not Implemented Yet

The following are not implemented as active system behavior:

- automatic contractual enforcement driven by integrity classifications
- internal-action consumers sourced from `projection.integrity_events`
- customer-facing trust grades derived directly from raw integrity score
- replay, delivery, or append-only event semantics on `projection.integrity_events`
- any second mutation authority outside the canonical `api.* -> kernel.*` path

## Current Proof Boundary

The active proof harness verifies:

- terminal lifecycle resolution states
- overdue failure mutation and watchdog-aligned truth
- entity propagation through lifecycle truth
- bounded entity integrity scoring
- deterministic integrity classification through policy
- failed contractual current-state rows in `projection.integrity_events`
- contractual-only rows in `projection.integrity_watchdog_candidates`

Operational proof entry points:

- `npm run prove`
- `npm run prove:reset`

## Expansion Rule

Do not widen behavior by implication.

If a new consumer, enforcement path, or action mode is added, update all of the following together:

- executable schema or function authority
- proof harness
- doctrine docs
- consumer contract language
