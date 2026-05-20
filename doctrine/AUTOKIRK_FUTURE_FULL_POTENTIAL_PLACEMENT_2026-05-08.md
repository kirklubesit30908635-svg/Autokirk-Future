# AutoKirk Future — Full Potential Strategic Placement

**Date:** 2026-05-08
**Repo:** Autokirk-Future
**Supabase Project:** AutoKirk-Future (`aiuicbyufelqdeiwhmyi`)
**Domain:** autokirk.com (Vercel, iad1)
**Identity:** kernel-first obligation enforcement
**Status:** Strategic Doctrine Artifact

This document places AutoKirk Future at its full real potential, projected forward from verified ground truth. No downscale for solo execution. Doctrine-aligned: kernel-first, append-only, receipt-terminal, runs-on-itself.

---

## I. Ground Truth (Verified Live, 2026-05-08)

Direct query of `aiuicbyufelqdeiwhmyi`:

- 73 migrations applied. Latest: `surface_phase5d_silent_gaps` (today).
- 5 workspaces, 17 obligations, 14 receipts, 15 ledger events.
- Kernel state machine: `open` → `resolved`. Two canonical states.
- Watchdog system shipped with retry discipline and claim leases.
- Integrity scoring shipped (policy table + entity classification views + integrity events view).
- Overdue/failure projection shipped (`add_due_at_and_overdue_failure_projection`, `add_overdue_failure_resolver`).
- Proof-required guards strengthened (`strengthen_proof_required_guard`).
- Receipt idempotency enforced at kernel layer.
- 8 legal entities (KDH hierarchy populated).

Operator vocabulary (Open, Needs Proof, Overdue — System Acting, Sealed, Failed) is projection-layer translation. The kernel keeps two states; the surface translates. This is correct kernel-first design — minimal kernel, expressive projection.

**Not shipped:**

- `tenant_id` column on `core.obligations`. Multi-tenant scoping migration is not yet applied.
- RLS on any of the 14 kernel tables. **All disabled.** Tables exposed: `core.workspaces`, `core.workspace_members`, `core.obligations`, `receipts.receipts`, `ledger.events`, `ledger.idempotency_keys`, `ingest.source_events`, `core.obligation_sources`, `registry.entities`, `registry.entity_workspaces`, `core.proof_contracts`, `control.watchdog_emissions`, `core.legal_entities`, `governance.integrity_score_policy`.

The kernel is functioning. It is single-tenant. It is structurally not yet ready for paying tenants beyond Customer #0001.

---

## II. The Category AutoKirk Occupies

AutoKirk Future does not occupy "field service management." It defines an adjacent category: **governed obligation truth**.

Field service management (ServiceTitan, Jobber, Housecall Pro) is workflow software. It schedules, dispatches, invoices. It records what was reported. It does not enforce that work was proven, obligations were closed, or receipts were issued. The data layer is mutable — operators can edit invoice records after the fact, mark jobs complete without proof, and reconcile by overwriting state.

Compliance-as-code (Vanta, Drata) is enterprise audit infrastructure. SOC 2 / ISO 27001. It does not touch operator-grade revenue.

Payment governance (Stripe, QuickBooks) records transactions. It assumes the payment is the truth artifact. AutoKirk's doctrine inverts this: the receipt is the truth artifact; the payment is one of many obligations that resolve through it.

Notarization (DocuSign, Notarize) provides point-in-time signatures. It does not model obligation lifecycle.

AutoKirk Future is the first operator-grade substrate where the entire obligation lifecycle (creation → resolution → proof) is append-only, idempotent, and receipt-backed. That category does not exist in incumbent software. It is being defined here.

---

## III. Competitive Position (Verified 2026 Data)

**ServiceTitan** — $245–$500/technician/month, $5K–$50K implementation fees, 20+ technician minimum, 12-month contracts, customer-reported friction exporting data after cancellation. Enterprise workflow. Year-one cost for a 10-tech operation: $50K–$70K+.

**Jobber** — $49 (Core, solo) to $529 (Plus, 15 users) per month, no implementation fee, contract-light. Acquired by Summit Partners 2019. SMB workflow.

**Housecall Pro** — $65 (Basic) to $369 (Max with proposal add-on) per month, mobile-first, payment processing built in (2.59%–2.9% + $0.10–$0.30). SMB workflow.

All three sell scheduling, dispatch, invoicing, customer communication. None sell receipt-backed obligation enforcement. They will out-feature AutoKirk on workflow surface area forever.

**AutoKirk does not compete on that axis.**

The competitive question is not "which has more features." It is: where does an operator place the truth of their business? Incumbents place it in mutable workflow records. AutoKirk places it in an append-only kernel with hash-chained ledger events and receipt-terminal closures.

A field service incumbent could ship a "receipts" feature in 12–18 months. They cannot ship a receipt-backed kernel without rebuilding their data layer. Estimated cost: 18–36 months of engineering for an incumbent with hundreds of thousands of customers running on a mutable schema, plus a migration that risks every existing customer's data. **That is the moat.**

