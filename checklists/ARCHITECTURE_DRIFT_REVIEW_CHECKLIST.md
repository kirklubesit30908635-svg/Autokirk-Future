# AutoKirk Future — Architecture Drift Review Checklist

Status: Active review gate
Authority class: Change control checklist
Applies to: PRs, migrations, SQL edits, runtime changes, UI changes, scripts, integration work

## Purpose

This checklist exists to stop contamination and drift before changes are accepted.

A proposed change is not evaluated only on whether it works. It is evaluated on whether it preserves AutoKirk Future constitutional authority.

## Constitutional sentence

**If a component can change durable business truth, it is kernel or it is a violation.**

## Required review mode

Every review touching AutoKirk Future truth surfaces must be performed in this order:

1. Active path
2. Proven behavior
3. Canonical authority
4. Root cause
5. Exact change
6. Verify step
7. Do not touch

If the reviewer or contributor cannot complete these sections clearly, the change is not ready.

## Review checklist

### A. Active path

- What exact repo path is active?
- What exact files, functions, or migrations are being changed?
- Is the working tree clean and understood?
- Is the branch state known?

### B. Proven behavior

- What behavior is proven true in the current system?
- What runtime or schema evidence proves it?
- Is the current issue actually reproduced, or only assumed?

### C. Canonical authority

- What exact truth surface is affected?
- What is the canonical kernel authority for that surface?
- Is this change operating inside the canonical path or creating another one?

### D. Root cause

- What is the specific defect, constraint, or requirement?
- Is the issue in kernel, projection, watchdog, migration chain, runtime transport, or UI?
- Could this be a read-surface problem instead of a truth problem?

### E. Exact change

- What is the smallest acceptable change?
- Does it preserve kernel-only mutation authority?
- Does it preserve kernel-owned semantic authority?
- Does it avoid projection mutation?
- Does it avoid watchdog mutation?
- Does it avoid runtime truth writing?
- Does it avoid direct production schema edits?

### F. Verify step

- What exact command, query, or test proves the change worked?
- What proves there is still only one mutation path?
- What proves invalid proof cannot produce fulfilled truth?
- What proves projection and watchdog remain read-only/visibility-only?
- What proves reset or replay safety still holds?

### G. Do not touch

- What surfaces must remain unchanged during this work?
- Are any protected migrations involved?
- Are kernel mutation functions being avoided unless explicitly required?
- Is deferred runtime or stash content being kept isolated?

## Mandatory constitutional gates

A change must be rejected if it does any of the following:

- introduces a second mutation path
- moves semantic authority outside kernel
- allows completion without proof
- allows projection to repair or invent truth
- allows watchdog to mutate truth
- allows runtime or UI to write durable truth directly
- bypasses governed migrations for production schema changes
- weakens replay or reset safety

## Projection and watchdog gate

If a change touches projection or watchdog surfaces, reviewer must verify:
- projection remains derived only from kernel-backed truth
- watchdog remains a visibility surface only
- neither surface authors canonical outcome semantics independently
- dependency-aware migration handling is explicit
- no CASCADE shortcut is used unless constitutional authority explicitly changed, which should be presumed false

## Proof contract gate

If a change touches resolution or proof behavior, reviewer must verify:
- the affected canonical obligation code is named
- the proof contract is defined or updated explicitly
- proof validity remains kernel-owned
- rejection handling is explicit
- resulting receipt class remains deterministic
- projection effects are derived, not authored

## Migration gate

If a change touches the migration chain, reviewer must verify:
- no manual production schema shortcut is being relied on
- migration is replay-safe on fresh reset
- projection dependencies are explicitly dropped and recreated in correct order
- applied historical migrations are not casually rewritten
- repair work is documented when history drift is involved

## Runtime and UI gate

If a change touches runtime, UI, emitter, webhook, or integration surfaces, reviewer must verify:
- the surface submits facts or proof but does not author truth
- no hidden helper path is created
- no truth repair occurs outside kernel
- operator-facing convenience does not weaken proof semantics

## Periodic drift audit checklist

At regular checkpoints, inspect:
- all kernel mutation functions
- all grants affecting truth tables or mutation functions
- all routes or scripts that can trigger truth changes
- all projection dependencies on canonical views
- all watchdog publication surfaces
- all pending stashes or branches carrying mixed schema/runtime work
- all recent migrations for constitutional violations

Ask at each audit:
- is there still exactly one canonical path per mutation class?
- is any component acting like hidden semantic authority?
- has any runtime surface become truth-authoritative?
- can fulfilled truth still happen only through kernel-validated proof?

## Reviewer decision standard

A change should be approved only if it is:
- constitutionally aligned
- minimal
- inspectable
- replay-safe
- evidence-backed
- free of alternate authority paths

## Final rule

The purpose of review is not to confirm that a change is clever, fast, or convenient.

The purpose of review is to confirm that AutoKirk Future remains a kernel-first truth system and has not silently drifted into a multi-authority system.
