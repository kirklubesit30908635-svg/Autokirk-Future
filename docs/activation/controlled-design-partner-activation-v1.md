# AutoKirk Controlled Design-Partner Activation v1

Date: 2026-05-17

## Purpose

This runbook defines the smallest controlled design-partner activation path after production hardening and board-level public-access isolation have been sealed.

Activation shape:

- one controlled design partner;
- one workflow;
- one board;
- one proof rule;
- one receipt-backed closure;
- founder-led onboarding.

This is not broad self-serve, enterprise onboarding, compliance certification, legal-proof positioning, or a generic workflow/CRM/AI-agent product expansion.

## Current activation claim

AutoKirk may be activated with a controlled design partner only as a governed proof path:

```txt
chosen intake -> governed obligation -> proof submission -> governed API/kernel resolution -> receipt-backed terminal truth -> board visibility
```

The route boundary remains:

```txt
UI -> server/API route -> governed API/kernel path -> receipt/proof surface
```

No browser/client path may write directly to privileged RPCs or kernel tables.

## Design-partner acceptance criteria

A design partner is acceptable only if all are true:

1. The partner has one recurring or high-trust obligation where false closure matters.
2. The partner agrees to start with exactly one workflow.
3. The partner accepts founder-led setup rather than self-serve configuration.
4. The workflow can be represented as a governed obligation with a clear proof rule.
5. Closure can produce a receipt-backed terminal record.
6. The partner does not require enterprise, compliance, legal-proof, or audit-proof claims.
7. The partner does not require a vertical-specific product fork.

Reject the partner for this phase if they need:

- multi-workflow onboarding;
- CRM replacement;
- generic task management;
- field-service scheduling;
- automotive-specific functionality;
- AI-agent orchestration;
- enterprise SSO / procurement / compliance posture;
- legal-proof or audit-proof guarantees.

## Workflow selection rule

Pick exactly one workflow that satisfies this sentence:

```txt
This work should not be marked complete unless specific proof exists.
```

Examples of acceptable workflow shape:

- recurring customer deliverable closure;
- payment/account follow-up requiring evidence;
- onboarding step requiring proof of completion;
- operational handoff that must not disappear without receipt.

Do not start with:

- a whole department;
- a full CRM pipeline;
- open-ended task lists;
- complex approval chains;
- multi-tenant delegated administration;
- AI automation loops.

## One-board rule

The design partner gets one board for one workspace.

The board exists to answer only:

- what is open;
- what has proof ready;
- what needs attention;
- what closed with receipt;
- whether the closure path can be trusted.

The board is a proof surface, not a general dashboard.

## One-proof-rule rule

Define one proof rule in plain English before activation.

Template:

```txt
An obligation may close only when [specific proof artifact] exists and [specific actor/source] submits it through the governed proof path.
```

Examples:

```txt
An obligation may close only when a delivery confirmation URL or image is submitted through the proof board.
```

```txt
An obligation may close only when the responsible operator submits a note plus supporting link showing the customer-facing step was completed.
```

The proof rule must be narrow enough that a human can evaluate it and the kernel can preserve the terminal receipt truth.

## One-receipt closure rule

The first activation succeeds only when one real obligation reaches terminal closure through the governed proof path and emits a receipt.

Success is not a signed customer, a pretty board, or a demo.

Success is:

```txt
one real obligation closed with proof and receipt-backed terminal truth
```

## Founder-led activation steps

### Step 1 — Choose partner

Select one controlled design partner with a narrow workflow and low integration burden.

Record:

- partner name;
- workspace name;
- workflow name;
- proof rule;
- expected first obligation;
- expected proof artifact;
- expected receipt meaning.

### Step 2 — Provision workspace

Create or identify one workspace for the design partner.

Confirm:

- workspace has one intended owner/member;
- board URL is signed or membership-gated;
- no public board workspace override is used unless it is a non-sensitive demo workspace;
- tenant data is not visible through public no-key board access.

### Step 3 — Create one governed obligation

Use only the governed intake/API/kernel path.

Do not insert directly into kernel tables from UI, scripts, or admin shortcuts.

Record:

- obligation ID;
- workspace ID;
- obligation code;
- source/intake path;
- proof required.

### Step 4 — Show board

Open the design partner's board.

Verify:

- the obligation appears only on that workspace board;
- no other workspace obligations appear;
- receipts are empty before closure if no prior receipt exists;
- board state is read/projection truth, not optimistic UI state.

### Step 5 — Submit proof

Submit proof through the existing proof board/server route.

Proof must include:

- note or evidence artifact;
- source URL/photo/link if applicable;
- proof-action token or authenticated workspace membership;
- no direct privileged browser RPC.

### Step 6 — Resolve through governed path

Resolution must pass through governed API/kernel semantics.

Do not bypass:

- `api.resolve_with_proof` / governed proof boundary;
- kernel lifecycle rules;
- receipt emission;
- ledger/receipt truth surface.

### Step 7 — Capture receipt

After closure, capture:

- receipt ID;
- obligation ID;
- emitted timestamp;
- receipt hash/sequence if available;
- lifecycle state;
- board state showing closure/receipt visibility.

### Step 8 — Write activation proof

Create a proof artifact:

```txt
proofs/YYYY-MM-DD-controlled-design-partner-activation-seal.md
```

The artifact must include:

- partner/workspace identifier;
- workflow name;
- proof rule;
- obligation ID;
- proof submission evidence;
- receipt ID;
- final claim;
- non-claims.

## Required activation proof checklist

The activation is not sealed until all are true:

- [ ] one partner selected;
- [ ] one workspace identified;
- [ ] one workflow documented;
- [ ] one proof rule documented;
- [ ] one governed obligation created;
- [ ] board shows that obligation only in the correct workspace;
- [ ] public no-key board access does not expose the workspace;
- [ ] proof submitted through governed route;
- [ ] obligation resolved through governed API/kernel path;
- [ ] receipt emitted;
- [ ] board shows receipt-backed closure;
- [ ] proof artifact committed.

## Non-claims during activation

Do not claim:

- broad self-serve readiness;
- enterprise readiness;
- compliance certification;
- legal-proof status;
- audit-proof status;
- autonomous AI-agent orchestration;
- generic workflow-suite replacement;
- CRM replacement;
- vertical-specific product readiness.

## Allowed public positioning

Allowed:

```txt
AutoKirk helps controlled design partners govern important work so it cannot be marked complete without proof, and each approved closure produces a receipt-backed terminal record.
```

Not allowed:

```txt
AutoKirk is enterprise-ready compliance infrastructure.
```

```txt
AutoKirk is audit-proof.
```

```txt
AutoKirk replaces your CRM/workflow suite.
```

```txt
AutoKirk is an AI-agent platform.
```

## Exit condition

Controlled design-partner activation v1 exits only when one real partner has one real receipt-backed closure produced through the governed path.

Until then, the next move is not more product. The next move is one verified receipt.
