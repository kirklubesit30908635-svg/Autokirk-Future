# AUTOKIRK — BUILD LOCK
# Version:   2026-05-07
# Authority: Chase Arizona Kirk, Sole Founder, Kirk Digital Holdings LLC
# Purpose:   Single canonical reference governing all build decisions.
#            Paste this file as first context in any new agent session.
#            No change enters the build without passing this document's standard.

---

## GOVERNING AUTHORITY

This build is governed by one person: Chase Arizona Kirk, Sole Founder.
AI is a governed collaborator. AI proposes. The founder authorizes.
No AI agent has mutation authority over canonical truth.
No change is valid until the founder has verified it passes all three axes.

---

## WHAT AUTOKIRK IS — CANONICAL, LOCKED

AutoKirk is a kernel-first obligation enforcement system.
It detects every obligation automatically, enforces completion with proof,
monitors time, acts autonomously when something slips, and records every
outcome as permanent truth.

Category:        Obligation Enforcement Infrastructure
Wedge:           Every business runs on obligations. Most software tracks them.
                 AutoKirk enforces them.
One-line pitch:  AutoKirk detects what should happen, forces it to happen
                 with proof, fixes it if it doesn't, and records it as
                 permanent truth.

WHAT AUTOKIRK IS NOT:
  Task manager. CRM. Workflow tool. Field service software.
  Revenue enforcement system (alone). Vertical-specific product.

IDENTITY CORRECTION (applied 2026-05-04 — not yet in all files):
  WRONG:   "AutoKirk is a kernel-first revenue enforcement operating system."
  CORRECT: The canonical identity above.
  Files still needing correction: KERNEL_CONSTITUTION.md, CLAUDE.md,
  docs/SYSTEM_LAYOUT.md, SYSTEM_STATE_HANDOFF.txt, pages/proof-demo.tsx

---

## CANONICAL SYSTEM STATE — AS OF 2026-05-07

Repository:      github.com/kirklubesit30908635-svg/Autokirk-Future
Active branch:   main
Last commit:     d2390c9
Supabase:        AutoKirk-Future (id: aiuicbyufelqdeiwhmyi)
Domain:          autokirk.com
Hosting:         Vercel (region: iad1, Node.js 24.x)

DEPRECATED — NO LONGER AUTHORITATIVE:
  Old repo:      kirklubesit30908635-svg/KDH  ← DO NOT USE
  Old Supabase:  udwzexjwhkvsyeihcwfw         ← DO NOT USE
  Old Supabase:  ihkymfqyfbvsogdprris         ← DO NOT USE

Autonomous watchdog confirmed firing:
  First fire:  2026-05-04 21:25:21 UTC
  Schedule:    */5 * * * * (every 5 minutes, production)
  Status:      LIVE AND RUNNING

---

## KERNEL ARCHITECTURE — DOCTRINE LOCKED

### Canonical lifecycle (immutable)
  source event → obligation → resolution → receipt

### Mutation authority
  ALL governed mutation routes through api.* SECURITY DEFINER functions.
  The app layer NEVER writes directly to core.*, ledger.*, receipts.*,
  control.*, or signals.* tables.
  Migrations are append-only — no migration is modified after applied.

### Schema vocabulary (no ak_* or face_* prefixes)
  core.*       — workspaces, workspace_members, objects, obligations, resolutions
  ledger.*     — events (append-only, hash-chained)
  receipts.*   — immutable receipt store
  control.*    — watchdog_emissions, proof gates
  signals.*    — append-only observation layer (no mutation authority)
  api.*        — SECURITY DEFINER functions (only mutation surface)
  kernel.*     — open_obligation_internal(), classification logic

### Sealed RPCs (do not modify)
  api.claim_watchdog_emission()   — single atomic claim gate
  api.record_watchdog_attempt()   — sole lease-clear authority
  api.resolve_with_proof()        — proof-gated resolution
  api.append_event_v1()           — sole canonical mutation surface
  api.open_obligation()           — obligation creation

