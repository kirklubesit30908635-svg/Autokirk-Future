# Collapse Duplicate Surfaces Plan

Status: Proposed execution plan

Purpose: Collapse duplicate repo surfaces until AutoKirk Future has one authoritative runtime path per concern.

This plan is narrower than general architecture work.
It is specifically for removing duplicate authority, duplicate runtime surfaces, secret-bearing residue, and copy-tree drift without damaging the proven kernel lifecycle.

## Target End State

The repo is clean only when all of the following are true:

- `supabase/migrations/*` is the only executable schema authority
- `supabase/functions/stripe-webhook/*` is the only external ingress authority
- one web runtime path owns each route
- `pages/api/webhook.ts` no longer exists as an active ingress surface
- the duplicate `Autokirk-Future/` tree no longer exists inside the repo root
- `spine/migrations/*` is clearly quarantined as reference-only or archived
- no secret-bearing env artifact remains in the repo worktree
- proof commands still pass after cleanup

## Non-Negotiable Constraints

Do not change or broaden canonical mutation authority.

Do not replace `api.* -> kernel.*` mutation flow with app-layer writes.

Do not delete active proof assets until equivalent canonical assets are confirmed.

Do not remove the current primary dashboard route until its active dependencies are preserved.

Do not mix cleanup with feature expansion.

## Observed Duplicate Surfaces

### 1. Secret-bearing residue

Files observed:

- `.env.local`
- `WATCHDOG_SHARED_SECRET.loval.env..txt`
- `spine/migrations/.env.local.txt`

Risk:

- immediate credential exposure risk
- repo-state ambiguity around which env source is real
- direct violation of `control/REPO_CLEANUP_BOUNDARY.md`

### 2. Duplicate repo tree

Directory observed:

- `Autokirk-Future/`

Contents duplicate:

- `pages/`
- `src/`
- `supabase/`
- `scripts/`
- `control/`
- `docs/`
- `spine/`
- `sql/`

Risk:

- search confusion
- file-level authority ambiguity
- high chance of editing the wrong copy

### 3. Duplicate ingress surfaces

Current ingress-related files:

- canonical: `supabase/functions/stripe-webhook/index.ts`
- duplicate/local route: `pages/api/integrations/stripe-webhook.ts`
- non-canonical legacy route: `pages/api/webhook.ts`
- stashed copy: `pages/api/integrations/stripe-webhook.stashed.ts`

Risk:

- more than one event entry path
- inconsistent auth and signature handling
- non-deterministic event identity and replay behavior

### 4. Duplicate intake commit routes

Files observed:

- `pages/api/intake/commit.ts`
- `src/app/api/intake/commit/route.ts`

Risk:

- same behavior implemented in two routers
- unclear authority on future changes
- migration path from Pages Router to App Router remains undefined

### 5. Duplicate migration/reference trees

Trees observed:

- canonical: `supabase/migrations/`
- reference-only: `spine/migrations/`
- nested duplicate copy: `Autokirk-Future/supabase/migrations/`
- nested duplicate copy: `Autokirk-Future/spine/migrations/`

Risk:

- execution against the wrong migration tree
- repo search results polluted with non-authoritative SQL

### 6. Snippet clutter

Directory observed:

- `supabase/snippets/`

Risk:

- low authority clarity
- noisy search results against canonical SQL

## Execution Strategy

Execute cleanup in six phases.
Each phase has a stop gate.
Do not proceed if its verification gate fails.

## Phase 0: Freeze and Snapshot

Goal:

- capture current state before touching duplicate surfaces

Actions:

- record `git status --short`
- record current proof command outputs
- confirm the dashboard still reads from `/api/watchdog/failed-obligations`
- confirm current intake commit clients, if any, still target the existing route

Verification gate:

- baseline captured in working notes or checkpoint commit

## Phase 1: Secret Purge and Rotation Boundary

Goal:

- remove secret-bearing files from the repo worktree before structural collapse

Actions:

