# Intake Commit Boundary

## Purpose
Define the first canonical kernel slice for the Visual Intake Face.

This file exists to prevent drift.
UI may change.
Face vocabulary may change.
This boundary may not.

## Why this slice is first
The Visual Intake Face is an intake and conversion surface.
It is not a second truth engine.
Nothing may cross from candidate state into governed obligation state without explicit operator commit.

This is the first kernel touchpoint for the face.

## Canonical Rule
A Visual Intake signal may become governed only through a single explicit commit path.

No:
- auto-promotion
- background obligation creation
- silent mutation
- UI-defined truth
- direct writes to core tables

## Boundary
Left of boundary:
- intake signals
- review state
- linked work
- low-confidence proposals
- candidate proposals

These are surface-only and erasable.

Right of boundary:
- acknowledged object
- opened obligation
- later resolution
- receipt
- integrity impact

These are kernel-governed.

## Required Kernel Guarantees
1. All mutations route through api.* SECURITY DEFINER functions.
2. No direct insert/update into core.objects or core.obligations from the face.
3. Obligation mutations must route through api.append_event_v1.
4. Signals remain observational only.
5. Tenant isolation remains workspace_id scoped.
6. Commit must require explicit operator action.
7. Commit must fail closed if required anchors are missing.

## First Slice
The first kernel slice for this face is:

candidate -> explicit commit -> object resolution -> obligation open

Not:
- inbox UI
- drag/drop staging
- AI clarification loop
- integrity visualization
- command integration

Those come later.

## Commit Inputs
The commit path must accept enough input to open a governed obligation without invention.

Minimum conceptual inputs:
- workspace_id
- actor_user_id
- object reference or object-create payload
- obligation type
- triggering intent
- source signal reference
- optional operator note

## Commit Outcomes
Successful commit must produce:
1. governed object resolution
2. governed obligation open
3. append-only ledger event
4. stable identifiers returned to caller

It must not produce:
- receipt
- resolution
- proof completion
- integrity score mutation directly

Those happen later in lifecycle.

## Open Questions To Resolve In SQL
1. Is object acknowledgment always required before obligation open?
2. Does the commit RPC wrap acknowledge + open in one governed function?
3. What is the canonical event type emitted for intake-origin obligation creation?
4. What exact anchor completeness is required at commit time?
5. What is the failure contract returned to the face?

## Non-Negotiable
If the face cannot commit through a single governed kernel path, the face is not ready.

