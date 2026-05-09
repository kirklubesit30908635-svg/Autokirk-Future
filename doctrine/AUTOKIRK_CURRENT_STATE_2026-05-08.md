# AutoKirk Future — Current State

**Date:** 2026-05-08
**Status:** Canonical operational truth
**Supersedes:** `AUTOKIRK_CURRENT_STATE_2026-05-05.md`
**Companion files:** `AUTOKIRK_DOCTRINE_AMENDMENT_2026-05-08.md`, `AUTOKIRK_BUILD_MAP_2026-05-08.md`

This file captures the operational state of AutoKirk Future as of 2026-05-08, verified by direct query of the canonical Supabase project and confirmed against the doctrine amendment of the same date.

---

## I. Canonical Locations

| Asset | Location |
|---|---|
| Domain | `autokirk.com` |
| Repo | `Autokirk-Future` (GitHub) |
| Hosting | Vercel, region `iad1` |
| Supabase project | `AutoKirk-Future` (`aiuicbyufelqdeiwhmyi`), region `us-east-1` |
| Stripe account | Kirk Digital Holdings LLC (parent) |
| Operator OS reference instance | `udwzexjwhkvsyeihcwfw` (active healthy, design reference, non-canonical) |

---

## II. Production Status (Verified Live, 2026-05-08)

Direct query of `aiuicbyufelqdeiwhmyi`:

- **73 migrations applied.** Latest: `surface_phase5d_silent_gaps` (today).
- **17 obligations** in `core.obligations`. Two states canonical: `open` and `resolved`.
- **14 receipts** in `receipts.receipts`. Receipt invariant verified — every resolved obligation has a receipt and a ledger event. 14/14.
- **15 ledger events** in `ledger.events`. Append-only.
- **5 workspaces, 7 workspace members.**
- **8 legal entities.** KDH hierarchy populated.
- **2 proof contracts** in `core.proof_contracts`.
- **0 watchdog emissions** in `control.watchdog_emissions`. (Watchdog is structurally ready; has not yet observed an overdue obligation in this instance.)

---

## III. Kernel Discipline (Verified)

The one-way path through the kernel is enforced by **GRANT discipline**, not RLS. This is the actual mechanism:

- Kernel tables grant `SELECT` only to `anon`, `authenticated`, and `service_role`. No INSERT, UPDATE, or DELETE on any kernel table to any client role.
- All 13 functions in the `api` schema are `SECURITY DEFINER`. They run as the owner role, which holds write privileges.
- Mutations are only possible through `api.*` calls. The kernel cannot be bypassed by a Supabase client with the anon key, regardless of RLS state.

The 13 governed mutation functions in `api.*`:

- `commit_intake_candidate`
- `ingest_event_to_obligation` (two overloads — surface duplication, flagged for cleanup)
- `ingest_service_commitment`
- `resolve_with_proof`
- `resolve_with_insufficient_proof`
- `resolve_rejected`
- `resolve_overdue_obligations`
- `resolve_payment_performance_obligation`
- `create_watchdog_emission`
- `claim_watchdog_emission`
- `record_watchdog_attempt`
- `validate_surface`

Watchdog architecture: observes via projection views (`public.overdue_failure_emission_candidates`, `public.watchdog_delivery_candidates`), writes only through `api.*`. Retry discipline, lease-based concurrency, exhaustion bounding (`max_attempts` default 5), CHECK constraint on `delivery_status` ∈ {pending, delivered, failed, exhausted}.

Idempotency model: `ledger.idempotency_keys` with `UNIQUE` constraint on `idempotency_key`, all 14 rows fully populated (no nulls in `input_hash`, `event_id`, or `receipt_id`). Replay-safe.

---

## IV. Structural Gaps (Open Blockers)

The following structural gaps block customer board shipment. They must close before Phase 1 completion (see Build Map):

1. **No `tenant_id` column on `core.obligations`** or related tables. Multi-tenant scoping migration not applied.
2. **RLS disabled on all 14 kernel tables.** Read-side tenant isolation gap. Tables exposed: `core.workspaces`, `core.workspace_members`, `core.obligations`, `receipts.receipts`, `ledger.events`, `ledger.idempotency_keys`, `ingest.source_events`, `core.obligation_sources`, `registry.entities`, `registry.entity_workspaces`, `core.proof_contracts`, `control.watchdog_emissions`, `core.legal_entities`, `governance.integrity_score_policy`. (Write-side isolation is intact via GRANT discipline; read-side is not.)
3. **No hash chain on `ledger.events` or receipts.** Events are append-only by GRANT discipline but not cryptographically chained. Hash columns, sequence numbers, and chain head tracking do not exist on `aiuicbyufelqdeiwhmyi`. They exist and are populated on `udwzexjwhkvsyeihcwfw`.