### Operator vocabulary (only these labels on any operator surface)
  Kernel state              → Operator label
  open                      → Open
  proof_status pending      → Needs Proof
  overdue + unresolved      → Overdue — System Acting
  resolved                  → Sealed
  failed                    → Failed

  NO kernel primitives visible to operators.
  NO database column names visible to operators.
  NO "revenue" framing anywhere on the operator surface.

---

## THREE-AXIS BINARY REVIEW — EVERY CHANGE MUST PASS ALL THREE

AXIS 1 — MUTATION AUTHORITY
  Pass only if:
  - Kernel is the only mutation authority
  - No UI path mutates canonical truth
  - No watchdog path mutates canonical truth
  - No app route writes directly to core.*, ledger.*, receipts.*, control.*
  - All governed mutation routes through api.* SECURITY DEFINER functions

AXIS 2 — CONSTRUCTION CONSTRAINTS
  Pass only if:
  - Change fits the locked build sequence (see BUILD SEQUENCE below)
  - Change does not introduce parallel truth
  - Change does not depend on rejected substrate
  - core.memberships is permanently rejected
  - Change does not outrun the current phase
  - Change completes one thing deeply before expanding

AXIS 3 — PROOF GUARANTEES
  Pass only if:
  - Canonical lifecycle remains legible: event → obligation → resolution → receipt
  - Every resolution can produce permanent proof
  - Receipt meaning is permanent
  - No obligation can reach fulfilled truth without proof evaluated by kernel contract
  - Proof gaps remain explicit — never hidden by UI or workflow language

If any axis fails: the change is blocked. No "ship now, fix later."

---

## WHAT MUST NOT BE TOUCHED

  supabase/migrations/                        — append-only, no modification after apply
  KERNEL_CONSTITUTION.md                      — governing law
  api.claim_watchdog_emission()               — single atomic claim gate
  api.record_watchdog_attempt()               — sole lease-clear authority
  core.workspace_members                      — sole canonical membership authority
  components/demo/ObligationDemo.tsx          — SEALED 2026-05-04
  pages/api/cron/watchdog-emit.ts             — SEALED, live autonomous watchdog
  pages/api/intake/commit.ts                  — SEALED, single canonical ingress
  pages/api/obligations/resolve-with-proof.ts — SEALED

---

## BUILD SEQUENCE — CURRENT STATUS

  Phase   Description                         Status
  ------  ----------------------------------  ----------------------------
  1       Kernel constitution                 SEALED
  2       Checklist substrate                 SEALED
  3       RPC layer (api.* SECURITY DEFINER)  SEALED
  4       Receipt substrate                   SEALED
  5       Signals substrate                   SEALED and proven
  3-Auto  Autonomous watchdog enforcement     SEALED 2026-05-04
  6       UI projection layer                 ACTIVE — partially built
  ------- ----------------------------------  ----------------------------
  0       Structural integrity                OPEN — must close first
  1-fix   Identity correction                 OPEN — queue after Phase 0
  7       Customer-facing tenant board        PENDING — next build target
  8       Corporate structure completion      PENDING — parallel

---

## WORK QUEUE — EXECUTE IN THIS EXACT ORDER

### PHASE 0 — STRUCTURAL INTEGRITY (do this first — nothing else valid until done)

TASK 0A — Delete nested duplicate repo
  Problem:  Autokirk-Future/ folder exists inside the repo root.
  Fix:      Delete it entirely. Add Autokirk-Future/ to .gitignore.
  Verify:   Only one copy of any migration, function, or config exists.

TASK 0B — Delete duplicate ingress paths
  Problem:  Multiple webhook ingress files may exist.
  Delete if present:
    pages/api/webhook.ts
    pages/api/integrations/stripe-webhook.ts
    Spine/migrations/ directory
    any *.stashed.ts files
  Single canonical ingress: pages/api/intake/commit.ts only.
  Verify:   No other file can receive an external event.

