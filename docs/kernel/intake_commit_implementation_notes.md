# Intake Commit Implementation Notes

## Proven Canonical Path

Visual Intake Face must NOT call kernel.open_obligation_internal directly.

The only valid entry path is:

candidate
→ explicit operator commit
→ api.ingest_event_to_obligation
→ ingest.source_events
→ kernel.open_obligation_internal
→ core.obligations

## Why

1. ingest.source_events provides:
   - idempotency anchor
   - replay protection
   - canonical event identity

2. kernel.open_obligation_internal depends on source_event_id

3. Skipping ingest breaks:
   - replay safety
   - event traceability
   - system integrity

## Required Inputs (mapped to ingest_event_to_obligation)

commit_intake_candidate must produce:

- workspace_id → p_workspace_id
- actor_user_id → p_actor_id
- source_system → 'intake'
- source_event_key → deterministic key from intake signal
- source_event_type → 'intake_commit'
- payload → structured intake data
- occurred_at → optional

## Deterministic Event Key

source_event_key must be stable for idempotency.

Example:
intake:{workspace_id}:{signal_id}

## Commit Responsibility

commit_intake_candidate is responsible for:

- validating anchors
- constructing event payload
- calling api.ingest_event_to_obligation
- returning canonical result

It is NOT responsible for:

- opening obligations directly
- writing core tables
- emitting receipts
- mutating integrity

## First Slice Scope

This slice intentionally excludes:

- object layer
- UI staging persistence
- integrity scoring
- watchdog integration