---

## V. Cross-Instance Reality

Significant infrastructure exists on the prior canonical instance `udwzexjwhkvsyeihcwfw` (AutoKirk Operator OS) that is not present on AutoKirk Future. This is the result of a deliberate fresh-start rebuild on 2026-04-10 — a new Supabase project with a new migration chain — not loss or corruption.

Specifically, on Operator OS:

- **Hash-chained ledger:** `ledger.events` with `chain_key`, `seq`, `prev_hash`, `hash`. 393 rows. `ledger.chain_heads` (243 rows) tracking head state per `(workspace_id, chain_key)`.
- **Hash-chained receipts:** `ledger.receipts` (note: in `ledger`, not `receipts` schema) with `prev_hash`, `hash`, `seq`, `chain_key`. 265 rows. `ledger.receipt_heads` (233 rows).
- **Knowledge schema:** 14 tables. Empty rows but schema fully designed. Includes `agent_registry`, `signal_catalog`, `findings`, `recommendations`, `outcome_comparisons` (the core learning loop), `simulation_runs`, `memory_patterns`, `founder_briefs`, `evidence_refs`, `proposal_emission_log`, `review_actions`, `action_catalog_map`, `proposal_status_history`, `findings_archive`. Doctrine: AI proposes; kernel governs; operator authorizes.
- **Signals schema:** 7 tables. Sophisticated detector framework. Includes `signal_types`, `detectors` (SQL-function-based with `regprocedure` implementation refs), `detector_event_types`, `detector_bindings` (with `effective_during tstzrange`), `runs` (idempotent execution log), `signal_instances` (de-duplicated lifecycle-managed), `metric_observations` (windowed integrity evidence).

Operator OS is preserved as design reference. Migrations from those schemas may be ported forward in Phase 1 (hash chain only) and Phase 3 (knowledge and signals layers, after paying tenants generate receipts to feed them). See Build Map.

---

## VI. Identity, Vocabulary, Trust Posture

**Identity locked:**
> Kernel-first obligation enforcement.

**Category:**
> Governed obligation truth.

**Crystallized principle:**
> The kernel is universal. The operator is the verticalization.

**Operator vocabulary on the surface (locked):**
- Open
- Needs Proof
- Overdue — System Acting
- Sealed
- Failed

These map to kernel state machine outputs (`status` ∈ {open, resolved}, plus derived projections for proof status and overdue handling). Vocabulary lives in the projection layer, not the kernel.

**Trust posture:**
- AutoKirk subscribes to AutoKirk.
- Kirk Digital Holdings LLC pays AutoKirk via Stripe ($201.15 baseline MRR).
- The first paying customer of AutoKirk is the founder's parent entity.
- This is a structural trust artifact and gets prominent placement on `autokirk.com`.

---

## VII. Product Architecture (Per 2026-05-08 Amendment)

- **One universal product.** Single customer board route, identical for all tenants.
- **No vertical Faces as code or product.** Faces survive as marketing content and tenant configuration data only.
- **No vertical onboarding templates.** Onboarding is one screen: define your first obligation.
- **Tenant verticalization is data.** Operators define their own `obligation_code`, `truth_burden`, proof contracts, due dates.
- **Marketing-as-content can segment by vertical.** Product cannot.

---

## VIII. Active Workstream

**Phase 1 of the Build Map.** Tamper-evident multi-tenant kernel. Sequence:

1. Hash chain port from Operator OS to AutoKirk Future.
2. RLS migration with workspace-scoped policies on all 14 kernel tables.
3. `tenant_id` migration (additive, append-only).
4. Customer board route `pages/board/[tenant].tsx`.
5. Stripe-driven tenant provisioning.

Target window: 4–6 weeks. See `AUTOKIRK_BUILD_MAP_2026-05-08.md` for detailed step sequencing.

---

## IX. Deferred Indefinitely

These appear in older doctrine, prior strategic artifacts, or memory references. They are deferred or retired per the 2026-05-08 amendment:

- Watchdog kill-switch authority — deferred (no active threat scenario).
- Vertical Faces as separate code or product — retired.
- JSON onboarding templates per vertical — retired before build.
- Marine Face / Auto Face / Trades Face etc. as products — retired (verticals are content + data only).
- `simulation_runs`, `memory_patterns`, `founder_briefs` from Operator OS knowledge schema — deferred to Phase 3+ (only port when comparison loop produces real signal).
- `core.memberships` view (legacy shim) — retire on next migration cycle.
- One of the two `ingest_event_to_obligation` overloads — consolidate to single signature on next migration cycle.

---

SEALED 2026-05-08
CURRENT STATE COMPLETE
