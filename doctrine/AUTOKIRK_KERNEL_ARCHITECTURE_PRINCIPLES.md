# AutoKirk Kernel Architecture Principles

**Status:** Canonical, evergreen
**Authority:** Founder-sealed
**Citation:** All migrations, PRs, AI-generated changes, and architectural decisions cite this file in the Kernel Interrogation gate.

This file states the eight structural commitments AutoKirk makes at the kernel layer. These commitments are forever-tense. They do not change with releases, customer counts, or strategic placement. Amendment requires a sealed founder decision and a doctrine amendment artifact (see *Amendment Process*).

Operational state (what is true today on a given Supabase project, what is shipped vs pending) lives in `AUTOKIRK_CURRENT_STATE_*.md`. Sequenced execution lives in `AUTOKIRK_BUILD_MAP_*.md`. This file is the structural contract underneath both.

---

## Principle 1 — One-Way Path Through the Kernel

**Statement.** All state mutation in AutoKirk flows through `api.*` SECURITY DEFINER functions. No client role — `anon`, `authenticated`, `service_role`, or `public` — holds INSERT, UPDATE, or DELETE privileges on any kernel table. The kernel is reachable only through its governed entry points.

**Mechanism.** Privilege discipline at the GRANT layer. Kernel tables grant `SELECT` only to client roles. Write privileges are owner-only. The `api.*` functions are SECURITY DEFINER and run as the owner role with elevated privileges. A Supabase client with the anon key cannot write to `core.obligations`, `ledger.events`, `receipts.receipts`, `control.watchdog_emissions`, or any other kernel table directly — regardless of RLS state, regardless of the application code that calls it.

**Forbids.** Direct DML against kernel tables. Application-layer state mutation that bypasses `api.*`. Service-role shortcuts that skip kernel governance. Any code path that reaches kernel state without going through a SECURITY DEFINER function.

---

## Principle 2 — Immutable Kernel

**Statement.** Kernel state can only grow. Past events, past receipts, past obligations cannot be edited or deleted. Resolution is a new event and a new receipt; it is never a mutation of the original obligation's identity. The kernel records what happened — it does not revise it.

**Mechanism.** No UPDATE or DELETE privileges granted to any client role on kernel tables. The `api.*` resolution functions append: they write a resolution event, write a receipt, and update the obligation's status — but the obligation row's identity, creation timestamp, and original truth burden are never rewritten. Hash chaining (Principle 3) makes the immutability cryptographically verifiable.

**Forbids.** "Fixing" historical state by editing past records. Deleting receipts to suppress a closure. Reordering events. Retroactively changing an obligation's truth burden after the fact. Any pattern that treats the kernel as a mutable workflow database.

---

## Principle 3 — Hash-Chained Ledger and Receipts

**Statement.** Every event in the ledger and every receipt is hash-linked to its predecessor in the same chain. The ledger and the receipt stream are externally verifiable cryptographic artifacts, not merely database tables. A receipt is not a row — it is a position in a chain.

**Mechanism.** Each `ledger.events` row carries `chain_key`, `seq`, `prev_hash`, `hash`. Each receipt row carries the same. Chain heads are tracked per `(workspace_id, chain_key)` in `ledger.chain_heads` and `ledger.receipt_heads`. Hash computation, canonical serialization, and genesis convention are specified in `AUTOKIRK_RECEIPT_VERIFICATION_PROTOCOL.md`. The `api.*` write functions compute the hash and update the chain head atomically with the event or receipt write; failure of either rolls both back.

**Forbids.** Out-of-order writes within a chain. Retroactive insertion. Hash recomputation after the fact. Receipt issuance that does not advance the receipt chain head. Any verification path that trusts a receipt without verifying its position in the chain back to genesis. Any deviation from the canonical serialization specified in the verification protocol.

---

## Principle 4 — Idempotency on Every Mutation

**Statement.** Every kernel write is idempotent. Every `api.*` mutation accepts an `idempotency_key`. Re-submission of the same key returns the same outcome. Re-submission of the same key with different input raises a conflict, never a silent divergence. The kernel is replay-safe.

**Mechanism.** `ledger.idempotency_keys` records `(idempotency_key, input_hash, event_id, receipt_id, obligation_id, resolution_type, created_at)` with a `UNIQUE` constraint on `idempotency_key` and a NOT NULL constraint on `input_hash`. The `api.*` mutation functions check the table on entry: if the key exists and `input_hash` matches, return the recorded event and receipt; if the key exists and `input_hash` differs, raise an idempotency conflict; if the key does not exist, perform the mutation and insert the idempotency row in the same transaction.

**Forbids.** Mutations without an idempotency key. Idempotency tables with nullable input_hash. Re-submission paths that produce duplicate side-effects. State divergence from replayed events.

---

## Principle 5 — Receipt Invariant

**Statement.** Every resolved obligation leaves a receipt. Closure without a receipt is structurally impossible. The receipt is the terminal artifact of the obligation lifecycle and the only legitimate evidence that an obligation has closed.

**Mechanism.** The kernel resolver functions (`api.resolve_with_proof`, `api.resolve_with_insufficient_proof`, `api.resolve_rejected`, `api.resolve_payment_performance_obligation`, batch resolvers) write the resolution event, write the receipt, advance the chain heads (Principle 3), and update obligation status in a single transaction. Failure of any step rolls back the entire resolution. The obligation cannot exit the `open` state through any other code path.

**Forbids.** Marking an obligation resolved without a receipt. Issuing a receipt without a corresponding ledger event. Resolution paths that bypass the kernel resolver functions. Any application-layer workaround that treats resolution as a status update on the obligation row alone.

---

## Principle 6 — Watchdog Observes; Never Mutates Outside the Kernel

