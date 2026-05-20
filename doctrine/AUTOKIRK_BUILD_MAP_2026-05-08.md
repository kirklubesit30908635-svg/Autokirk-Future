# AutoKirk Future — Build Map

**Date:** 2026-05-08
**Status:** Canonical execution sequence
**Companion files:** `AUTOKIRK_DOCTRINE_AMENDMENT_2026-05-08.md`, `AUTOKIRK_CURRENT_STATE_2026-05-08.md`

This file sequences the path from the verified current state to a marketable, infrastructure-tier product. Phases are ordered by structural dependency, not by aspiration. Each phase has a defined exit criterion. The path is doctrine-aligned with the 2026-05-08 amendment: one universal product, no vertical Faces as code, no onboarding templates, hash chain first.

---

## Phase 1 — Tamper-Evident Multi-Tenant Kernel

**Window:** 4–6 weeks
**Exit criterion:** A paying tenant other than KDH can sign up via Stripe, receive a unique board URL, and view their own obligations and cryptographic receipts. Cross-tenant data leakage is structurally impossible at both write and read layers.

### Step 1.1 — Hash Chain Port from `udwzexjwhkvsyeihcwfw`

Highest-priority port. Receipts must become cryptographic artifacts before any infrastructure-tier capability (Receipt API, Compliance Licensing, audit cert) is credible.

Port targets:
- Add `chain_key text`, `seq bigint`, `prev_hash text`, `hash text` columns to `ledger.events`.
- Create `ledger.chain_heads` (id, workspace_id, chain_key, head_hash, seq, updated_at). Default head_hash = `'GENESIS'`. Default seq = 0.
- Decide receipts location: either move receipts to `ledger.receipts` matching Operator OS pattern, or add hash columns to `receipts.receipts` and create `receipts.receipt_heads`. Prefer the Operator OS pattern (`ledger.receipts`) for doctrine consistency.
- Create `ledger.receipt_heads` (parallel to chain_heads).
- Implement kernel-side hash computation on insert. Hash inputs: canonical event payload + prev_hash + seq + workspace_id. Use sha256.
- Wrap kernel resolver functions (`resolve_with_proof`, `resolve_with_insufficient_proof`, `resolve_rejected`, `resolve_payment_performance_obligation`, `resolve_overdue_obligations`) so every event and every receipt write goes through chain head update atomically.

Migration extraction: query the older instance for the migration files that introduced these columns and tables. Adapt them to the AutoKirk Future migration chain numbering.

### Step 1.2 — RLS Enable on All 14 Kernel Tables

Enable RLS on:
- `core.workspaces`, `core.workspace_members`, `core.obligations`, `core.obligation_sources`, `core.proof_contracts`, `core.legal_entities`
- `receipts.receipts` (or `ledger.receipts` if relocated in Step 1.1)
- `ledger.events`, `ledger.idempotency_keys`
- `ingest.source_events`
- `registry.entities`, `registry.entity_workspaces`
- `control.watchdog_emissions`
- `governance.integrity_score_policy`

Policy template: `auth.uid()` must be a member of the workspace via `core.workspace_members`. Service-role bypasses RLS (kernel paths run as owner).

Verify all 13 `api.*` functions still pass through their resolver paths after RLS enable. Run end-to-end: open an obligation, resolve it, confirm receipt issuance under RLS.

### Step 1.3 — `tenant_id` Migration (Additive, Append-Only)

Per doctrine: every migration is append-only. Do not edit prior migrations.

Add `tenant_id uuid` to:
- `core.obligations`
- `receipts.receipts` (or `ledger.receipts`)
- `ledger.events`
- `core.obligation_sources`

