# AUTOKIRK — WATCHDOG DOCTRINE

**Status:** Canonical doctrine artifact
**Scope:** Watchdog observation, emission, delivery, retry, and exhaustion behavior
**Authority:** Subordinate to `AUTOKIRK_KERNEL_ARCHITECTURE_PRINCIPLES.md`

---

## Core Rule

The watchdog observes. The kernel governs.

The watchdog is not a second kernel, not an operator, and not an emergency authority.

It exists to externalize kernel-derived risk and delivery state. It does not create truth, rewrite truth, close truth, or override truth.

---

## Canonical Flow

```text
kernel state -> projection candidates -> watchdog emission -> delivery attempts -> delivered / failed / exhausted
```

A watchdog event is not truth.

A watchdog emission is not a receipt.

A watchdog delivery is not obligation resolution.

A watchdog failure does not mutate kernel state.

Only the kernel resolves.

Only receipts close.

Only governed API paths mutate.

---

## Allowed Behavior

The watchdog may:

- read projection views
- detect overdue or failure candidates
- create watchdog emissions through `api.create_watchdog_emission`
- claim emissions through `api.claim_watchdog_emission`
- record delivery attempts through `api.record_watchdog_attempt`
- mark governed delivery lifecycle states under API constraints
- retry delivery until bounded exhaustion
- expose delivery state to operators through projections

---

## Forbidden Behavior

The watchdog may not:

- write directly to kernel tables
- edit obligations
- issue receipts
- resolve obligations
- delete events
- mutate projections
- act as an operator
- bypass `api.*` functions
- hold privileged direct-write roles
- quarantine, suspend, erase, or correct kernel truth
- gain emergency authority without a concrete kernel-risk scenario and sealed founder amendment

---

## Canonical Surfaces

The watchdog observes through derived projection surfaces, including:

- `public.overdue_failure_emission_candidates`
- `public.watchdog_delivery_candidates`

The watchdog writes only through governed API functions, including:

- `api.create_watchdog_emission`
- `api.claim_watchdog_emission`
- `api.record_watchdog_attempt`

The watchdog delivery lifecycle is represented in:

- `control.watchdog_emissions`

---

## Delivery States

Canonical delivery states:

- `pending`
- `delivered`
- `failed`
- `exhausted`

Delivery state is notification state. It is not obligation state.

`delivered` means the watchdog notification completed.

`failed` means the current delivery attempt failed.

`exhausted` means bounded retry attempts have been consumed.

None of these states resolve, reject, reopen, or modify an obligation.

---

## Retry and Exhaustion Discipline

Watchdog delivery must be bounded.

The default delivery model uses lease-based concurrency and a maximum attempt count, with `max_attempts` defaulting to 5 unless a later governed policy changes it.

Retries may change delivery state inside `control.watchdog_emissions` only through governed API paths.

Exhaustion is a delivery outcome, not a kernel outcome.

---

## Projection Discipline

Watchdog candidates are derived from kernel state.

Projection rows do not hold truth.

Projection rows must not become mutation authority.

Editing, refreshing, or correcting a watchdog projection must never affect kernel state.

If a projection becomes materialized, it must satisfy Principle 8 of the Kernel Architecture Principles: projections derive; they never hold.

---

## Operator Boundary

The watchdog cannot act on behalf of an operator without a governed proposal or authorized operator action.

If a future workflow requires operator action, the watchdog may surface the candidate, but the operator or authorized governance path must approve the action.

The watchdog may notify. It may not decide.

---

## AI Boundary

AI may propose watchdog-related actions only through the governed proposal path.

AI may not create watchdog emissions directly unless routed through authorized `api.*` surfaces and policy gates.

AI may not use watchdog outputs as authority to mutate obligations, receipts, or ledger events.

---

## Emergency Authority

Watchdog emergency authority is deferred indefinitely.

It may be introduced only if all of the following are true:

1. A concrete kernel-risk scenario is defined.
2. A sealed founder doctrine amendment authorizes the authority.
3. The authority preserves receipt integrity, append-only history, tenant isolation, and auditability.
4. The implementation routes through governed API or kernel-approved paths.

Until then, watchdog authority remains observational and delivery-bound only.

---

## Non-Negotiable Rules

1. Watchdog observes; kernel governs.
2. Watchdog emissions are notification artifacts, not truth artifacts.
3. Watchdog delivery states are not obligation states.
4. No watchdog path may directly mutate `core.*`, `ledger.*`, `receipts.*`, or projection truth.
5. No watchdog path may issue or suppress a receipt.
6. No watchdog path may resolve or reject an obligation.
7. No watchdog path may bypass governed `api.*` functions.
8. No emergency authority exists without sealed founder amendment.
9. Projection candidates derive from kernel truth and never hold independent truth.
10. If a watchdog feature weakens any kernel principle, it does not merge.

---

## Cross-References

- `AUTOKIRK_KERNEL_ARCHITECTURE_PRINCIPLES.md` — Principle 6 and Principle 8 are controlling.
- `AUTOKIRK_CURRENT_STATE_2026-05-08.md` — current verified watchdog surface and delivery discipline.
- `AUTOKIRK_DOCTRINE_AMENDMENT_2026-05-08.md` — emergency authority remains deferred; universal product doctrine remains controlling.

---

SEALED WATCHDOG DOCTRINE