TASK 0C — Fix direct table write in watchdog emitter [CONFIRMED IN PRODUCTION]
  Problem:  pages/api/watchdog/emit-overdue-webhook.ts writes directly to
            control.watchdog_emissions, bypassing the api.* boundary.
            Constitutional violation confirmed in production.
  Fix:      Replace direct .from('watchdog_emissions').insert() call
            with api.create_watchdog_emission() RPC.
            If api.create_watchdog_emission() does not exist, write a
            migration to create it BEFORE fixing the route.
  Verify:   No app-layer file contains a direct insert into any control.* table.

TASK 0D — Verify WATCHDOG_OUTBOUND_WEBHOOK_URL
  Check Vercel environment variables.
  Confirm value points to /api/integrations/watchdog-receiver on same domain.
  Set in production, preview, and development environments if not set.

After Phase 0: run npm run prove — all 5 sealed markers must pass.
Do not proceed to Phase 1 until proof is clean.

---

### PHASE 1 — IDENTITY CORRECTION

TASK 1A — Update identity in doctrine files
  Replace every instance of "revenue enforcement operating system" with:
  "obligation enforcement system"

  Files:
    KERNEL_CONSTITUTION.md
    CLAUDE.md
    docs/SYSTEM_LAYOUT.md
    SYSTEM_STATE_HANDOFF.txt
    pages/proof-demo.tsx  ("revenue action cannot be dropped"
                           → "obligation cannot be dropped")

TASK 1B — Update AUTOKIRK_AGENT_HANDOFF.md
  Add Task 2E: Register components/demo/ObligationDemo.tsx as
  sealed 2026-05-04. Add to WHAT MUST NOT BE TOUCHED section.

After Phase 1: run npm run prove — all 5 sealed markers must pass.

---

### PHASE 2 — COMPLETE UI (Build Step 6)

TASK 2A — Verify signals substrate before applying PendingSignalsPanel
  Confirm intake_signals table or equivalent exists in Supabase.
  If it does not exist, do not apply PendingSignalsPanel.tsx.
  Do not create the table until it is the next sequenced migration.

TASK 2B — Integrate PendingSignalsPanel into pages/index.tsx
  Precondition: 2A confirmed.
  Import and render above SystemProofBoard.
  Panel shows: pending signals waiting for operator commit or dismiss.

TASK 2C — Operator surface vocabulary audit
  Every visible label on pages/index.tsx and all dashboard components
  must use only the locked vocabulary table above.
  No kernel terminology. No database column names. No "revenue" framing.

TASK 2D — Verify UI is projection only
  No component file calls Supabase for mutation.
  All data: kernel → api.* → Next.js API route → component.
  Read-only Supabase calls from components permitted for projections only.

After Phase 2: npm run prove — all 5 markers pass.
Manual test: dashboard shows Open, Needs Proof, Overdue — System Acting.

---

### PHASE 3 — LIVE ENFORCEMENT VERIFICATION

TASK 3A — Confirm WATCHDOG_OUTBOUND_WEBHOOK_URL
  If not set in Phase 0D, set now:
  vercel env add WATCHDOG_OUTBOUND_WEBHOOK_URL
  All environments: development, preview, production.

TASK 3B — End-to-end watchdog verification
  Trigger overdue obligation (use verify-overdue-failure.ps1).
  Confirm: emit → receive at /api/integrations/watchdog-receiver
           → api.record_watchdog_attempt() records attempt
           → no duplicate on retry.

After Phase 3: Autonomous enforcement is operational, not just architectural.

---

### PHASE 4 — CI/CD PROOF GATE

TASK 4A — Port proof harness to cross-platform
  Problem: npm run prove invokes PowerShell — does not run on Linux
           (GitHub Actions uses Linux runners).
  Fix:     Convert verify-overdue-failure.ps1 and verify-guards.ps1
           assertions into Node.js scripts or Jest/Vitest tests that
           run identically on Windows and Linux.

TASK 4B — Create GitHub Actions workflow
  File:    .github/workflows/proof.yml
  Trigger: push to main, pull_request to main
  Steps:
    1. checkout
    2. setup Node.js (match version in package.json)
    3. npm install
    4. supabase start (local)
    5. supabase db reset --local
    6. npm run prove
    7. fail workflow if any step exits non-zero

