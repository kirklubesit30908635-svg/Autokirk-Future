# AutoKirk Future — Canonical Mutation Authority

Status: Active control artifact
Authority class: Kernel control map
Applies to: All code, SQL, runtime, integrations, UI, scripts, migrations

## Purpose

This document defines the canonical mutation authority map for AutoKirk Future.

Its purpose is to prevent unauthorized mutation, parallel truth pathways, helper-path drift, and runtime contamination.

If a truth mutation is not listed here as canonical authority, it is forbidden by default.

## Constitutional rule

**If a component can change durable business truth, it is kernel or it is a violation.**

## Canonical mutation doctrine

Durable business truth includes any change that can alter the authoritative state of:
- events as accepted source facts
- obligations as opened requirements
- obligation resolutions
- receipt-backed proof outcomes
- terminal failure or fulfillment classifications
- authoritative linkage between these objects

No component outside kernel-owned authority may perform these mutations.

## Authority map requirements

For every mutation class, the system must define:
- mutation class
- canonical authority
- allowed callers
- truth object affected
- forbidden alternatives
- verification surface

## Canonical mutation classes

### 1. Event intake into canonical obligation path

Mutation class:
- convert accepted source fact or event into canonical obligation-opening path

Canonical authority:
- kernel-owned event-to-obligation bridge only
- current active path should remain whatever repo state proves as canonical, not whatever is convenient

Allowed callers:
- governed ingest or API submission surfaces that delegate into the canonical kernel path

Truth object affected:
- obligation opening eligibility and resulting obligation-linked truth

Forbidden alternatives:
- direct application writes into core obligation tables
- runtime services opening obligations directly
- projection-driven obligation creation
- scripts bypassing canonical kernel entry path

Verification surface:
- prove single path from submitted fact to opened obligation through canonical repo/runtime inspection

### 2. Obligation open authority

Mutation class:
- opening a canonical obligation

Canonical authority:
- kernel open function only

Allowed callers:
- approved ingest bridge or approved API surface that delegates to kernel open authority

Truth object affected:
- canonical obligation creation and opening-linked truth

Forbidden alternatives:
- direct inserts into obligation tables
- helper RPCs performing parallel open logic
- runtime job opening obligations without kernel delegation

Verification surface:
- repo inspection for direct inserts or alternate open functions
- reset-safe execution proving one open path only

### 3. Resolution authority

Mutation class:
- resolution attempt against an existing obligation

Canonical authority:
- kernel resolution authority only

Allowed callers:
- approved resolution API surface that submits proof into kernel validation path

Truth object affected:
- obligation resolution outcome
- resulting status truth as derived from accepted or rejected proof

Forbidden alternatives:
- UI marking complete directly
- runtime worker resolving obligations directly
- scripts writing terminal states into obligation rows
- projection logic inferring terminal completion as truth

Verification surface:
- repo inspection for direct updates to truth tables
- execution proof that resolution only occurs through kernel path

### 4. Proof validation authority

Mutation class:
- determine whether submitted proof is sufficient, insufficient, invalid, or classified failure under the governing contract

Canonical authority:
- kernel proof contract enforcement only

Allowed callers:
- canonical resolution surface only

Truth object affected:
- authoritative fulfillment or failure classification

Forbidden alternatives:
- application-layer proof validation that sets truth
- projection-based truth classification
- UI logic that decides proof sufficiency
- runtime retries that bypass proof rejection logic

Verification surface:
- proof contract definitions aligned to canonical obligation code
- runtime proof that invalid proof cannot produce fulfillment truth

### 5. Receipt emission authority

Mutation class:
- emit durable receipt-backed proof artifact tied to kernel-accepted outcome

Canonical authority:
- kernel receipt emission path only

Allowed callers:
- kernel resolution or canonical system-controlled authority boundaries only

Truth object affected:
- receipt-backed outcome evidence
- durable proof linkage

Forbidden alternatives:
- runtime-generated substitute receipts
- UI-only completion records
- projection-generated completion artifacts

Verification surface:
- repo inspection of receipt creation paths
- runtime idempotency proof

### 6. Failure classification authority

Mutation class:
- classify failure, overdue state, invalid proof state, or explicit terminal failure classes

Canonical authority:
- kernel-owned semantic authority for authoritative classifications
- projection/watchdog may expose those facts but may not author them independently

Allowed callers:
- kernel-controlled evaluation path only

Truth object affected:
- authoritative outcome class

Forbidden alternatives:
- projection inventing failure classes
- watchdog deciding terminal truth
- runtime assigning outcome semantics outside kernel

Verification surface:
- inspect classification ownership in SQL/code
- prove watchdog is exposing, not authoring

## Allowed caller doctrine

Allowed callers are not alternate authorities. They are transport surfaces that delegate to canonical kernel authority.

A caller is allowed only if:
- it does not reimplement kernel logic
- it does not reinterpret proof semantics
- it does not persist truth directly
- it delegates into the canonical path

## Forbidden mutation patterns

The following patterns are forbidden unless explicitly reclassified by constitutional change:

- direct table writes to obligation truth from app code
- direct table writes to obligation truth from scripts
- alternate open or resolve helper paths
- projection-layer truth repair
- watchdog-triggered truth mutation
- runtime retry logic that changes truth outside kernel
- UI-side truth completion
- manual production truth edits

## Mutation authority review procedure

Every change touching truth must answer:
- what exact truth object is affected?
- what is the canonical mutation class?
- what is the canonical authority?
- does this introduce a second path?
- does it shift semantic ownership out of kernel?
- how is the single-path guarantee verified?

If these cannot be answered clearly, the change is not ready.

## Repo operating rule

Before editing any code or SQL that may affect truth mutation, the contributor must identify:
- active repo path
- canonical authority being changed
- root cause requiring the change
- exact forbidden alternatives being avoided
- exact verification step after change

## Final rule

AutoKirk Future must always be reducible to a small, inspectable mutation map.

If the mutation authority map becomes ambiguous, broad, duplicated, or hidden in runtime helpers, the system is already drifting.
