# Resolve With Insufficient Proof — Idempotency Contract

## Purpose

Defines how the kernel prevents duplicate mutation when the same resolution request is executed more than once.

This contract ensures:

- no duplicate events
- no duplicate receipts
- no double resolution of the same obligation

---

## Idempotency key

Each request must include:

- idempotency_key (text)

This key represents:

"this exact intent to resolve this obligation under these conditions"

---

## Idempotency scope

The key is scoped to:

- obligation_id
- resolution_type = resolve_with_insufficient_proof

---

## Required behavior

### First execution

- event is created
- obligation is updated
- receipt is created
- response is returned

### Subsequent execution with same idempotency_key

- no new event is created
- no new receipt is created
- no new mutation occurs
- the original result is returned

---

## Required storage

The system must store:

- idempotency_key
- obligation_id
- receipt_id
- event_id
- created_at

---

## Failure conditions

The system must fail if:

- the same idempotency_key is used with different inputs
- the obligation is already resolved under a different idempotency_key

---

## Constraints

- Idempotency must be enforced inside the kernel
- No UI or route-level idempotency is allowed to define truth
- Idempotency must not rely on timing assumptions
- Idempotency must not allow silent duplicate mutation

---

## Review requirement

This contract must pass:

- mutation authority
- construction constraints
- proof guarantees

---

## Status

ACTIVE TARGET
