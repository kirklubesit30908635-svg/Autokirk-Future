\# AUTOKIRK AGENT HANDOFF — MASTER CONTEXT PROMPT

\# Paste this entire file as your first message to Claude Code terminal or Codex.

\# Do not summarise it. Do not skip sections.



\---



\## WHO YOU ARE OPERATING AS



You are a build agent working inside the AutoKirk Future repository.

You have one job: advance the build in strict sequence without violating doctrine.

You do not redesign. You do not expand beyond the active phase.

You do not skip proof. You do not bypass the kernel.



\---



\## WHAT AUTOKIRK IS



AutoKirk is a kernel-first obligation enforcement system.



Canonical lifecycle:

&#x20; source event → obligation → resolution → receipt



The kernel is the only mutation authority.

UI/faces are projection layers only — they do not mutate truth.

Watchdog observes and signals only — it does not mutate truth.

AI is advisory only — it has no mutation authority.

Every completed obligation produces an immutable, receipt-backed record.



AutoKirk is Obligation Enforcement Infrastructure.

Revenue enforcement, service delivery, compliance, field operations —

these are all capability categories that run ON the kernel.

They are not the definition of the system.



Category claim:

&#x20; AutoKirk detects every obligation automatically, enforces completion

&#x20; with proof, monitors time, acts autonomously when something slips,

&#x20; and records every outcome as permanent truth.



\---



\## CURRENT BUILD STATE



Build sequence: constitution → checklist → RPC → receipt → signals → UI



&#x20; Step 1 constitution  ✅ SEALED

&#x20; Step 2 checklist     ✅ SEALED

&#x20; Step 3 RPC           ✅ SEALED

&#x20; Step 4 receipt       ✅ SEALED

&#x20; Step 5 signals       ✅ SEALED and proven

&#x20; Step 6 UI            ← ACTIVE — incomplete



Phase progress:

&#x20; Phase 0 structural integrity   ✅ COMPLETE

&#x20; Phase 1 identity correction    ← NEXT

&#x20; Phase 2 complete UI            → after Phase 1

&#x20; Phase 3 live enforcement       → after Phase 2

&#x20; Phase 4 CI/CD proof gate       → after Phase 3

&#x20; Phase 5 obligation library     → after Phase 4

&#x20; Phase 6 integration surface    → after Phase 5



Sealed proof markers (do not break these):

&#x20; TERMINAL\_STATE\_VERIFICATION\_OK

&#x20; OVERDUE\_FAILURE\_VERIFICATION\_MANUAL\_OK

&#x20; SYSTEM\_TRUTH\_VERIFICATION\_OK

&#x20; GUARD\_VERIFICATION\_OK

&#x20; SIGNALS\_VERIFICATION\_OK



Proof entry points — run ALL of these in sequence:

&#x20; npm run prove

&#x20; powershell -ExecutionPolicy Bypass -File .\\scripts\\verify-overdue-failure.ps1

&#x20; powershell -ExecutionPolicy Bypass -File .\\scripts\\verify-guards.ps1

&#x20; powershell -ExecutionPolicy Bypass -File .\\scripts\\verify-signals.ps1



Active branch: recover/local-work-after-sync

Active head:   968ab2437d5ae9e8db32c09b51bc0a94df755ad4



\---



\## DOCTRINE RULES — BINARY. NO EXCEPTIONS.



Every change you make must pass all three axes or it does not enter the build.



AXIS 1 — MUTATION AUTHORITY

&#x20; Pass only if:

&#x20; - Kernel is the only mutation authority

&#x20; - No UI path mutates canonical truth

&#x20; - No watchdog path mutates canonical truth

&#x20; - No app route writes directly to any core.\*, ledger.\*, receipts.\* table

&#x20; - All governed mutation routes through api.\* SECURITY DEFINER functions



AXIS 2 — CONSTRUCTION CONSTRAINTS

&#x20; Pass only if:

&#x20; - Change fits the locked build sequence (currently step 6 UI)

&#x20; - Change does not introduce parallel truth

