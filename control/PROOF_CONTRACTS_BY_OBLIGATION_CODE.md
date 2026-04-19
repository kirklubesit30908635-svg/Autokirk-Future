# AutoKirk Future — Proof Contracts by Obligation Code

Status: Active semantic control artifact
Authority class: Kernel semantic authority
Applies to: Resolution, proof submission, receipt emission, outcome classification, projection consumption

## Purpose

This document defines how AutoKirk Future locks proof semantics.

Proof is not a generic attachment, note, or operator claim. Proof is a kernel-governed input evaluated against a canonical obligation code contract.

The purpose of this document is to prevent semantic drift, receipt dilution, and non-authoritative proof handling.

## Constitutional rule

**If a component can change durable business truth, it is kernel or it is a violation.**

The meaning of proof is durable business truth. Therefore proof semantics belong to the kernel.

## Core doctrine

Proof contracts must be defined by canonical obligation code.

Not by UI form.
Not by ad hoc workflow.
Not by route-level convenience.
Not by operator opinion.

For each canonical obligation code, the kernel owns the contract that determines whether submitted proof is:
- sufficient for fulfillment
- insufficient for fulfillment
- invalid
- explicitly classifiable as failure
- non-terminal and still unresolved

## What a proof contract must define

For each canonical obligation code, the contract must define:

1. obligation code
2. contract purpose
3. required proof shape
4. required proof fields
5. validation conditions
6. rejection conditions
7. accepted failure classes
8. resulting receipt class
9. resulting projection effect
10. idempotency and replay expectations

## Kernel semantic ownership

The kernel owns:
- required proof shape
- required proof fields
- sufficiency threshold
- invalidity threshold
- failure classification rules
- receipt emission rules
- authoritative outcome classification

Projection may derive read surfaces from kernel outcomes.
Watchdog may expose those outcomes.
Runtime and UI may collect or submit proof.
None of them may define proof semantics.

## Contract template

Each canonical obligation code should be documented using the following structure.

### Obligation code

Name:

Purpose:

Required proof shape:

Required fields:
- field name
- field type
- field requirement level
- semantic meaning

Validation conditions:
- condition
- expected interpretation
- kernel handling rule

Rejection conditions:
- condition
- rejection reason
- resulting system behavior

Accepted failure classes:
- failure class
- when it applies
- whether terminal or non-terminal

Resulting receipt class:
- receipt class emitted on fulfillment
- receipt class emitted on classified failure
- receipt class emitted on rejection, if applicable

Projection effect:
- expected lifecycle effect
- expected read model effect
- expected watchdog visibility effect

Idempotency expectations:
- replay behavior
- duplicate proof handling
- canonical duplicate outcome

## Global contract laws

### 1. No proofless completion

No obligation code may reach fulfilled truth without proof evaluated by its kernel-owned contract.

### 2. No route-owned semantics

An API route, UI surface, worker, script, or integration may not define what counts as sufficient proof.

### 3. No projection-owned semantics

Projection may not decide whether submitted evidence should have counted.
It may only expose what the kernel decided.

### 4. No watchdog-owned semantics

Watchdog may surface risk, lateness, or failure visibility.
It may not decide proof sufficiency or author terminal truth.

### 5. Rejections are not silence

If submitted proof is rejected, the system should classify that rejection explicitly according to kernel rules, not silently discard semantics into application behavior.

### 6. Failure is part of truth, not an exception to truth

A failed proof attempt is not a broken side path. It is part of the governed truth model and should produce an explicit classified system outcome as defined by the obligation code contract.

## Minimum implementation standard

A proof contract is not considered active unless all of the following are true:
- the canonical obligation code exists
- the kernel resolution path references the contract
- required proof fields are validated in kernel-owned logic
- insufficient or invalid proof cannot produce fulfilled truth
- resulting receipt class is deterministic
- projection behavior is derived from kernel outcome only

## Example placeholder section for active rollout

The following section is intentionally a placeholder until obligation-code-specific contracts are enumerated from the active repo state.

Each active canonical obligation code should be added below with full contract detail.

### TO BE COMPLETED FROM ACTIVE REPO STATE

- `unclassified`
- additional canonical obligation codes as they are formally introduced

Each addition must be grounded in the proven canonical repo/runtime path and not invented ahead of actual kernel support.

## Review gate for any proof-related change

Every proof-related change must answer:
- what obligation code does this affect?
- is the proof contract already defined?
- if changed, why does semantic authority need to change?
- does this move semantics outside kernel?
- can invalid proof still produce fulfilled truth after this change?
- what exact receipt classes result?
- what exact verification proves the contract still holds?

## Final rule

In AutoKirk Future, proof is not descriptive metadata.

Proof is a kernel-governed decision boundary that determines whether obligation truth becomes fulfillment, failure, or continued unresolved state.