**Statement.** The watchdog has no special privileges. It reads kernel state through projection views and writes only through the same `api.*` surface as any other consumer. The watchdog has no kill-switch authority. It cannot quarantine, suspend, or correct kernel state.

**Mechanism.** The watchdog reads from `public.overdue_failure_emission_candidates` and `public.watchdog_delivery_candidates` — derived projections that compute eligibility from kernel state without holding their own truth. Its writes go through `api.create_watchdog_emission`, `api.claim_watchdog_emission`, and `api.record_watchdog_attempt` — the same SECURITY DEFINER pattern as obligation resolution. Lease-based concurrency on `control.watchdog_emissions` (CHECK constraint on `delivery_status` in {pending, delivered, failed, exhausted}, default `max_attempts = 5`) bounds delivery and exhaustion behavior. The watchdog has no privilege to mutate `core.obligations`, `ledger.events`, or `receipts.receipts` directly.

**Forbids.** Watchdog code that writes to kernel tables outside `api.*`. Privileged watchdog roles. Kill-switch authority added without a concretely defined kernel compromise scenario and a sealed founder decision. Watchdog acting on behalf of an operator without a governed proposal (Principle 7).

---

## Principle 7 — AI Proposes; Kernel Governs; Operator Authorizes

**Statement.** AutoKirk's intelligence layer (the `knowledge` schema) produces findings, recommendations, simulations, and learned patterns. It does not mutate the kernel. AI-authored actions reach the kernel only as proposals through the same `api.*` surface, requiring operator authorization, recorded in an immutable emission log.

**Mechanism.** The `knowledge` schema has no GRANT to write kernel tables. Knowledge agents operate in defined modes (`observer`, `advisor`, `simulation`, `proposal_author`) recorded in `knowledge.agent_registry`. Recommendations are drafted into `knowledge.recommendations` with `status` in {draft, ready, emitted, rejected, superseded}. To act, a recommendation must be authorized by an operator; the authorization invokes the standard `api.*` mutation path; the transition from recommendation to kernel-emitted proposal is recorded immutably in `knowledge.proposal_emission_log`. The `knowledge.outcome_comparisons` table compares AI-expected impact against actual receipt-backed outcomes, training the system from kernel-verified truth rather than from its own predictions.

**Forbids.** AI directly resolving obligations. AI issuing receipts. AI creating watchdog emissions outside the proposal path. Knowledge-layer code with kernel write privileges. Auto-approval flows that bypass operator authorization. Any pattern that lets AI act faster than the operator can govern.

---

## Principle 8 — Projections Derive; They Never Hold

**Statement.** Projections derive from kernel state on read. They hold no truth of their own. The read-side surface reflects the kernel; it does not become a second kernel.

**Mechanism.** Read-side surfaces are unmaterialized views (`public.*`) that compute from kernel tables (`core.*`, `ledger.*`, `receipts.*`, `control.*`). Default for any new projection: unmaterialized. Materialization is permitted only when (a) refresh is transactionally bound to the source kernel write — typically via triggers on the source table that refresh the materialization in the same transaction — and (b) no client role holds INSERT, UPDATE, or DELETE privileges on the materialized table. Materialization is an exception that must justify itself against this principle in the Kernel Interrogation gate.

**Forbids.** Materialized views without transactional cache invalidation tied to the source write. Standalone "projection tables" populated by application writes. Caching layers (in-database or in-application) that diverge from kernel state under load. Downstream consumers treating projection rows as authoritative. Application-layer code that writes back into a projection table. Any pattern where editing a projection row affects, reflects, or is mistaken for kernel truth.

---

## Application

These principles function as the **Kernel Interrogation gate**. Every migration, PR, RPC, kernel function, projection, and AI-generated change is reviewed against the eight principles before merge. The interrogation pattern:

1. Which principle does this change touch?
2. Is the principle preserved or weakened?
3. If weakened, is there a sealed founder amendment authorizing the weakening?
4. If the change introduces a new code path, does that path satisfy all eight principles unconditionally?
5. If the change is from an AI agent, does it route through the proposal path (Principle 7)?
6. If the change introduces a projection or materialization, does it satisfy Principle 8 (derive, never hold)?

A change that fails any of these questions does not merge. A change that requires weakening a principle requires a doctrine amendment, not a code review override.

---

## Amendment Process

These principles are not subject to refactoring, evolution by accumulation, or quiet deprecation. To amend any principle:

1. Author a doctrine amendment artifact (`AUTOKIRK_DOCTRINE_AMENDMENT_<DATE>.md`) stating the change, the reasoning, and the new structural commitment.
2. Document why the principle as previously stated no longer holds.
3. Update this file with the new statement and a citation to the amending artifact.
4. Mark the amending artifact as canonical.

A weakening of a principle is a structural change to AutoKirk's identity. It is not a code change. It is not a release note. It is an amendment to the kernel's contract with the operator economy that depends on it.

---

## Cross-References

- `AUTOKIRK_RECEIPT_VERIFICATION_PROTOCOL.md` — canonical serialization, hash computation, genesis convention, and chain-walk semantics referenced by Principle 3.
- `AUTOKIRK_DOCTRINE_AMENDMENT_2026-05-08.md` — the universal product amendment.
- `AUTOKIRK_CURRENT_STATE_<DATE>.md` — the operational truth on the current canonical Supabase project.
- `AUTOKIRK_BUILD_MAP_<DATE>.md` — sequenced execution path.
- `AUTOKIRK_AGENT_HANDOFF.md` — how AI tools should behave when operating on this codebase.
- `AUTOKIRK_BUILD_PROOF_*.md` — historical record (never edited).

---

SEALED, EVERGREEN
KERNEL ARCHITECTURE PRINCIPLES — EIGHT