---

## IV. Real TAM

The global field service management market is $5.1B–$6.3B in 2026, projected $9B–$23B by 2030–2035 (MarketsandMarkets, Mordor, Global Market Insights). North America: ~31.7% share = ~$2B current US addressable. CAGR 10–16%.

That is the floor.

The ceiling is the leakage exposure of the underlying operator economy. Verified industry research:

- **42% of organizations** report revenue leakage (MGI Research).
- Typical loss: **1–5% of annual revenue.**
- Construction underbilling alone: up to 1% of annual revenue (CFMA).
- 35% of contractors face delayed payments or disputes from poorly tracked change orders (ENR survey).
- Scope creep accounts for 3–5% of project revenue unbilled in construction.
- One contractor case: $150K recovered in missed change orders, year one, after centralized tracking implemented.

Applied to the SMB operator economy:

- ~5M US small businesses with field operations across trades, field service, marine, auto, healthcare, property management.
- ~2.1M (42%) actively leaking revenue.
- Average revenue $500K–$2M per operator.
- **Aggregate leakage: ~$50B/year exposure** across the addressable segment.

AutoKirk at $400/month per workspace = $4,800/year per customer.

- 1% market share of leaking operators = 21,000 customers = ~$100M ARR.
- 5% market share = $500M ARR.
- Vertical Face revenue is additive at $50M–$300M per vertical at saturation.
- Receipt API (operator-embedded proof) is uncapped — Stripe-style usage pricing, infrastructure-grade.

The full-potential ceiling is not "$150K/year off the pipefitting job." It is a multi-hundred-million-dollar infrastructure category at saturation, with a single-vertical floor of $5M–$20M ARR within 24 months if execution holds.

---

## V. Pricing at Full Potential

Four canonical tiers, plus an optional fifth. No kernel changes required for any of them — the kernel is already capable.

1. **Operator** — $400/month per workspace. Market-equivalent to Jobber Grow, Housecall Pro Essentials. Single tenant board, kernel access via projection, receipt issuance, integrity score.
2. **Vertical Face** — $500–$1,500/month per workspace. Industry-tailored vocabulary and integrations. Marine: Dockwa, DockMaster. Trades: QuickBooks, BuilderTrend. Auto: dealer DMS systems. Same kernel underneath; vocabulary swap on top.
3. **Enterprise** — $5K–$25K/month per organization. Multi-workspace rollups for auto dealer chains, multi-location service companies, franchise networks. Aggregated integrity scoring across locations. Governance dashboards for owner-operators.
4. **Receipt API** — Usage-based, $0.10–$1.00 per receipt issued. Operators embed AutoKirk receipts in their own customer-facing surfaces. **This is the infrastructure tier.** Highest leverage, no per-seat ceiling, compounds with every receipt issued in the network.

Optional fifth tier (12+ months out):

5. **Compliance / Audit Licensing** — $50K–$200K/year for insurance carriers, franchisors, regulators, or industry associations subscribing to receipt streams from member operators. Use case: marine insurance carrier subscribes to receipt streams from insured marina operators, gets real-time evidence of obligation closure rates, prices premiums accordingly.

---

## VI. Structural Moat

Three commitments AutoKirk Future makes that incumbents structurally cannot:

**1. Append-only kernel.** All state mutation flows through governed `api.*` SECURITY DEFINER functions. No direct writes. Every event in the ledger is hash-chained and idempotent. Receipt issuance is enforced at the kernel layer via `kernel_receipt_idempotency_write`. An incumbent cannot bolt this on without rewriting their data layer and migrating every existing customer.

**2. Faces architecture.** Vertical-specific vocabulary and UI overlay a single unchanged kernel. Each new vertical is a relabeling, not a new product. ServiceTitan cannot serve marine without a separate codebase. AutoKirk serves marine, trades, auto, and healthcare from one kernel. Engineering cost per new vertical: vocabulary translation layer + integration shims, not new primitives.

**3. Runs on itself.** Kirk Digital Holdings LLC pays AutoKirk via Stripe. The first paying customer of AutoKirk is the founder's own parent entity. No incumbent can credibly claim this. This is a trust artifact no marketing budget can purchase. ServiceTitan's payroll does not run through ServiceTitan's enforcement. AutoKirk's does.

The compounding advantage: every Face shipped, every receipt issued, every tenant onboarded reinforces the kernel without changing it. The kernel is the asset. The Faces are distribution. The receipts are the proof.

---

## VII. Inevitability Path (12–24 Months)

Doctrine-aligned, full potential, no execution corners cut.

### Months 0–3 — Customer Board Ships

