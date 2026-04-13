# AutoKirk Future — Canonical System State

---

## 1. Identity

AutoKirk Future is a new, clean, canonical build.

- `autokirk-future` = ONLY active build root
- `autokirk-kernel` = reference-only (DO NOT BUILD HERE)
- No legacy structure is implicitly valid
- Nothing from old repo is canonical unless re-approved

---

## 2. Repo Root (Confirmed)

C:\Users\chase kirk\autokirk-future

Structure:

- constitution
- control
- spine
- checklists
- receipts
- signals
- ui
- reference

---

## 3. Core Doctrine

System is kernel-first.

Canonical lifecycle:

event ? obligation ? resolution ? receipt

Rules:

- Kernel = ONLY mutation authority
- Watchdog = read-only (signals only)
- Learning = advisory only
- UI = projection only

No exceptions.

---

## 4. Build Sequence (LOCKED)

1. constitution
2. checklist
3. RPC
4. receipt
5. signals
6. UI

Rule:
If it does not strengthen the lifecycle, it does not enter the build.

---

## 5. Current Phase

- Doctrine-first
- Spine construction
- Single-path execution
- No UI expansion
- No feature expansion
- No parallel work

---

## 6. Canonical Spine (Current State)

Location:

spine\migrations

Files created:

0001_extensions.sql
- pgcrypto
- uuid-ossp

0002_schemas.sql
- core
- registry
- ledger
- ingest
- api
- governance
- receipts
- signals
- knowledge

0003_workspace_members.sql
- canonical membership substrate
- (workspace_id, user_id) unique

0004_membership_guards.sql
- core.is_member()
- core.assert_member()

---

## 7. Known Issue (CRITICAL)

Missing dependency:

- core.workspaces table does NOT exist yet
- workspace_members depends on it logically

This must be corrected BEFORE further expansion.

---

## 8. Next Required Correction

Insert:

0003_workspaces.sql

Then renumber:

0003_workspace_members.sql ? 0004
0004_membership_guards.sql ? 0005

No further migrations until this is fixed.

---

## 9. First Enforcement Artifact

Checklist created:

checklists\deviation_001_binary_review.md

Purpose:

- Binary (pass/fail) gate for kernel slices
- Blocks invalid mutation paths
- Enforces:
  - single RPC path
  - no UI-driven truth
  - permanent receipt meaning

Rule:

ANY "No" = build is blocked

---

## 10. Active Target

First real kernel slice:

resolve_with_insufficient_proof

This must:

- pass binary checklist
- use single governed RPC
- emit permanent receipt
- explicitly encode proof insufficiency

---

## 11. Supabase Context

Project exists:

https://aiuicbyufelqdeiwhmyi.supabase.co

Usage rules:

- Local = migration proof
- Hosted = environment target
- Do not mix runtime work with spine work

---

## 12. Hard Constraints

DO NOT:

- build in autokirk-kernel
- copy old migrations blindly
- introduce multiple mutation paths
- allow UI to define truth
- add features before spine is correct
- run `npm audit fix --force`
- continue runtime work before kernel is valid

---

## 13. Execution Rule

All work must follow:

event ? obligation ? resolution ? receipt

If a step does not map to this:

? it is not part of AutoKirk Future

---

## 14. Current State Summary

You are now:

- in a clean repo
- with a real spine
- with enforced structure
- with first checklist
- with first authority boundary

This is the first stable build state.

---

## 15. Next Exact Step

Fix spine ordering:

1. create core.workspaces
2. correct migration numbering
3. stop
4. verify spine integrity

Then:

? define first RPC

---

## 16. Do Not Touch

- UI
- Next.js
- Supabase client
- additional migrations
- old repo logic

Until spine is corrected.

---

END OF STATE
