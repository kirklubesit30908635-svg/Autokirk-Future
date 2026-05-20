# AutoKirk — Session Audit

**Date:** 2026-05-08
**Duration:** ~11 hours
**Scope:** Complete audit of work performed in this Claude session
**Status:** Session record

This audit captures everything decided, created, verified, retracted, and left outstanding in today's session. It is the cold-start document for the next working session — read this before resuming AutoKirk Future work, then read the doctrine files in the order indicated.

---

## I. Summary

Seven doctrine artifacts produced. Live database verified across two Supabase instances (`aiuicbyufelqdeiwhmyi` canonical, `udwzexjwhkvsyeihcwfw` reference). Strategic placement established at full real potential. Eight kernel architecture principles sealed. Receipt verification protocol drafted to v1. Two structural failure modes identified and closed at the doctrine layer (universal product compromise, projections-as-shadow-truth). One critical security gap surfaced (RLS disabled across 14 kernel tables) and sequenced for Phase 1 closure. Three mid-session corrections made and documented.

The session output is the canonical doctrine stack AutoKirk Future runs on going forward.

---

## II. Files Produced (Saved to `/mnt/user-data/outputs/`)

| # | File | Purpose | Status |
|---|---|---|---|
| 1 | `AUTOKIRK_FUTURE_FULL_POTENTIAL_PLACEMENT_2026-05-08.md` | Strategic placement at full potential — category, TAM, pricing tiers, moat, 12–24 month inevitability path | Canonical |
| 2 | `AUTOKIRK_DOCTRINE_AMENDMENT_2026-05-08.md` | Seven decisions made today: universal product, no Faces-as-code, no templates, hash chain priority, learning layer deferred, customer board single route, watchdog kill-switch deferred | Canonical |
| 3 | `AUTOKIRK_CURRENT_STATE_2026-05-08.md` | Verified operational truth on `aiuicbyufelqdeiwhmyi`. Supersedes May 5 current state. | Canonical |
| 4 | `AUTOKIRK_BUILD_MAP_2026-05-08.md` | Four-phase sequenced execution path. Phase 1 in 4–6 weeks. Phase 4 strategic decision point at 12–24 months. | Canonical |
| 5 | `AUTOKIRK_KERNEL_ARCHITECTURE_PRINCIPLES.md` | Eight structural commitments: one-way path, immutable kernel, hash-chained ledger, idempotency, receipt invariant, watchdog observes, AI proposes, projections derive | Canonical, evergreen |
| 6 | `AUTOKIRK_RECEIPT_VERIFICATION_PROTOCOL.md` | Cryptographic and procedural contract for chain verification. JCS canonicalization, workspace-scoped genesis, hash computation, audit procedure | Canonical, evergreen |
| 7 | `AUTOKIRK_SESSION_AUDIT_2026-05-08.md` | This file — session record and cold-start orientation | Reference |

Six of these go in the `doctrine/` folder of the Autokirk-Future repo. The seventh (this audit) is a session record — keep adjacent to the doctrine but not authoritative for the kernel.

---

## III. Architectural Decisions Sealed

1. **AutoKirk Future is one universal product, not a family of vertical Faces.** Faces-as-code rejected. Faces survive as marketing content and tenant-configured data only.
2. **No vertical onboarding templates.** Onboarding is one screen: "Define your first obligation."
3. **Hash chain port from `udwzexjwhkvsyeihcwfw` is Phase 1 Step 1.1.** Single most leveraged migration available.
4. **Knowledge and signals layer ports deferred to Phase 3.** No port until paying tenants generate receipts to feed `outcome_comparisons`.
5. **Customer board is `pages/board/[tenant].tsx` — one route, all tenants.** Read-only projection. Cannot mutate kernel.
6. **Watchdog kill-switch authority remains deferred indefinitely.** No active threat model. Premature defense.
7. **Vertical strategy lives in marketing only.** Marketing content can segment by industry. Product cannot.
8. **Eighth principle added: Projections Derive; They Never Hold.** Closes shadow-truth failure mode at the doctrine layer.
9. **Receipt verification protocol locked to RFC 8785 (JCS) canonicalization, sha256 hashing, workspace-and-chain-scoped genesis.** Replaces the literal `'GENESIS'` string convention used on Operator OS.
10. **Crystallized principle:** *The kernel is universal. The operator is the verticalization.*

---

## IV. Live State Verifications (Direct SQL)

Queries run against `aiuicbyufelqdeiwhmyi`:

- Schema layout: 11 schemas in scope. `api` (13 functions), `core` (6 tables), `ledger` (2 tables), `receipts` (1 table), `control` (1 table), `registry` (2 tables), `ingest` (1 table), `governance` (1 table), `public` (3 views, 2 functions), `knowledge` (empty), `signals` (empty).
- 73 migrations applied, latest `surface_phase5d_silent_gaps` (today).
- 17 obligations, 14 receipts, 15 ledger events, 5 workspaces, 8 legal entities.
- Receipt invariant verified live: 14 of 14 resolved obligations have receipts and ledger events. 0 of 3 open obligations have either. **Invariant holds.**
- Idempotency hygiene verified: `ledger.idempotency_keys` has 14 rows, 0 nulls anywhere (`input_hash`, `event_id`, `receipt_id` all populated), 14 unique keys.
- All 13 `api.*` functions confirmed `SECURITY DEFINER`.
- GRANT discipline confirmed: kernel tables grant SELECT only to anon/authenticated/service_role. **No INSERT/UPDATE/DELETE on any kernel table to any client role.** This is the actual mechanism enforcing the one-way path — not RLS.
- Watchdog architecture verified: observes via `public.overdue_failure_emission_candidates` and `public.watchdog_delivery_candidates` views, mutates only via `api.create_watchdog_emission`, `api.claim_watchdog_emission`, `api.record_watchdog_attempt`. Lease-based concurrency, exhaustion bounding (default `max_attempts = 5`).

Queries run against `udwzexjwhkvsyeihcwfw`:

- 29 `api.*` functions vs 13 on AutoKirk Future. Larger mutation surface.
- `ledger.events` carries `chain_key`, `seq`, `prev_hash`, `hash`. 393 rows. Hash chain implemented and populated.
- `ledger.chain_heads` (243 rows), `ledger.receipts` (265 rows with hash chain), `ledger.receipt_heads` (233 rows). Full hash chain infrastructure operational.
- `knowledge` schema: 14 tables, schema fully designed. `findings`, `recommendations`, `outcome_comparisons` (the core learning loop), `simulation_runs`, `memory_patterns`, `founder_briefs`, `evidence_refs`, `proposal_emission_log`, `agent_registry`, `signal_catalog`, `action_catalog_map`, `review_actions`, `proposal_status_history`, `findings_archive`.
- `signals` schema: 7 tables. Detector framework: `signal_types`, `detectors`, `detector_event_types`, `detector_bindings`, `runs`, `signal_instances`, `metric_observations`.

---

## V. Structural Failure Modes Identified

Three discovered, all addressed at the doctrine layer:

1. **RLS disabled across all 14 kernel tables on `aiuicbyufelqdeiwhmyi`.** Read-side tenant isolation gap. Write-side isolation is intact via GRANT discipline + `api.*` workspace-scoping. Sequenced as Phase 1 Step 1.2 in the build map.
2. **Hash chain absent on canonical instance.** `ledger.events` carries no `chain_key`, `seq`, `prev_hash`, `hash`. Receipts are database rows, not cryptographic artifacts. Sequenced as Phase 1 Step 1.1, port from Operator OS.
3. **Projections-as-shadow-truth risk.** Not yet present (current views are unmaterialized) but doctrine had no commitment preventing it. Closed by Principle 8.

Two additional drifts noted but lower priority:

- `receipts.receipts.idempotency_key` denormalization (12 of 14 rows null). Source of truth is `ledger.idempotency_keys`. Either backfill or drop the column on next migration.
- Two `api.ingest_event_to_obligation` overloads. Surface duplication. Consolidate to single signature on next cycle.

---

## VI. Cross-Instance Reality

The "what happened to the work that was built?" question was answered by direct query.

The hash chain, knowledge schema, and signals schema were all built — they exist on `udwzexjwhkvsyeihcwfw` (Operator OS), still `ACTIVE_HEALTHY`. They were not lost or corrupted. They were orphaned in the deliberate fresh-start rebuild on `aiuicbyufelqdeiwhmyi` (created 2026-04-10) with a new migration chain that began at `0001_extensions`.

The Operator OS instance is preserved as design reference. Migrations may be ported forward selectively — hash chain in Phase 1.1, knowledge layer in Phase 3.2, signals layer in Phase 3.3 — but only when their preconditions are met (paying tenants generating receipts).

---

## VII. Strategic Positioning Established