- delete `WATCHDOG_SHARED_SECRET.loval.env..txt`
- delete `spine/migrations/.env.local.txt`
- move runtime env usage to non-committed local env handling only
- rotate any secret that has appeared in repo files or history
- verify `.gitignore` continues to block env and nested duplicate tree patterns

Keep:

- `.env.local` only as an uncommitted local runtime file if the user explicitly wants it for local development

Do not keep:

- any secret-bearing `.txt` env export file
- any committed service-role, webhook, or watchdog secret artifact

Verification gate:

- `rg -n "SUPABASE_SERVICE_ROLE_KEY|WATCHDOG_SHARED_SECRET|STRIPE_SECRET_KEY" -g "!node_modules/**" -g "!.next/**"` returns only allowed references in source code or docs, not concrete secret values in repo files

## Phase 2: Collapse External Ingress to One Path

Goal:

- leave only `supabase/functions/stripe-webhook/index.ts` as ingress authority

Actions:

- remove `pages/api/webhook.ts`
- remove `pages/api/integrations/stripe-webhook.ts`
- remove `pages/api/integrations/stripe-webhook.stashed.ts`
- audit docs and scripts for references to deleted routes
- update any local testing instructions to call the Supabase Edge Function path only

Keep:

- `supabase/functions/stripe-webhook/index.ts`

Verification gate:

- `rg -n "pages/api/webhook|pages/api/integrations/stripe-webhook|stripe-webhook.stashed" -g "!node_modules/**" -g "!.next/**"` returns no active runtime references

## Phase 3: Choose One Intake Commit Route

Goal:

- eliminate duplicate intake commit implementations

Decision required:

- if the repo remains primarily Pages Router, keep `pages/api/intake/commit.ts`
- if the repo is intentionally moving to App Router now, keep `src/app/api/intake/commit/route.ts`

Recommended current choice:

- keep `pages/api/intake/commit.ts`

Reason:

- `pages/index.tsx` is still the primary active UI surface
- the repo is still Pages Router-led overall
- collapsing to one active router is safer than promoting partial App Router usage mid-cleanup

Actions if following the recommended path:

- delete `src/app/api/intake/commit/route.ts`
- keep `src/app/intake-test/page.tsx` only if it is still useful as a UI test surface
- otherwise archive or remove `src/app/intake-test/page.tsx`

Alternative path:

- if the user wants App Router as the canonical runtime, first migrate the active dashboard and API surfaces, then delete the Pages Router intake route afterward

Verification gate:

- only one intake commit route remains in the repo
- `rg -n "commit_intake_candidate" pages src` shows one active route wrapper, not two

## Phase 4: Remove Nested Duplicate Build Root

Goal:

- eliminate the `Autokirk-Future/` copy tree from inside the real repo root

Actions:

- confirm there is no needed file in `Autokirk-Future/` that does not already exist in the real root
- if unique content exists, port it intentionally to the real root first
- delete the entire `Autokirk-Future/` directory from the worktree

Reason this is safe:

- `.gitignore` already treats `Autokirk-Future/` as non-authoritative residue
- keeping it in the worktree still pollutes search and editing

Verification gate:

- `Test-Path Autokirk-Future` returns false
- search results no longer show nested duplicate files

## Phase 5: Quarantine Reference-Only SQL Trees and Snippets

Goal:

- leave only one executable schema path

Actions:

- keep `supabase/migrations/*` as the sole executable migration authority
- move `spine/migrations/*` and `spine/verification/*` into a clearly archived/reference location if the historical material must be preserved
- otherwise remove `spine/migrations/*` from the active repo tree
- remove `supabase/snippets/Untitled query *.sql`

Recommended archive target:

- `archive/reference-only/spine/`
- `archive/reference-only/supabase-snippets/`

Reason:

- keeping these files under active names continues to poison search and review

Verification gate:

- `rg -n "spine/migrations|supabase/snippets/Untitled query" -g "!node_modules/**" -g "!.next/**"` finds only archive references or cleanup documentation, not active execution paths