Backfill `tenant_id` from `workspace_id` for existing 17 obligations and 14 receipts (KDH and Customer #0001 only). Add NOT NULL constraint after backfill.

Update RLS policies to use `tenant_id` for read-side scoping.

Update projection routes (`/api/obligations/list`, `/api/receipts/recent`) to filter by `tenant_id` derived from authenticated user's workspace membership.

### Step 1.4 — Customer Board Route

`pages/board/[tenant].tsx`. Renders identically for all tenants. Read-only — cannot mutate kernel.

Surface vocabulary: Open, Needs Proof, Overdue — System Acting, Sealed, Failed.

Components:
- Obligation list with state badges, due-date display, proof status indicator.
- Receipt panel showing latest closures with hash and verifier link (one-click receipt verification view).
- Watchdog state surface (when emissions exist for this tenant).
- Integrity score (existing entity_integrity_score_view, scoped to tenant).

No vertical-specific UI, layouts, or copy. Generic operator surface.

### Step 1.5 — Stripe-Driven Tenant Provisioning

Flow:
1. Operator visits `autokirk.com`, clicks Subscribe.
2. Stripe Checkout for $300–$400/mo Operator tier. (Final pricing per Strategic Placement.)
3. Stripe webhook hits `/api/stripe/webhook` → triggers `api.create_workspace_for_tenant(stripe_customer_id, email)` (new kernel function).
4. New workspace created, tenant_id assigned, magic-link email sent with board URL.
5. Operator clicks link, lands on board, sees: "Define your first obligation."
6. Done. No founder bandwidth per onboarding.

Exit Phase 1 when this flow completes end-to-end for a non-KDH tenant.

---

## Phase 2 — Wedge Customer Landing

**Window:** 6–12 weeks (begins immediately after Phase 1 exits)
**Exit criterion:** Five paying tenants outside KDH and outside Customer #0001. One documented leakage capture sentence from a paying tenant.

### Step 2.1 — Universal Onboarding Surface

Single screen on first board visit: "Define your first obligation."

Form fields:
- `obligation_code` (free text + slug normalization)
- `truth_burden` (radio: promise / performance — with one-line definition each)
- Description (optional free text)
- Proof requirement (free text — what evidence will close this?)
- Due date (optional)

That is the entire onboarding. No vertical templates. No industry selection. No "complete your profile" flows.

### Step 2.2 — Marketing Content Pages by Vertical (SEO and Conversion)

Verticalization lives at the marketing layer. Build content pages for high-leakage segments:
- `autokirk.com/marine` — content for marine mechanics, marina services, dock operators
- `autokirk.com/trades` — content for plumbers, electricians, HVAC, roofers
- `autokirk.com/auto` — content for auto repair, mobile mechanics
- `autokirk.com/contractors` — content for general contractors, remodelers

Each page: industry-specific copy, leakage statistics (cite ENR, CFMA, MGI), example obligation codes operators in that industry might track, testimonials when available. All pages funnel to the same `/signup` flow which provisions the same product.

Marketing copy and SEO are the only places verticals appear externally. Product remains universal.

### Step 2.3 — Cold Outreach to First 5 Paying Tenants

Profile criteria:
- $500K–$2M annual revenue
- Concrete deliverables (not knowledge work)
- Existing dispute exposure
- Already pays $200–500/mo for some workflow tool

Outreach channels: industry-specific (marine: dock owner forums, marine mechanic groups; trades: contractor-focused communities; etc.).

Pitch is the URL plus the artifact: "Paste this URL into your tools. Watch your obligations close in real time. Get a receipt your customer can verify."

### Step 2.4 — Document One Leakage Capture

From one of the 5 paying tenants, document: "AutoKirk caught $X this quarter for [tenant]." This sentence is the marketing artifact for the next 12 months. It transforms the strategic placement from theoretical to demonstrated.

---

## Phase 3 — Edge Accumulation

**Window:** 3–6 months (begins after Phase 2 exits)
**Exit criterion:** Receipt API generates measurable revenue. Two verticals operating from the same product. Knowledge layer comparing AI proposals to actual receipt outcomes.

### Step 3.1 — Receipt API Alpha

Operators embed AutoKirk receipts in their own customer-facing artifacts (invoice attachments, customer portal, email confirmations). Stripe-style usage pricing: $0.10–$1.00 per receipt issued. This is when AutoKirk transitions from subscription product to infrastructure category.

Network effect activation point: receipts get seen by operators' customers, who ask how they got them, who sign up themselves.

### Step 3.2 — Knowledge Schema Port (Staged)

Now that paying tenants generate real receipts, port the knowledge layer in priority order:

1. `findings` — AI-detected anomalies, leakage signals, dispute patterns.
2. `recommendations` — AI-authored governed action drafts. Comment from Operator OS: "These are not mutations. They are candidate proposals compatible with the kernel action catalog."
3. `outcome_comparisons` — AI expected impact vs actual receipt-backed outcomes. **The core learning loop.**
4. `evidence_refs` — evidence linkage table.
5. `proposal_emission_log` — immutable trail linking AI recommendations to kernel-emitted proposals.
6. `agent_registry` — intelligence agent configuration per tenant.
7. `signal_catalog`, `action_catalog_map` — supporting catalogs.

Defer indefinitely: `simulation_runs`, `memory_patterns`, `founder_briefs`, `findings_archive`, `proposal_status_history`, `review_actions`. Port only when concrete need exists.

Doctrine alignment: AI proposes through `recommendations` table. Operator authorizes through review surface. Kernel governs by accepting only proposals validated against `core.proof_contracts`. AI never mutates directly.

### Step 3.3 — Signals Schema Port (Coupled to Knowledge)

Detector framework feeds findings.

1. `signal_types`, `detectors`, `detector_event_types` — catalog and routing.
2. `runs` — idempotent execution log per detector invocation.
3. `signal_instances` — de-duplicated, lifecycle-managed signal surface.

Defer: `detector_bindings` policy machinery (multi-workspace rule version control), `metric_observations` (until windowed integrity scoring is needed beyond the existing simple integrity score).

### Step 3.4 — Compliance Licensing Tier Exploration

Approach insurance carriers, franchisors, or industry associations subscribing to receipt streams from member operators. Pricing range: $50K–$200K/year per institutional subscriber. Use case: marine insurance carrier receives real-time evidence of obligation closure rates from insured marina operators, prices premiums accordingly.

This is exploration, not commitment. Validate buyer demand before building. Receipts in hash-chained form (Phase 1.1) are the prerequisite.

---

## Phase 4 — Decision Point

**Window:** 12–24 months from today
**Exit criterion:** A deliberate strategic decision among three viable paths.

### Path A — Subscription Compounding

Stay independent. ARR trajectory $5M–$10M. Multiple verticals served from one product. Receipt API and Operator subscriptions compounding. No external capital. No acquisition.

### Path B — Acquisition

Sell at $20M–$50M to an FSM incumbent, vertical SaaS roll-up, or governance/compliance platform. The hash-chained kernel and receipt invariant is the asset. Buyers cannot rebuild this in their own data layer fast enough to compete.

### Path C — Infrastructure

Receipt API becomes primary revenue. Compliance Licensing scales. AutoKirk becomes the receipt layer for the operator economy, not an application. Highest ceiling, longest runway. Requires sustained execution and likely external capital.

The doctrine does not require choosing Path A, B, or C in advance. Phase 4 begins when the data exists to choose deliberately.

---

## Permanent Deferrals

These appear in older doctrine, memory references, or prior strategic artifacts. They remain deferred unless concrete need surfaces:

- **Watchdog kill-switch authority.** No active threats. Premature defense.
- **`simulation_runs`** from Operator OS knowledge schema. Counterfactual / forecast machinery. Port only when prediction becomes a product feature.
- **`memory_patterns`** from Operator OS knowledge schema. Long-lived institutional memory. Port only when the comparison loop produces enough signal to distill patterns.
- **`founder_briefs`** from Operator OS knowledge schema. Cross-face strategic summaries. Currently a doctrine and conversation artifact; not yet a kernel-tier need.
- **Vertical Faces as separate code or product.** Permanently retired per 2026-05-08 amendment.

---

## Phase 1 Step 1 — What Ships This Week

If only one thing ships in the next seven days, it is **Step 1.1: Hash Chain Port**.

Specific subtasks:

1. Query `udwzexjwhkvsyeihcwfw` for the migration files that built `ledger.events` hash columns and `ledger.chain_heads`.
2. Adapt those migrations into the AutoKirk Future migration chain.
3. Apply to `aiuicbyufelqdeiwhmyi` via Supabase migrations.
4. Verify hash chain integrity by issuing a test obligation through `api.resolve_with_proof` and confirming chain advances.
5. Repeat for receipts hash chain.
6. Commit migrations to Autokirk-Future repo.

Engineering effort: a few focused days. Strategic value: the entire infrastructure-tier ceiling.

---

SEALED 2026-05-08
BUILD MAP COMPLETE
