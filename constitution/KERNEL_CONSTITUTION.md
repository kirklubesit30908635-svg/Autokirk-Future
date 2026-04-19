# AutoKirk Future — Kernel Constitution

Status: Active doctrine
Authority class: Constitutional
Applies to: Kernel, projection, watchdog, runtime, UI, migrations, operations

## Purpose

This document defines the non-negotiable constitutional authority of AutoKirk Future.

AutoKirk Future is a kernel-first truth system. It does not track claimed completion. It governs durable truth about whether obligations were fulfilled, failed, or left unresolved.

This constitution exists to prevent architectural contamination, semantic drift, and unauthorized mutation pathways.

## Constitutional sentence

**If a component can change durable business truth, it is kernel or it is a violation.**

This sentence is the primary anti-drift rule for AutoKirk Future.

## Constitutional model

AutoKirk Future is protected by constitutional authority constraints, not by design preference.

The canonical lifecycle is:

`event -> obligation -> resolution -> receipt -> projection -> watchdog`

Each stage has a distinct authority boundary.

## Constitutional laws

### 1. Kernel-only mutation authority

The kernel is the sole authority permitted to change durable business truth.

No application route, runtime worker, projection, watchdog surface, UI action, script, or helper service may directly mutate canonical obligation truth outside kernel-owned paths.

### 2. No parallel mutation paths

Every truth mutation class must have a single canonical mutation path.

If two different components can open, resolve, classify, or complete the same truth object through different mutation paths, the system is in violation.

### 3. No completion without proof

An obligation is not complete because it was marked complete. It is complete only if the kernel accepts valid proof under the governing proof contract and emits the resulting receipt-backed truth.

### 4. Receipt-backed truth only

Receipts are the only valid durable proof artifacts for fulfillment, failure, or classified terminal handling.

No status flag, projection label, UI state, runtime message, or external acknowledgment may substitute for a receipt-backed truth outcome.

### 5. No semantic authority outside kernel

Truth semantics belong to the kernel.

The kernel owns:
- obligation opening rules
- obligation resolution rules
- proof validation rules
- failure classification rules
- outcome classification rules
- receipt emission rules

Projection, watchdog, runtime, UI, and external integrations may read, display, transport, or notify. They may not define or reinterpret authoritative business truth.

### 6. Projection is read-only

Projection exists to derive readable system truth from kernel-backed facts and receipts.

Projection may not:
- mutate business truth
- invent completion
- repair missing kernel truth
- classify authoritative outcomes independently of kernel-owned rules

### 7. Watchdog is visibility-only

Watchdog exists to expose explicit failure, risk, lateness, or unresolved truth surfaces.

Watchdog may not:
- mutate business truth
- resolve obligations
- classify canonical truth independently of kernel-owned rules
- write corrective truth into the system

### 8. Runtime, UI, and emitter surfaces are non-authoritative

Runtime, UI, emitters, webhooks, scripts, and transport services may submit facts, submit proof, notify operators, or render read surfaces.

They may not become alternate truth authorities.

### 9. Governed migrations only

Production schema truth may only change through governed migrations.

Manual production edits outside the migration chain are constitutional violations unless explicitly part of a documented recovery event approved at the same authority level as this constitution.

### 10. Replay-safe system evolution

Any accepted schema or mutation-path change must preserve deterministic replay and reset-safe rebuild behavior.

If the system cannot be rebuilt and verified from the canonical chain, the change is not accepted.

## Explicit system layer separation

### Kernel

Role: Sole mutation authority

Owns:
- canonical mutation functions
- proof validation
- receipt emission
- durable business truth changes

### Projection

Role: Derived truth surfaces

Owns:
- read models
- derived views
- stable external read surfaces based on kernel truth

Does not own mutation or semantics.

### Watchdog

Role: Explicit failure and risk visibility surfaces

Owns:
- overdue visibility
- unresolved visibility
- failure exposure surfaces
- external read-facing watchdog outputs

Does not own mutation or truth-setting authority.

### Runtime / UI / Emitter

Role: Submission, transport, rendering, and notification

Owns:
- fact intake
- proof submission requests
- operator interaction
- notification and emitter transport

Does not own durable business truth.

## Constitutional lock model

AutoKirk Future must be protected in seven ways:

1. Lock the constitution
2. Lock the mutation surface
3. Lock proof contracts
4. Lock migration discipline
5. Lock review gates
6. Lock protected surfaces
7. Audit drift continuously

## Protected surfaces

The following surfaces are high-friction change zones and must not be changed casually:

- kernel mutation functions
- proof validation boundaries
- receipt emission paths
- canonical projection bases
- watchdog publication surfaces
- applied migration chain
- production schema outside migrations

## Acceptance standard for any future change

A change is not acceptable unless it proves all of the following:

- it does not create a second mutation path
- it does not move semantic authority outside kernel
- it does not weaken proof-backed completion
- it does not allow projection or watchdog mutation
- it does not allow runtime truth writing
- it remains replay-safe and migration-safe
- it is verifiable from the canonical repo state

## Violation handling

If a change or runtime surface is discovered to violate this constitution, it must be treated as a system integrity issue, not a minor implementation detail.

The required response is:
1. stop expansion on the affected path
2. identify the violating authority boundary
3. restore canonical authority
4. verify the repaired path end-to-end

## Final rule

AutoKirk Future is not a status system. It is a governed truth system.

Any component that attempts to act like an alternate truth authority is contamination and must be removed or reduced to a non-authoritative role.