&#x20; - Change does not depend on rejected substrate (core.memberships is rejected)

&#x20; - Change does not outrun the current spine

&#x20; - Change is narrow enough to complete deeply before expansion



AXIS 3 — PROOF GUARANTEES

&#x20; Pass only if:

&#x20; - Canonical lifecycle remains legible: event → obligation → resolution → receipt

&#x20; - Every resolution can produce permanent proof

&#x20; - Receipt meaning is permanent

&#x20; - Proof gaps remain explicit — never hidden by UI or workflow language

&#x20; - No obligation can reach fulfilled truth without proof evaluated by kernel contract



If any axis fails: the change is blocked. There is no "ship now, fix later."



\---



\## WHAT MUST NOT BE TOUCHED



\- kernel mutation functions

\- supabase/migrations/ — applied migrations are append-only

\- canonical lifecycle projection semantics

\- proof harness boundary

\- KERNEL\_CONSTITUTION.md

\- core.workspace\_members (sole canonical membership authority)

\- api.claim\_watchdog\_emission() — single atomic claim gate

\- api.record\_watchdog\_attempt() — sole lease-clear authority



\---



\## PHASE 0 — COMPLETE



TASK 0A — Delete nested duplicate repo                  ✅ COMPLETE

&#x20; The folder Autokirk-Future/ inside the repo root has been deleted.

&#x20; Only one copy of any migration, function, or config file exists.



TASK 0B — Delete duplicate ingress paths                ✅ COMPLETE

&#x20; pages/api/webhook.ts — confirmed not present

&#x20; pages/api/integrations/stripe-webhook.ts — confirmed not present

&#x20; \*.stashed.ts files — confirmed not present

&#x20; Single canonical ingress: supabase/functions/stripe-webhook/ only.



TASK 0C — Fix direct table write in watchdog emitter    ✅ COMPLETE

&#x20; Audited pages/api/watchdog/emit-overdue-webhook.ts.

&#x20; No direct .from('watchdog\_emissions').insert() call exists.

&#x20; All mutations route through api.\* RPCs:

&#x20;   create\_watchdog\_emission()

&#x20;   claim\_watchdog\_emission()

&#x20;   record\_watchdog\_attempt()

&#x20; Boundary is clean. All 5 proof markers pass.



\---



\## WORK QUEUE — EXECUTE IN THIS EXACT ORDER



\### PHASE 1 — IDENTITY CORRECTION  ← ACTIVE



TASK 1A — Update doctrine files

&#x20; The label "revenue enforcement operating system" appears in multiple files.

&#x20; It is incorrect. Replace every instance with the correct identity.



&#x20; Correct canonical sentence:

&#x20; "AutoKirk is a kernel-first obligation enforcement system. It detects

&#x20; every obligation automatically, enforces completion with proof, monitors

&#x20; time, acts autonomously when something slips, and records every outcome

&#x20; as permanent truth."



&#x20; Revenue enforcement is a capability category, not the system definition.



&#x20; Files to update:

&#x20;   KERNEL\_CONSTITUTION.md           — system purpose statement

&#x20;   CLAUDE.md                        — Claude Code operating instructions

&#x20;   docs/SYSTEM\_LAYOUT.md            — system description

&#x20;   SYSTEM\_STATE\_HANDOFF.txt         — restart context

&#x20;   pages/proof-demo.tsx             — "revenue action cannot be dropped"

&#x20;                                      must become "obligation cannot be dropped"



&#x20; Rule: Do not change anything else in these files. Identity label only.



After Phase 1: run all 4 proof entry points. All 5 markers must pass.



\---



\### PHASE 2 — COMPLETE BUILD STEP 6 (UI)



TASK 2A — Apply queued build artifacts

&#x20; If MASTER\_APPLY\_ALL.ps1 exists in the repo or Downloads, run it first.

&#x20; After it runs: run all 4 proof entry points. All markers must pass.



TASK 2B — Integrate PendingSignalsPanel into pages/index.tsx

