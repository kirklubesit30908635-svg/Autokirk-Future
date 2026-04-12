# Resolution Execution Verification

## Purpose

Defines how to verify that every resolution execution satisfies
the canonical kernel lifecycle and proof guarantees.

---

## Canonical lifecycle

Every execution must produce:

1. event
2. obligation transition
3. receipt
4. idempotency record

---

## Verification checklist

### Event

- event exists in ledger.events
- event_type matches resolution_type
- event linked to obligation_id

PASS / FAIL

---

### Obligation

- obligation status = resolved
- resolution_type matches event
- proof_status matches expected mapping
- resolved_at is set

PASS / FAIL

---

### Receipt

- receipt exists
- receipt linked to obligation_id
- receipt contains:
  - resolution_type
  - reason
  - evidence_present
  - failed_checks
  - proof_status
  - rule_version

PASS / FAIL

---

### Idempotency

- idempotency record exists
- idempotency_key stored
- event_id + receipt_id linked
- input_hash present

PASS / FAIL

---

### Replay behavior

Test:

- re-run same request with same idempotency_key

Expected:

- no new event
- no new receipt
- identical response
- replayed = true

PASS / FAIL

---

### Mismatch protection

Test:

- reuse idempotency_key with different input

Expected:

- HARD FAIL
- IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_INPUT

PASS / FAIL

---

## Result

Execution is valid only if all sections pass.

---

## Status

ACTIVE
KERNEL-BOUND
ENFORCED
