# Canonical Resolution Surface State

## Current state

AutoKirk Future now exposes a canonical public resolution surface:

- api.resolve_obligation

This surface routes governed resolution intent into:

- kernel.resolve_obligation_internal

The kernel remains the sole mutation authority.

---

## Resolution types currently supported

- resolve_with_proof
- resolve_with_insufficient_proof
- resolve_rejected

Each type maps to a governed proof status and resolves through the same kernel mutation path.

---

## Canonical lifecycle

Every valid resolution path now follows:

1. event emitted
2. obligation transitioned
3. receipt emitted
4. idempotency sealed
5. replay checked against intent equivalence

---

## Authority model

### Public layer
- api.resolve_obligation
- api.resolve_with_proof
- api.resolve_with_insufficient_proof
- api.resolve_rejected

These are projection surfaces only.

### Kernel layer
- kernel.resolve_obligation_internal

This is the only mutation authority.

---

## Proof guarantees

Replay protection is enforced by:

- idempotency_key
- obligation match
- input_hash equivalence

This prevents:
- duplicate mutation
- cross-obligation replay
- same-key different-intent reuse

---

## Status

ACTIVE
CANONICAL
KERNEL-ALIGNED
