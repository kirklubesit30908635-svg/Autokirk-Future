# Resolve With Insufficient Proof — Receipt Contract

## Purpose

Defines the permanent receipt meaning for the first governed deviation path:

`resolve_with_insufficient_proof`

This contract locks what the receipt means so it never has to be reinterpreted later.

---

## Receipt meaning

This receipt means:

- an obligation existed
- a governed kernel path was used
- available evidence was recorded
- proof was insufficient
- the insufficiency was made explicit
- the system did not silently treat the obligation as fully proven

This receipt does NOT mean:

- proof was complete
- the obligation was validly proven in the ordinary path
- UI wording can redefine the result later

---

## Receipt payload requirements

The receipt must permanently contain:

- receipt_id
- obligation_id
- workspace_id
- actor_id
- resolution_type = resolve_with_insufficient_proof
- reason
- evidence_present
- proof_status = insufficient
- failed_checks
- rule_version
- emitted_at

---

## Field meaning

### obligation_id
The obligation this deviation receipt refers to.

### workspace_id
The workspace boundary in which the action occurred.

### actor_id
The operator identity responsible for invoking the governed path.

### resolution_type
Must be exactly:

`resolve_with_insufficient_proof`

### reason
Human-readable explanation for why ordinary proof was not sufficient.

### evidence_present
The evidence actually available at time of action, even if incomplete.

### proof_status
Must be exactly:

`insufficient`

### failed_checks
Explicit list of checks that did not pass.

### rule_version
Version of the governing binary review / contract rule applied to this receipt.

### emitted_at
Timestamp the kernel emitted the receipt.

---

## Constraints

- Permanent meaning only
- No UI-dependent interpretation
- No silent softening
- No later overwrite of receipt meaning
- No projection layer may redefine proof insufficiency

---

## Review rule

A receipt emitted under this contract fails review if:

- proof insufficiency is not explicit
- failed checks are omitted
- rule version is missing
- the receipt could later be mistaken for a normal valid resolution

---

## Status

LOCKED TARGET