&#x20; PendingSignalsPanel.tsx must be imported and rendered on the main dashboard.

&#x20; It must appear above or alongside SystemProofBoard.

&#x20; It must show: pending signals waiting for operator commit or dismiss.



TASK 2C — Operator surface vocabulary audit

&#x20; Every visible label on pages/index.tsx and all dashboard components

&#x20; must use only this vocabulary:



&#x20;   Kernel state         → Operator label

&#x20;   open                 → Open

&#x20;   proof\_status pending → Needs Proof

&#x20;   overdue + unresolved → Overdue — System Acting

&#x20;   resolved             → Sealed

&#x20;   failed               → Failed



&#x20; No kernel terminology visible to operator.

&#x20; No database column names visible to operator.

&#x20; No "revenue" framing anywhere on the operator surface.



TASK 2D — Verify UI is a projection only

&#x20; No component file may call supabase directly for mutation.

&#x20; All data must flow: kernel → api.\* → Next.js API route → component.

&#x20; Read-only Supabase calls from components are permitted for projections only.



After Phase 2: run all 4 proof entry points. All markers must pass.

&#x20;             Manual test: open dashboard, confirm all 3 states are visible.



\---



\### PHASE 3 — LIVE ENFORCEMENT



TASK 3A — Set WATCHDOG\_OUTBOUND\_WEBHOOK\_URL

&#x20; Run in PowerShell from repo root:

&#x20;   vercel env add WATCHDOG\_OUTBOUND\_WEBHOOK\_URL

&#x20; Set value to your consumer endpoint URL.

&#x20; Add to all environments: development, preview, production.



TASK 3B — End-to-end watchdog verification

&#x20; Trigger an overdue obligation (use existing verify-overdue-failure.ps1).

&#x20; Confirm the watchdog emitter fires and delivers to the endpoint.

&#x20; Confirm api.record\_watchdog\_attempt() records the attempt.

&#x20; Confirm no duplicate delivery occurs on retry.



After Phase 3: Autonomous enforcement is operational, not just architectural.



\---



\### PHASE 4 — CI/CD PROOF GATE



TASK 4A — Create GitHub Actions workflow

&#x20; File: .github/workflows/proof.yml

&#x20; Trigger: push to main branch and pull\_request to main

&#x20; Steps:

&#x20;   1. checkout repo

&#x20;   2. setup Node.js (match version in package.json)

&#x20;   3. npm install

&#x20;   4. supabase start (local)

&#x20;   5. supabase db reset --local

&#x20;   6. npm run prove

&#x20;   7. powershell -ExecutionPolicy Bypass -File .\\scripts\\verify-guards.ps1

&#x20;   8. powershell -ExecutionPolicy Bypass -File .\\scripts\\verify-signals.ps1

&#x20;   9. fail workflow if any proof step exits non-zero



TASK 4B — Block Vercel deploy on proof failure

&#x20; In vercel.json or Vercel dashboard:

&#x20; Set the GitHub Actions proof workflow as a required status check.

&#x20; Vercel must not deploy if the proof workflow has not passed on that commit.



After Phase 4: No broken state can reach production without explicit proof failure signal.



\---



\### PHASE 5 — OBLIGATION LIBRARY EXPANSION



TASK 5A — Enumerate current obligation codes from active kernel

&#x20; Read kernel.open\_obligation\_internal() in the active migration.

&#x20; Current known codes:

&#x20;   fulfill\_promised\_service

&#x20;   subscription\_upcoming

&#x20;   payment\_succeeded

&#x20;   unclassified  ← this is the gap



TASK 5B — Add proof contract entries for each active code

&#x20; File: control/PROOF\_CONTRACTS\_BY\_OBLIGATION\_CODE.md

&#x20; For each active obligation code, fill the contract template:

&#x20;   - obligation code

&#x20;   - contract purpose

&#x20;   - required proof shape

&#x20;   - required proof fields

&#x20;   - validation conditions

&#x20;   - rejection conditions

&#x20;   - accepted failure classes

&#x20;   - resulting receipt class