## Phase 6: Final Proof and Authority Recheck

Goal:

- prove cleanup did not damage the canonical lifecycle

Actions:

- run `npm run prove`
- if doing a full local reset-safe check, run `npm run prove:reset`
- verify the dashboard still loads failed obligation data if the UI surface is retained
- verify watchdog emission route still works if retained
- verify only canonical ingress and mutation surfaces remain

Verification gate:

- proof harness passes
- no duplicate ingress route remains
- no duplicate intake route remains
- no nested duplicate tree remains
- no secret-bearing residue remains in repo worktree

## Phase 7: Refresh Canonical Layout Doc

Goal:

- ensure `docs/SYSTEM_LAYOUT.md` describes the cleaned repo state rather than the pre-cleanup state

Actions:

- update `docs/SYSTEM_LAYOUT.md` after Phases 1 through 5 are complete
- remove references to deleted duplicate ingress paths
- remove references to the nested `Autokirk-Future/` tree as a live repo surface
- collapse the route map to the surviving canonical runtime paths
- rewrite the structural realities section so it describes the cleaned state, not the drift state

Verification gate:

- `docs/SYSTEM_LAYOUT.md` matches the actual surviving repo structure and no longer documents removed surfaces as current reality

## Phase 8: Entity Binding Into Kernel Truth

Goal:

- bind obligations and receipts to legal entities so kernel truth is enforceable against the correct real-world actor

Actions:

- add deterministic workspace-to-entity binding on `core.workspaces`
- add `entity_id` to `core.obligations`
- add `entity_id` to `receipts.receipts`
- preserve canonical `api.* -> kernel.*` mutation flow while propagating entity identity through the lifecycle

Constraint:

- do this only after duplicate surfaces are collapsed, so the entity-binding migration lands on a single-authority repo

Verification gate:

- entity identity is present in canonical truth tables and flows through the obligation and receipt lifecycle without adding a parallel mutation path

## Exact Keep / Remove / Archive Matrix

### Keep

- `supabase/migrations/*`
- `supabase/functions/stripe-webhook/index.ts`
- `pages/index.tsx`
- `pages/api/watchdog/failed-obligations.ts`
- `pages/api/watchdog/emit-overdue-webhook.ts`
- `pages/api/integrations/watchdog-receiver.ts`
- one intake commit route only
- `scripts/*`
- `sql/verify/*`
- `sql/execute/*`
- `control/*`
- `constitution/*`
- `checklists/*`
- `docs/*`

### Remove

- `pages/api/webhook.ts`
- `pages/api/integrations/stripe-webhook.ts`
- `pages/api/integrations/stripe-webhook.stashed.ts`
- `WATCHDOG_SHARED_SECRET.loval.env..txt`
- `spine/migrations/.env.local.txt`
- `Autokirk-Future/`
- one of the duplicate intake commit routes

### Archive or Remove After Review

- `spine/`
- `supabase/snippets/`
- `src/app/intake-test/` if it no longer serves an intentional purpose

## Recommended Order of Actual PRs or Commits

1. secret purge only
2. ingress collapse only
3. intake route collapse only
4. nested tree removal only
5. reference-tree and snippet quarantine only
6. final proof pass and authority recheck
7. layout doc refresh
8. entity binding into kernel truth

This ordering keeps each change set reviewable and reversible.

## Definition of Done

Cleanup is done when:

- the repo has one ingress authority
- the repo has one intake commit route
- the repo has one executable migration tree
- the nested duplicate root is gone
- secret-bearing residue is gone
- proof still passes
- `docs/SYSTEM_LAYOUT.md` still matches reality after the cleanup
- entity identity is bound into canonical truth after cleanup, not left as an external legal abstraction

## Immediate Recommended Next Action

Start with Phase 1.

Reason:

- it removes the highest-risk residue first
- it does not change runtime logic
- it reduces the chance of preserving compromised credentials while structural cleanup continues