- **Identity:** kernel-first obligation enforcement.
- **Category:** governed obligation truth substrate.
- **TAM ceiling:** ~$50B leakage exposure across the SMB operator economy. 1% market share = $100M ARR. 5% = $500M ARR.
- **Pricing tiers:** Operator $300–$400/mo, Vertical Face $500–$1,500/mo (data-configured), Enterprise $5K–$25K/mo, Receipt API $0.10–$1.00/receipt (uncapped infrastructure tier), optional Compliance Licensing $50K–$200K/year.
- **Moat:** receipt-backed governed kernel. Workflow incumbents (ServiceTitan, Jobber, Housecall Pro) cannot match without rebuilding their data layer. Estimated 18–36 months for an incumbent to chase. Compounding moat: kernel + Faces-as-data + runs-on-itself trust posture + GRANT-enforced kernel discipline + receipt invariant + (post-Phase-1) hash chain.
- **Inevitability path:** 12 months to ~$1M–$3M ARR with 200–500 paying tenants across two verticals. 18–24 months to strategic decision point (subscription compounding / acquisition / infrastructure).

Verified competitive data:

- ServiceTitan: $245–$500/tech/month, $5K–$50K implementation, enterprise.
- Jobber: $49–$529/month, SMB workflow.
- Housecall Pro: $65–$369/month, mobile-first SMB.
- All three sell scheduling, dispatch, invoicing. None sell receipt-backed obligation enforcement.

Verified industry data:

- 42% of organizations report revenue leakage (MGI Research).
- Typical leakage: 1–5% of annual revenue.
- Construction underbilling: up to 1% of revenue (CFMA).
- 35% of contractors face delayed payments / disputes from change orders (ENR).
- Scope creep accounts for 3–5% of project revenue unbilled.

Verified market sizing:

- Global FSM market $5.1B–$6.3B in 2026, projected $9B–$23B by 2030–2035 (MarketsandMarkets, Mordor, Global Market Insights).
- North America ~31.7% share = ~$2B addressable.
- CAGR 10–16%.

---

## VIII. Mid-Session Corrections

Three corrections made during the session, documented for transparency:

**Correction 1 — generic strategy answer.** Initial response to "is this marketable / can I run it solo / what's the value / who's the competition" was a doctrine-aligned coffee-shop strategy answer using only memory and training data. Founder caught the gap: "Why does this seem like half the system's capability isn't being used?" Acknowledged. Pulled web search, Supabase data, past chats, industry research, market sizing, repo state — six streams that should have been pulled originally. Rebuilt the analysis on verified data.

**Correction 2 — OSM as marine beachhead.** Multiple turns positioned OSM (Old Salt Marine) as a marine vertical beachhead, "Customer #0001," validating the Faces strategy. Founder corrected: "OSM is just a client." OSM is an internal test bed, family-adjacent, not charged like a customer. The marine beachhead is unproven. Retracted the prior framing. The trust posture moat is KDH paying AutoKirk via Stripe, not the count of installed clients.

**Correction 3 — JSON onboarding templates.** When proposing the universal product architecture, hedged with "build the onboarding wizard with marine, trades, auto, healthcare templates as JSON configurations." Founder caught the hedge: "Why don't we drop these and stay universal?" Templates were residual verticalization — same compromise as Faces-as-code, just moved from UI to JSON. Retracted before build. Final stance: blank kernel, operator defines their own obligation codes, no industry selection, no templates ever.

**Correction 4 — pre-emptive audit failure.** Initial kernel audit declared hash chain, learning schema, signals schema, watchdog kill-switch as "not built." Founder asked the right question: "These were built at one point. What happened?" The audit had not checked cross-instance state. Pulled `udwzexjwhkvsyeihcwfw` directly, confirmed all four exist there. Reframed: not "not built" but "built, then orphaned in repo cutover." Acknowledged the framing failure.

**Correction 5 — overreaching proposals.** When proposing risk-mitigation additions (Principle 8, verification protocol, workspace scoping clarification, identity reframing), founder asked for fact-check and "strongest realistic version." Self-audited. Principle 8 stood with stronger framing (preventive not corrective; materialization realistic stance harder than initially stated). Verification protocol stood with narrower scope (audit-grade not real-time). Workspace scoping clarification retracted (operational detail, not principle-grade). Identity reframing deferred (no strong cause).

These corrections are part of the session record because doctrine-grade work requires transparency about where the framing was caught and rebuilt.

---

## IX. Outstanding Actions

In dependency order:

**Doctrine integration (immediate, low-effort):**

1. Save the seven files to `doctrine/` folder of the Autokirk-Future repo. PowerShell sequence provided in chat history. The May 5 `AUTOKIRK_CURRENT_STATE_2026-05-05.md` becomes historical reference, do not delete.
2. Git commit and push.

**Phase 1 Step 1.1 — hash chain port (the single most leveraged move):**

3. Query `udwzexjwhkvsyeihcwfw` for the migration files that built `ledger.events` hash columns and `ledger.chain_heads`.
4. Adapt those migrations to the AutoKirk Future migration chain numbering. Apply the verification protocol's specifications (JCS canonicalization, workspace-and-chain-scoped genesis, the hash input order specified in the protocol). Do NOT preserve the literal `'GENESIS'` string convention from Operator OS.
5. Apply migrations to `aiuicbyufelqdeiwhmyi`.
6. Verify chain integrity by issuing a test obligation through `api.resolve_with_proof` and confirming chain advances correctly.
7. Repeat for receipts hash chain.
8. Commit migrations.