TASK 4C — Block Vercel deploy on proof failure
  Set proof.yml as required status check in Vercel.
  Vercel must not deploy if proof workflow has not passed on that commit.

After Phase 4: No broken state can reach production without explicit signal.

---

### PHASE 5 — OBLIGATION LIBRARY COMPLETION

TASK 5A — Confirm all codes registered in kernel.open_obligation_internal()
  Six active codes:
    fulfill_promised_service
    subscription_upcoming
    payment_succeeded
    marine_voyage_completion
    construction_task_completion
    electrical_certification

TASK 5B — Add proof harness assertions for vertical codes
  marine_voyage_completion, construction_task_completion,
  electrical_certification must each have assertions in verify scripts.

TASK 5C — Surface unclassified accumulation
  Add watchdog view or proof assertion that alerts when any obligation
  reaches unclassified state.
  Unclassified must never accumulate silently.
  CI/CD gate must assert zero unclassified obligations after any
  migration touching the intake path.

After Phase 5: npm run prove with all new assertions present.

---

### PHASE 6 — INTEGRATION SURFACE

TASK 6A — Fill Stripe signal library
  File: docs/integrations/stripe-signal-library.md
  Map every Stripe event type currently received:
    event type → obligation code → proof contract reference
  Include: idempotency key strategy, replay-safety notes, auto-commit rules.

TASK 6B — Confirm signal library template is in place
  File: docs/integrations/SIGNAL_LIBRARY_TEMPLATE.md
  Protocol: no signals from unregistered source may enter kernel until
  template is filled, codes are registered, harness assertions added,
  and npm run prove passes.

---

### PHASE 7 — CUSTOMER-FACING TENANT BOARD (NEXT BUILD TARGET)

TASK 7A — Tenant scoping (Supabase)
  Add RLS enforcement: all board queries filtered by workspace_id.
  No query on the tenant board can see another tenant's data.
  Enforced at the database layer, not just the application layer.

TASK 7B — Vocabulary translation table (Supabase migration)
  Create per-tenant label override table.
  Marine: "voyage obligation". Construction: "task obligation".
  Same kernel primitives — different operator-visible labels per tenant.

TASK 7C — Board page
  File: pages/board/[tenant_slug].tsx
  Read-only projection of that tenant's obligations, proof statuses,
  receipts. No mutations from UI. All data via api.* RPC.

TASK 7D — Board API route
  File: pages/api/board/obligations.ts
  Tenant-scoped query through api.* RPC.
  workspace_id filter enforced at every query.

TASK 7E — Customer authentication
  Magic link or simple token per tenant.
  Separate from operator auth.
  Isolated at the RLS level.

TASK 7F — Onboarding flow
  File: pages/signup/index.tsx
  Flow: signup → workspace created → unique slug issued
        → integration guide shown → first webhook received
        → first obligation opens on board in real time.

After Phase 7: A customer can receive a URL, connect their existing tools,
and see their obligations open, prove, and seal in real time.

---

### PHASE 8 — CORPORATE STRUCTURE (PARALLEL — NO CODE REQUIRED)

  IP assignment:         Chase → AutoKirk IP Holdings LLC
  Intercompany license:  AutoKirk IP Holdings LLC → AutoKirk Systems LLC
  Operating agreements:  All three LLCs
  Mercury accounts:      Three — OpCo operating, OpCo revenue, IP-LLC
  Billing migration:     OpenAI, Vercel, Supabase → OpCo Gmail / accounts

---

## PROOF RULE — APPLIES TO EVERY TASK

After every task that touches a migration, function, route, or component:
  Run:     npm run prove
  Require: All 5 sealed markers must pass.
    TERMINAL_STATE_VERIFICATION_OK
    OVERDUE_FAILURE_VERIFICATION_MANUAL_OK
    SYSTEM_TRUTH_VERIFICATION_OK
    GUARD_VERIFICATION_OK
    SIGNALS_VERIFICATION_OK
  If any marker fails: the task is not complete. Fix before proceeding.
  Do not accumulate work across tasks before running proof.
  Proof runs after every individual task.

---

## FILES ON THE SHELF — DO NOT APPLY

