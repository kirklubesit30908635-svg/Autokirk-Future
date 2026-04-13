# Resolve With Insufficient Proof — RPC Contract

## Purpose

Defines the single governed RPC surface for the first deviation path:

`resolve_with_insufficient_proof`

This contract exists so the SQL implementation follows one mutation path only.

---

## RPC name

`api.resolve_with_insufficient_proof`

---

## Mutation rule

This RPC is the only allowed mutation path for this deviation.

No helper, route, script, UI action, or direct table write may create equivalent kernel truth outside this RPC.

---

## Inputs

- p_obligation_id uuid
- p_actor_id uuid
- p_reason text
- p_evidence_present jsonb
- p_failed_checks jsonb
- p_rule_version text

---

## Required validations

The RPC must fail if any of the following are false:

- actor is a valid member of the workspace
- obligation exists
- obligation is not already resolved
- reason is present
- evidence_present is present
- failed_checks is present
- rule_version is present

---

## Required kernel actions

In order:

1. assert membership
2. load obligation
3. validate obligation state
4. emit deviation event
5. update obligation state to `resolved_with_insufficient_proof`
6. emit receipt using locked receipt contract
7. return stable result payload

---

## Required result payload

The RPC result must include:

- ok
- obligation_id
- resolution_type
- proof_status
- receipt_id
- rule_version

---

## Result semantics

### Success means:
- the governed path executed
- proof insufficiency was made explicit
- receipt was emitted
- the obligation was not silently treated as ordinary proof-complete resolution

### Failure means:
- no equivalent kernel truth was partially written outside the governed path

---

## Constraints

- Single governed mutation path only
- No silent fallback
- No direct table helper bypass
- No UI-dependent mutation logic
- No projection-layer truth creation

---

## Review requirement

This RPC must pass:

- `checklists\deviation_001_binary_review.md`
- `constitution\BINARY_REVIEW_STANDARD.md`
- `constitution\AUTHORITY_SUBSTRATE_SCOPE_DECISION.md`

---

## Status

ACTIVE TARGET