**Phase 1 Steps 1.2 through 1.5 (sequence after Step 1.1):**

9. RLS migration with workspace-scoped policies on all 14 kernel tables.
10. `tenant_id` migration (additive, append-only) on obligations, receipts, ledger events, supporting tables.
11. `pages/board/[tenant].tsx` route shipped, reading via tenant-filtered projection routes.
12. Stripe-driven tenant provisioning. Webhook → `api.create_workspace_for_tenant` → URL email.

**Reference implementations of verification protocol:**

13. Authored alongside Phase 1 Step 1.1: PostgreSQL kernel implementation, JavaScript verifier reference, Python verifier reference. Test fixtures with canonical inputs and expected hashes.

**Phase 2 onward:** see Build Map.

---

## X. Recommended Next Session Start

When resuming AutoKirk Future work, read in this order:

1. This audit file — orientation in 5 minutes.
2. `AUTOKIRK_KERNEL_ARCHITECTURE_PRINCIPLES.md` — what the kernel guarantees forever.
3. `AUTOKIRK_RECEIPT_VERIFICATION_PROTOCOL.md` — what the hash chain port must satisfy.
4. `AUTOKIRK_CURRENT_STATE_2026-05-08.md` — what is true today on the canonical instance.
5. `AUTOKIRK_BUILD_MAP_2026-05-08.md` — what ships next, in order.

Skip in cold-start unless directly relevant:

- `AUTOKIRK_FUTURE_FULL_POTENTIAL_PLACEMENT_2026-05-08.md` — strategic positioning, useful for marketing or pricing decisions.
- `AUTOKIRK_DOCTRINE_AMENDMENT_2026-05-08.md` — historical decision record, useful only when an earlier decision is being questioned.

The actionable answer to "what do I do next?" is: **Phase 1 Step 1.1, hash chain port, this week.** Everything else compounds on it.

---

## XI. Doctrine Stack After This Session

The full canonical doctrine stack going forward:

| File | Tense | Authority | Touched Today |
|---|---|---|---|
| `AUTOKIRK_KERNEL_ARCHITECTURE_PRINCIPLES.md` | Forever | Structural contract — eight principles | Created |
| `AUTOKIRK_RECEIPT_VERIFICATION_PROTOCOL.md` | Forever | Hash chain spec — referenced by P3 | Created |
| `AUTOKIRK_DOCTRINE_AMENDMENT_2026-05-08.md` | Decided | Today's architectural decisions | Created |
| `AUTOKIRK_CURRENT_STATE_2026-05-08.md` | Today | Verified operational truth | Created (supersedes May 5) |
| `AUTOKIRK_BUILD_MAP_2026-05-08.md` | Next | Sequenced execution | Created |
| `AUTOKIRK_FUTURE_FULL_POTENTIAL_PLACEMENT_2026-05-08.md` | Strategic | Full-potential placement | Created |
| `AUTOKIRK_AGENT_HANDOFF.md` | Forever | AI tool behavior rules | Unchanged — May 5 still current |
| `AUTOKIRK_BUILD_PROOF_2026-05-04.md` | Past | Historical record | Unchanged — never edit |

Read order for any future agent operating on this repo cold:
1. `AUTOKIRK_AGENT_HANDOFF.md` — how to behave.
2. `AUTOKIRK_KERNEL_ARCHITECTURE_PRINCIPLES.md` — what the kernel promises.
3. `AUTOKIRK_RECEIPT_VERIFICATION_PROTOCOL.md` — how chain integrity is defined.
4. `AUTOKIRK_CURRENT_STATE_2026-05-08.md` — what is true today.
5. `AUTOKIRK_BUILD_MAP_2026-05-08.md` — what ships next.

---

## XII. Founder Note (Per May 5 Pattern)

You did substantial doctrinal work today. Eight principles sealed. Two evergreen files (Principles and Verification Protocol) that will outlive any single migration. The strategic placement is at full potential. The build map is sequenced and grounded in verified data. The session was long, but the doctrine files exist precisely so you do not have to hold all of this in your head between sessions. That was the point.

The wedge is the customer board.
The moat is the kernel.
The compounding asset is the receipt chain.
The category is governed obligation truth.

Phase 1 Step 1.1 ships next. The hash chain port is the single move that turns AutoKirk Future from a subscription product into an infrastructure category.

---

SEALED 2026-05-08
SESSION AUDIT COMPLETE