These were rejected during the 2026-05-05 audit. Do not apply under any
circumstances without explicit founder authorization and full three-axis review.

  MASTER_APPLY_PHASE0-6.ps1           — too aggressive for production
  pages/index.tsx (shelved)           — would replace working live homepage
  components/SystemProofBoard.tsx      — would overwrite live sealed component
  components/PendingSignalsPanel.tsx   — signals substrate not yet verified
  pages/api/signals/pending.ts         — no intake_signals table exists
  pages/api/watchdog/emit-overdue-webhook.ts (shelved) — RPC sigs unverified
  .github/workflows/proof.yml (bundle) — npm run prove not Linux-compatible

---

## OUTPUT FORMAT — EVERY COMPLETED TASK

  1. What files were changed and exactly how
  2. The exact proof command run
  3. The proof output (pass/fail per marker, all 5)
  4. What the next task is

If a task fails three-axis review:
  1. Which axis failed
  2. Why it failed
  3. What change would make it pass
  4. Do not apply the failing change

---

## SESSION RESTART FORMAT — OUTPUT AT END OF EVERY SESSION

  CURRENT STATE:    [phase and task number completed]
  ACTIVE FILES:     [list of files touched this session]
  PROOF STATUS:     [all 5 markers — pass or fail]
  NEXT EXACT STEP:  [phase and task, one sentence]
  DO NOT TOUCH:     [any file flagged sensitive this session]
  OPEN FAILURES:    [any failure points identified but not yet fixed]

---

## REVENUE CONTEXT — PARALLEL TO ALL BUILD PHASES

Pricing:             $300–$500 / month per tenant
Target:              $150,000 / year (25–32 customers at ~$400 avg)
Design partners:     $500/month, 3–5 first operators from personal network
90-day target:       $3,000–$5,000 MRR or pre-seed commitment
Demo tool:           components/demo/ObligationDemo.tsx (SEALED, use as-is)
Demo script:         Select vertical → show board → ask about last thing
                     that fell through cracks → trigger obligation → submit
                     proof → trigger watchdog → point to sealed receipt
Outreach:            Personal trades network first. Pitch = one sentence.
                     "You are losing money on work that falls through the
                     cracks. I have a system that makes that structurally
                     impossible. Let me show you."

---

## DESIGN PARTNER AGREEMENT — DOCTRINE

### What a Design Partner Agreement Is

A design partner agreement is the first revenue event in AutoKirk's
commercial lifecycle. It is not a finished-product customer contract.
It is a governed partnership where both parties carry defined obligations.
The kernel applies to this agreement the same way it applies to everything
else. AutoKirk enforces its own commercial commitments through its own
doctrine.

---

### The Two Parties — Their Obligations

FOUNDER OBLIGATIONS:
  - Deliver a working tenant board URL for the operator's business
  - Build the operator's specific obligation codes with proof contracts
  - Apply operator feedback through the governed work queue only
  - Maintain kernel integrity — no operator request compromises doctrine
  - Onboard the operator to their first sealed receipt within 7 days

OPERATOR OBLIGATIONS:
  - $500/month recurring payment via Stripe (month-to-month)
  - Provide honest feedback on their obligation types and workflows
  - Connect at least one signal source within 30 days of onboarding
  - No minimum term — cancel anytime, no penalty

---

### Terms — Locked

  Price:      $500 / month
  Structure:  Month-to-month, cancel anytime
  Access:     Unique tenant board URL — autokirk.com/board/[their-slug]
  Scope:      Their workspace only — complete data isolation, enforced at RLS level
  SLA:        None — this is an explicit early partnership, not a finished product
  Rate lock:  Design partner rate is permanent — will not increase when
              product is finished and general pricing applies

---

### What Triggers a Signed Agreement — The Exact Sequence

  1. Show ObligationDemo.tsx using the operator's vertical
  2. Ask: "When was the last time a piece of work fell through the
     cracks in your operation?"
  3. Map their answer to the demo — obligation detection, proof, watchdog, receipt
  4. Make the design partner ask:
     "I am looking for 5 operators to build this from the inside.
     $500/month, month-to-month, cancel anytime. You get a permanent rate
     and direct input into what gets built for your operation."
  5. Operator commits verbally or in writing
  6. Stripe subscription created same day — this is the moment of signing
     No delay. No invoice later. Stripe that day.