&#x20;   - resulting projection effect

&#x20;   - idempotency expectations



TASK 5C — Add obligation codes for proven verticals

&#x20; Marine, construction, and electrical verticals are proven.

&#x20; Add one canonical obligation code per vertical as the first industry entries.

&#x20; Each code must have a kernel-owned proof contract (Task 5B format).

&#x20; Each code must be added to kernel.open\_obligation\_internal() classification.

&#x20; Each code must have a proof harness assertion in the verify scripts.



TASK 5D — Surface unclassified accumulation

&#x20; Add a watchdog view or proof assertion that alerts when any obligation

&#x20; reaches unclassified state. Unclassified must never accumulate silently.

&#x20; This is a monitoring addition only — it does not mutate kernel truth.



\---



\### PHASE 6 — INTEGRATION SURFACE



TASK 6A — Document signal library for Stripe (already connected)

&#x20; Create: docs/integrations/stripe-signal-library.md

&#x20; Map every Stripe event type that should become an obligation.

&#x20; For each: event type → obligation code → proof contract reference.



TASK 6B — Define signal library template for new integrations

&#x20; Create: docs/integrations/SIGNAL\_LIBRARY\_TEMPLATE.md

&#x20; Template must define:

&#x20;   - integration name

&#x20;   - event source

&#x20;   - event types

&#x20;   - obligation code mapping

&#x20;   - proof contract reference

&#x20;   - replay-safety notes



\---



\## PROOF RULE — APPLIES TO EVERY TASK



After every task that touches a migration, function, route, or component:

&#x20; Run all 4 proof entry points.

&#x20; All 5 sealed markers must pass.

&#x20; If any marker fails, the task is not complete. Fix before proceeding.

&#x20; Do not accumulate work across multiple tasks before running proof.



\---



\## WHAT YOU MUST PRODUCE FOR EACH TASK COMPLETED



For each completed task, output:

&#x20; 1. What file(s) were changed and how

&#x20; 2. The exact proof commands run

&#x20; 3. The proof output (pass/fail per marker)

&#x20; 4. What the next task is



If a task fails binary review, output:

&#x20; 1. Which axis failed

&#x20; 2. Why it failed

&#x20; 3. What change would make it pass

&#x20; 4. Do not apply the failing change



\---



\## RESTART NOTE FORMAT (output this at end of every session)



CURRENT STATE:     \[phase and task number completed]

ACTIVE FILES:      \[list of files touched this session]

PROOF STATUS:      \[all 5 markers — pass or fail]

NEXT EXACT STEP:   \[phase and task number, one sentence description]

DO NOT TOUCH:      \[any file flagged as sensitive this session]



\---



\## SESSION RESTART NOTE — 2026-05-04



CURRENT STATE:     Phase 0 COMPLETE — all tasks 0A, 0B, 0C sealed.

ACTIVE FILES:      scripts/verify-signals.ps1 (created this session)

PROOF STATUS:      TERMINAL\_STATE\_VERIFICATION\_OK           ✅

&#x20;                  OVERDUE\_FAILURE\_VERIFICATION\_MANUAL\_OK   ✅

&#x20;                  SYSTEM\_TRUTH\_VERIFICATION\_OK             ✅

&#x20;                  GUARD\_VERIFICATION\_OK                    ✅

&#x20;                  SIGNALS\_VERIFICATION\_OK                  ✅

NEXT EXACT STEP:   Phase 1, Task 1A — identity correction in doctrine files

&#x20;                  (KERNEL\_CONSTITUTION.md, CLAUDE.md, docs/SYSTEM\_LAYOUT.md,

&#x20;                   SYSTEM\_STATE\_HANDOFF.txt, pages/proof-demo.tsx)

DO NOT TOUCH:      kernel mutation functions, supabase/migrations/



\---



\## FINAL RULE



AutoKirk Future is the only active repo.

No old repo files, migrations, or runtime paths are authoritative.

Every change must strengthen the complete system.

If a change does not strengthen or prove the active lifecycle path,

it does not enter the build.