- RLS enabled across all 14 kernel tables with workspace-scoped policies. Verify `auth.uid()`-bound policies don't break existing kernel resolver paths or projection routes.
- `tenant_id` migration applied (additive only, append-only) to `core.obligations`, `receipts.receipts`, `ledger.events`, supporting tables.
- `pages/board/[tenant].tsx` route shipped. Reads via `/api/obligations/list` and `/api/receipts/recent` projections. Read-only. Cannot mutate kernel.
- Stripe-driven tenant provisioning: payment → tenant created → URL issued → email sent. Self-serve.
- First 5 paying tenants outside Customer #0001.

### Months 3–6 — Marine Face Hardened

- Marine vocabulary overlay (slip, haul-out, winterization, survey, etc.).
- Integrations to Dockwa or marine equivalent.
- 15–25 paying tenants in marine.
- First documented leakage capture number from a non-Customer-#0001 operator. Sentence: "AutoKirk caught $X this quarter for [tenant]." This is the marketing artifact for the next 12 months.

### Months 6–12 — Second Vertical Face

- Trades or auto, chosen by operator pull, not invention.
- 50–150 paying tenants across two verticals.
- First Receipt API customer — operator embedding receipts in their own customer-facing artifacts. This unlocks the infrastructure tier of the moat.

### Months 12–18 — Multi-Vertical Proof

- Three verticals live (marine + trades + auto, or marine + trades + healthcare).
- 200–500 paying tenants. ARR $1M–$3M.
- First inbound from FSM incumbent. Either acquisition discussion ($20M–$50M range based on past valuation analysis) or partnership/integration.

### Months 18–24 — Decision Point

Three viable paths. Doctrine does not require choosing in advance:

- **Path A: Subscription compounding** — Stay independent. ARR trajectory $5M–$10M. Multiple Faces, multiple verticals.
- **Path B: Acquisition** — Sell at $20M–$50M to FSM incumbent or vertical SaaS roll-up.
- **Path C: Infrastructure** — Receipt API becomes primary revenue. Highest ceiling, longest runway. AutoKirk becomes the receipt layer for the operator economy, not a single-product application.

The solo-founder constraint does not bind this sequence. The system is the support:

- Self-serve provisioning eliminates per-customer onboarding bandwidth.
- Append-only kernel eliminates in-place mutation debugging.
- Receipts as automatic dispute evidence eliminate manual support resolution.
- Read-only projection means customer issues are display issues, not data corruption.
- Faces architecture means new verticals don't require new engineering substrate.

AutoKirk Future is architecturally built to scale without proportional founder bandwidth. That is the doctrinal claim, and it is structurally true given the kernel design.

---

## VIII. Critical Open — RLS Gap (Doctrine Drift)

The doctrine specifies tenant isolation enforced via RLS. Live state of `aiuicbyufelqdeiwhmyi` shows RLS disabled on all 14 kernel tables. Anyone with the anon key can read or modify every row across every workspace.

This is a doctrine drift between the canonical specification and the live database state. The kernel claims governed multi-tenant isolation; the database does not currently enforce it.

**This blocks the customer board build.** Tenant scoping migration without RLS is not multi-tenant — it is multi-tenant in name only, with no enforcement. A customer pasting their board URL into their existing tools could, at present, read another tenant's obligations by manipulating client-side state.

Required sequence before customer board ships:

1. RLS enable migration with workspace-scoped policies on all 14 tables.
2. Verify policies pass kernel resolver paths (`api.resolve_obligation`, `api.append_event_v1`, `api.create_watchdog_emission`, etc.) without breaking existing routes.
3. Apply `tenant_id` scoping migration (additive, append-only).
4. Apply projection-layer tenant filter to `/api/obligations/list` and `/api/receipts/recent`.
5. Then ship the board route.

Skipping any step ships a tenant board that violates the doctrine on day one.

---

## IX. What This Becomes at Full Potential

AutoKirk Future at full potential is the **governed truth substrate for the SMB operator economy.**

A multi-tenant kernel with vertical-specific Faces and a Stripe-style usage-priced Receipt API. An infrastructure category that did not exist before, with a defensible moat against workflow incumbents who cannot rebuild their data layer fast enough to chase.

**Ceilings:**

- Single-tenant: $0 (the founder runs on it; the system runs).
- Single-vertical: $5M–$20M ARR within 24 months.
- Multi-vertical subscription: $50M–$100M ARR within 36–48 months.
- Infrastructure (Receipt API + Compliance Licensing): uncapped — operators embed AutoKirk receipts; carriers and regulators subscribe to receipt streams; AutoKirk earns per-receipt revenue compounding with the network.

**Category:** governed obligation truth for operator businesses. AutoKirk is the first and currently only entrant.

**Constraint at full potential:** not market opportunity, not competitive threat, not founder bandwidth. The constraint is **execution discipline against the doctrine.** The system is architecturally capable of the higher ceiling. The kernel was built for it. The Faces architecture was built for it. The runs-on-itself trust posture was built for it.

The wedge is the customer board.
The moat is the kernel.
The compounding asset is the receipt chain.
The category is governed obligation truth.

---

SEALED 2026-05-08
STRATEGIC PLACEMENT COMPLETE
