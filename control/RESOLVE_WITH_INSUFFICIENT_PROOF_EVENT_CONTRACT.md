# Resolve With Insufficient Proof — Event Contract

## Purpose

Defines the permanent event meaning emitted when the governed deviation path
`resolve_with_insufficient_proof` is executed.

This event is part of the canonical lifecycle:

event ? obligation ? resolution ? receipt

This contract locks the event meaning so it can be used later by watchdog,
reporting, and projection layers without reinterpretation.

---

## Event type

`resolve_with_insufficient_proof`

---

## Event meaning

This event means:

- a governed kernel path was invoked
- a specific obligation was targeted
- the actor was inside the workspace boundary
- proof insufficiency was made explicit
- the system did not silently treat the action as ordinary proof-complete resolution

This event does NOT mean:

- proof was complete
- the obligation was resolved through the ordinary path
- UI language can redefine the event later

---

## Required event payload

The event must permanently include:

- event_id
- obligation_id
- workspace_id
- actor_id
- event_type = resolve_with_insufficient_proof
- reason
- evidence_present
- failed_checks
- rule_version
- emitted_at

---

## Constraints

- Permanent meaning only
- No UI-dependent interpretation
- No helper-bypass emission
- No projection layer may redefine the event
- Event meaning must remain stable if UI wording changes later

---

## Status

LOCKED TARGET
