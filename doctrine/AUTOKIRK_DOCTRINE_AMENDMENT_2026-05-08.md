# AutoKirk Future — Doctrine Amendment

**Date:** 2026-05-08
**Author:** Chase Kirk (founder, lead architect)
**Status:** Canonical
**Supersedes:** Faces-as-code framing in prior strategic artifacts
**Companion files:** `AUTOKIRK_CURRENT_STATE_2026-05-08.md`, `AUTOKIRK_BUILD_MAP_2026-05-08.md`

This amendment captures the architectural decisions made on 2026-05-08 that change the build map and the doctrine. It is canonical going forward. Anything in earlier doctrine that conflicts with this amendment is superseded.

---

## I. Crystallized Principle

> **The kernel is universal. The operator is the verticalization.**

The kernel knows obligations, events, receipts, proof contracts, idempotency, hash chains. It does not know "marine," "trades," "auto," or "healthcare." The operator brings their business; the kernel governs it. This principle holds at every layer — kernel, surface, onboarding, product. Marketing-as-content can segment by vertical for SEO and distribution. The product cannot.

This is the doctrinal crystallization of kernel-first obligation enforcement.

---

## II. Decisions Made (2026-05-08)

### Decision 1: AutoKirk Future is a single universal product, not a family of vertical Faces.

The Faces architecture as **separate vertical codebases or product surfaces** is rejected. ServiceTitan-style verticalization (separate codebases for HVAC vs plumbing vs marine) is the workflow incumbent pattern. AutoKirk is infrastructure. Infrastructure does not have Faces.

The Faces architecture survives only as:
- **Marketing content** on `autokirk.com/marine`, `autokirk.com/trades`, etc. — SEO and conversion pages, all linking to the same product.
- **Documentation examples** in the help center showing how operators in different verticals have configured their kernels.
- **Tenant configuration data** the operator provides for themselves at signup.

Faces as a code or product concept are retired.

### Decision 2: No vertical onboarding templates.

Pre-built JSON templates for marine, trades, auto, or healthcare are rejected. Templates are residual verticalization — they reintroduce the maintenance burden, the "what industry are you in" choice paralysis, and the dishonesty of pretending the kernel cares about industries.

Onboarding is a single screen: "Define your first obligation." The tenant defines their own `obligation_code`, `truth_burden`, proof requirements, and due-date defaults. The kernel governs. The operator vocabulary-izes.

If guidance becomes useful later, it maps to the existing knowledge layer doctrine: an AI agent in `observer` or `proposal_author` mode suggests obligation codes derived from the tenant's actual activity. AI proposes; kernel governs; operator authorizes.

### Decision 3: Hash chain port from `udwzexjwhkvsyeihcwfw` is the highest-leverage migration available and ships in Phase 1.

The hash chain (`ledger.events.chain_key/seq/prev_hash/hash`, `ledger.chain_heads`, `ledger.receipts` with hash columns, `ledger.receipt_heads`) was built on the prior Operator OS instance and not carried forward to AutoKirk Future. Without it, receipts are database rows. With it, receipts are cryptographic artifacts.

Every infrastructure-tier capability AutoKirk targets (Receipt API, Compliance Licensing, audit certifications, insurance carrier contracts) compounds on receipts being externally verifiable. Hash chain is the foundation under all of them. Port priority: highest, this week.

### Decision 4: Knowledge and signals layer ports are deferred.

The `knowledge` schema (14 tables: agent_registry, signal_catalog, findings, recommendations, outcome_comparisons, simulation_runs, memory_patterns, founder_briefs, evidence_refs, proposal_emission_log, review_actions, action_catalog_map, proposal_status_history, findings_archive) and the `signals` schema (7 tables: signal_types, detectors, detector_event_types, detector_bindings, runs, signal_instances, metric_observations) exist on the Operator OS instance but are deferred from AutoKirk Future until receipts exist to feed them.