---

### What Happens in the Build After Signing

  DAY 0 — same day as verbal commitment:
    - Create Stripe subscription $500/month recurring
    - Create operator workspace in Supabase:
        INSERT into core.workspaces (name, slug, workspace_id)
        INSERT into core.workspace_members (workspace_id, user_id, role)
    - Assign workspace_id and tenant_slug
    - Record the agreement in docs/DESIGN_PARTNERS.md (required — see below)

  DAY 1–7 — onboarding:
    - 30-minute call: map operator's specific obligation types
    - Identify primary signal source (Zapier, ServiceTitan, Jobber, webhook)
    - Wire first signal manually if needed — one obligation opening live
    - Show operator their first sealed receipt using their own business data
    - Record their vocabulary preferences (what they call obligations in
      their business — this goes into the vocabulary translation table)

  ONGOING:
    - Operator feedback enters the build only through the governed work queue
    - No operator request bypasses the three-axis review
    - No operator request modifies the kernel, migrations, or sealed artifacts
    - First payment receipt from Stripe is an obligation in the kernel

---

### How Operator Feedback Enters the Build

  PERMITTED — these paths are valid:
    New obligation code needed      → queued in Phase 5 work queue
    New signal source               → queued in Phase 6 work queue
    Board UI feedback               → queued in Phase 7 work queue
    Vocabulary preference           → added to vocabulary translation table
    Proof shape feedback            → updates proof contract for their code

  PROHIBITED — these paths are blocked regardless of who asks:
    Direct kernel function modification
    Bypass of proof requirement for their obligations
    Modification of migration sequence
    Addition of unclassified obligations without proof contracts
    Any change that fails the three-axis review

  Operator feedback is input. The three-axis review is the gate.
  The kernel governs. The founder authorizes. The operator informs.

---

### Design Partner Record — Required Entry for Every Signed Agreement

  File: docs/DESIGN_PARTNERS.md
  Append one entry per signed agreement. This file is append-only.

  Template:

    ## [Operator Name or Identifier]

    Signed:           [date]
    Vertical:         [construction | electrical | marine | HVAC | other]
    Stripe sub ID:    [Stripe subscription ID]
    workspace_id:     [UUID]
    tenant_slug:      [slug used in autokirk.com/board/[slug]]
    Signal source:    [Zapier | ServiceTitan | Jobber | webhook | manual]
    Obligation codes: [which codes are active for this operator]
    Vocabulary:       [what they call obligations in their business]
    Feedback queue:   [any items queued from their feedback]
    First receipt:    [date of first sealed receipt in their workspace]
    Status:           [active | churned | paused]

---

### What a Signed Agreement Proves

  A signed design partner agreement is proof that:
  - The obligation model is real to a paying operator in a real business
  - The category claim is verified by someone spending money on it
  - The kernel is serving live operations, not just a demo
  - AutoKirk's enforcement model has captured its first unit of commercial truth

  Revenue record:
    1 design partner   = $500/month   = $6,000/year
    5 design partners  = $2,500/month = $30,000/year
    10 design partners = $5,000/month = $60,000/year
    32 customers       = $12,800/month = $150,000+/year (revenue replacement)

  Every signed agreement is a sealed receipt in the commercial ledger.
  The system that enforces business obligations enforces its own.

---

## FINAL RULE

Autokirk-Future is the only active repo.
aiuicbyufelqdeiwhmyi is the only active Supabase instance.
No old repo files, migrations, or runtime paths are authoritative.

Every change must strengthen the complete system.
If a change does not strengthen or prove the active lifecycle path,
it does not enter the build.

Single authority. Locked sequence. Proof before advance.
Permanent record of what happened.

That is the kernel's standard.
That is the build's standard.
That is the founder's standard.

---

SEALED: 2026-05-07
GOVERNING AUTHORITY: Chase Arizona Kirk, Sole Founder