# Resolve With Insufficient Proof — Contract

## Purpose

Defines the first governed kernel resolution path where an obligation cannot be fully proven but must still be explicitly handled.

This is a deviation path.

---

## Lifecycle mapping

event ? obligation ? resolution ? receipt

This contract defines:

resolution ? receipt

---

## Resolution type

resolve_with_insufficient_proof

---

## Meaning

The obligation is NOT fully proven.

The system records:

- what was attempted
- what evidence exists
- what proof is missing
- why resolution cannot be validated

The obligation is not silently resolved.

---

## Required inputs

- obligation_id (uuid)
- actor_id (uuid)
- reason (text)
- evidence_present (jsonb)

---

## Required checks

- actor must be a member of workspace
- obligation must exist
- obligation must not already be resolved
- evidence must be recorded (even if partial)

---

## Kernel actions

1. assert membership
2. validate obligation state
3. emit resolution event (deviation)
4. mark obligation as resolved_with_insufficient_proof
5. emit receipt

---

## Receipt requirements

Receipt must permanently include:

- obligation_id
- resolution_type = resolve_with_insufficient_proof
- actor_id
- reason
- evidence_present
- proof_status = insufficient
- failed_checks (explicit list)
- rule_version

---

## Constraints

- No silent resolution
- No UI-driven interpretation
- No mutation outside kernel path
- No overwriting of prior truth
- No re-interpretation later

---

## Binary review requirement

This contract must pass:

- mutation authority
- construction constraints
- proof guarantees

---

## Status

ACTIVE TARGET