`outcome_comparisons` is the core learning loop and requires real receipts to compare AI expected impact against. Building advisory infrastructure before paying tenants generate receipts is wasted kernel cycles. Port phase: 3.

### Decision 5: Customer board is one universal route.

`pages/board/[tenant].tsx`. One route. All tenants. The board renders identically regardless of vertical. Operator vocabulary (Open / Needs Proof / Overdue — System Acting / Sealed / Failed) is fixed at the surface layer. Per-tenant content (obligation codes, proof contracts, due dates) is data, not code.

### Decision 6: Watchdog kill-switch authority remains deferred indefinitely.

No active threats. Premature defense. Watchdog continues to observe via projection views and write through `api.create_watchdog_emission` only. Kill-switch authority is added when there is a kernel compromise scenario to defend against — not before.

### Decision 7: Vertical strategy lives in the marketing layer only.

Marketing pages, content, testimonials, case studies, and SEO segmentation can mention industries. They are content artifacts, not products. They all funnel into the same signup flow and provision the same product. Verticalization for the customer is data they bring; verticalization for distribution is content the marketing site publishes.

---

## III. What This Retires from Earlier Doctrine

The following framings, language, or commitments from prior artifacts are retired. Where present in older doctrine files, they are superseded by this amendment:

- "Marine Face hardened" as a Phase 2 product milestone — retired.
- "OSM Face / Auto Dealer Face / Food Service Face / Healthcare Face / Advertising Face" as separate face products — retired. (The verticals survive as marketing content and tenant configurations.)
- "Vocabulary changes per vertical" as a code-level commitment — clarified: vocabulary changes are tenant-defined data, not per-vertical code.
- "Each Face is a new market with zero rebuild cost" — clarified: every market is the same product. New markets are tenant signups.
- "Designed Face #004: Advertising Face" and similar pre-architected vertical products — retired. Verticals emerge from tenant configuration, not from pre-architecture.
- JSON onboarding templates per vertical (introduced briefly in earlier 2026-05-08 conversation as a hedge) — retired before being built.

---

## IV. What This Reaffirms

- **Identity:** kernel-first obligation enforcement. Category: governed obligation truth.
- **Trust posture:** AutoKirk runs on AutoKirk. KDH pays AutoKirk via Stripe. The first paying customer of AutoKirk is the founder's parent entity.
- **Kernel authority:** every state mutation flows through `api.*` SECURITY DEFINER functions. The watchdog observes and writes only through the kernel.
- **Receipt invariant:** every closure leaves a receipt. Verified live: 14 of 14 resolved obligations have receipts and ledger events.
- **GRANT-enforced kernel discipline:** no client role has INSERT/UPDATE/DELETE on kernel tables. The kernel cannot be bypassed by any normal Supabase client.
- **Operator vocabulary on the surface:** Open, Needs Proof, Overdue — System Acting, Sealed, Failed.
- **Append-only kernel + idempotency:** `ledger.idempotency_keys` with UNIQUE constraint, `input_hash`, FK references to event_id and receipt_id. Replay-safe.
- **Faces architecture (revised meaning):** the kernel is universal; verticalization is data the operator provides and content the marketing site publishes.

---

## V. Why This Is Doctrinally Cleaner

The earlier "Faces-as-product" framing was a soft compromise between the kernel-first identity and the workflow-incumbent assumption that products must be vertical-specific to convert. The compromise generated maintenance burden and undermined the infrastructure positioning.

Pure universal product:

- Honors "kernel never changes" at the surface layer, not just the data layer.
- Eliminates per-vertical engineering work permanently.
- Aligns AutoKirk with infrastructure-tier precedent (Stripe, Notion, Linear, Figma) — none of which segment products by vertical.
- Preserves the Faces architecture in the only form it ever needed to take: data and content.
- Survives solo execution because there is exactly one product to maintain forever.

The product is one product. The kernel is one kernel. The verticalization is the operator's content. This is the doctrine.

---

SEALED 2026-05-08
DOCTRINE AMENDMENT COMPLETE
