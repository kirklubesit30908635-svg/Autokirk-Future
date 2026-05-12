# AutoKirk Positioning — Proof-Gated Closure

**Status:** Interactive guidance as of now; refine only by explicit agreement  
**Scope:** Homepage, sales language, customer education, attachment-model design  
**Protected boundary:** This document does not change the kernel, migrations, API mutation paths, proof semantics, receipt semantics, or Supabase schema.

---

## 0. Interactive Guidance Rule

This document is the current guidance surface for AutoKirk positioning.

It is not final doctrine by itself. It is an agreed working guide that should be refined as decisions are made.

Rules:

- Treat this document as guidance, not implementation authorization.
- If new direction conflicts with this document, call out drift before changing anything.
- Only update this document when the change is explicitly agreed.
- Do not silently reinterpret kernel doctrine from this document.
- Do not use this document to authorize code, migration, API, Supabase, proof, receipt, or enforcement-path changes.

Drift marker format:

```text
DRIFT DETECTED:
<what changed or conflicts>
Current locked rule:
<what we should follow now>
Recommended action:
<propose, do not mutate>
```

---

## 1. Primary Category

AutoKirk is **proof-gated closure infrastructure**.

AutoKirk attaches to the systems a company already uses and governs whether actions are allowed to close.

The simplest market line:

> Keep your software. Add proof-gated closure.

Supporting line:

> Your tools run the work. AutoKirk makes sure unresolved work cannot quietly disappear.

---

## 2. What AutoKirk Is

AutoKirk is the closure authority attached to existing operational systems.

External systems create actions. AutoKirk governs whether those actions can truthfully close.

Actions may close automatically only when proof satisfies the obligation contract. If proof is missing or insufficient, the action remains open, fails, or escalates.

---

## 3. What AutoKirk Is Not

AutoKirk is not:

- CRM
- field-service software
- project management software
- ticketing software
- AI runtime
- ERP
- identity provider
- generic workflow software
- another dashboard users must live inside all day

Those systems can continue to run the work.

AutoKirk governs closeout.

---

## 4. The Core Operating Loop

```text
Existing system creates action
        ↓
AutoKirk opens governed obligation
        ↓
Proof contract defines what can close it
        ↓
Proof arrives from system, human, AI agent, webhook, or artifact
        ↓
AutoKirk validates proof
        ↓
Close / fail / escalate
        ↓
Receipt emitted
        ↓
Truth syncs back to board, audit trail, customer, or source system
```

This loop is the category.

Internal doctrine may continue to use deeper language such as governed obligation truth. Public product language should lead with proof-gated closure.

---

## 5. Homepage Hero

Recommended homepage hero:

> **Keep your software. Add proof-gated closure.**
>
> AutoKirk attaches to the systems you already use. Actions close automatically when valid proof is provided. If proof is missing, unresolved work stays visible, escalates, or fails.
>
> Your tools run the work. AutoKirk makes sure the work cannot quietly disappear.

Primary CTA:

> Attach first workflow

Secondary CTA:

> See proof-gated closure

---

## 6. Correct Contrast

Do not frame the product as:

```text
Without AutoKirk vs With AutoKirk
```

Both unresolved and closed states exist inside AutoKirk.

Use this contrast instead:

| Before proof | After proof |
|---|---|
| Action exists but cannot truthfully close | Proof satisfies the obligation contract |
| Work remains visible | Action reaches governed final state |
| Missing proof can escalate | Receipt-backed truth is emitted |
| Ownership can change while obligation remains | Closure becomes durable and auditable |

---

## 7. Universal Means Attachment Across Operating Surfaces

Universal does not mean vague or generic.

Universal means the same proof-gated closure lifecycle can govern different operational surfaces.

### AI Agents

AI can act. AutoKirk governs whether the action can close.

Use cases:

- tool calls
- autonomous workflows
- approvals
- customer-impacting actions
- policy-sensitive actions
- failure states

### Service Operations

Service systems can continue creating and managing jobs. AutoKirk governs whether proof is sufficient to close them.

Use cases:

- technician visits
- proof of service
- customer signoff
- failed visits
- photo or artifact evidence
- warranty or compliance proof

### Audit and Compliance

Controls stay open until evidence exists.

Use cases:

- audit trails
- compliance controls
- reviewer attestations
- policy evidence
- security reviews

### Revenue Enforcement

Revenue events create obligations.

Use cases:

- payment received
- contract signed
- subscription renewed
- onboarding required
- service delivery required
- entitlement activation
- fulfillment proof

### Enterprise Workforce Movement

People join, leave, transfer, and change roles. Obligations remain governed.

Use cases:

- onboarding
- offboarding
- permission removal
- equipment recovery
- account transfer
- manager signoff
- contractor and vendor handoffs

### Internal Operations

Internal tools can create actions while AutoKirk governs closeout.

Use cases:

- Jira
- Linear
- Asana
- Slack
- email
- custom internal tools
- API workflows

---

## 8. Enterprise Use Model

In large companies, most users should not live in AutoKirk all day.

AutoKirk should be used by systems heavily and humans selectively.

### System Owners

Configure attachments and proof contracts.

Examples:

- IT
- operations
- RevOps
- compliance
- AI platform owners
- service operations managers

### Proof Submitters

Interact when proof is not automatic.

Examples:

- technicians
- managers
- auditors
- reviewers
- finance operators
- AI supervisors

### Truth Viewers

View board state, receipts, and unresolved work.

Examples:

- executives
- customers
- auditors
- department heads
- compliance teams
- customer success teams

### Automated Actors

Submit events and proof from existing systems.

Examples:

- Stripe
- Okta
- Workday
- ServiceTitan
- Jira
- Linear
- Slack
- AI agents
- webhooks
- internal apps

---

## 9. Proof Contracts

A proof contract defines what can close an obligation.

Example fields for product surface language:

```text
obligation type
required proof fields
automatic close allowed
review required
failure path
escalation path
receipt visibility
source system
responsible owner or queue
```

Product language should describe proof contracts clearly without exposing backend enforcement details.

---

## 10. Autonomous Closeout

AutoKirk can close an action automatically only when proof satisfies the obligation contract.

```text
external event
        ↓
proof validation
        ↓
sufficient?
        ↓
yes → autonomous closure + receipt
no  → remain open / fail / escalate
```

This is central to the product claim.

Do not describe AutoKirk as merely monitoring or reporting.

AutoKirk governs closeout.

---

## 11. The Movement Problem

Large companies have constant movement:

- joiners
- movers
- leavers
- contractors
- vendors
- role changes
- department changes
- handoffs
- AI agents

AutoKirk's enterprise claim:

> People can move. Obligations remain governed.

The owner can change. The obligation stays.

The proof requirement can persist through turnover, role changes, and system handoffs.

---

## 12. Subscription Value

A company subscribes to AutoKirk when closure needs to be trusted.

AutoKirk provides:

- proof-gated closeout
- autonomous closure when proof is sufficient
- visible unresolved work
- escalation when proof is missing
- receipt-backed final state
- persistent obligations through personnel movement
- no rip-and-replace requirement

---

## 13. AI Producer and Consumer Guidance

AutoKirk should serve both sides of AI adoption: the producers building AI systems and the consumers relying on AI-driven work.

AI can create, suggest, and act. AutoKirk governs whether the result is allowed to count as complete — based on the user's rules, required proof, and evidence of how it got there.

For AI producers, AutoKirk provides a proof-gated closeout layer that helps autonomous actions become business-usable. Builders can move fast while giving customers visibility into whether AI-driven work closed, failed, or escalated.

For AI consumers, AutoKirk provides a trust surface. It shows which actions were created, what proof exists, whether the action closed, failed, or escalated, and what record supports the final state.

AutoKirk is not the AI model, agent runtime, or orchestration layer. AutoKirk governs whether AI-driven work is acceptable to be considered complete under the user's design.

Use:

- AI can act. AutoKirk governs closeout.
- Keep your AI stack. Add proof-gated trust.
- Build fast. Let AutoKirk govern closeout.
- Use AI without losing closure truth.
- Ship faster with a trust layer attached.

Public positioning may describe AutoKirk's outcomes: proof-gated closure, unresolved-work visibility, acceptance rules, evidence trails, autonomous closeout, escalation, and durable final-state records.

Public positioning must not disclose internal mechanics. Use outcome language, not mechanism language.

---

## 14. Confidential Architecture Boundary

Public positioning may describe AutoKirk's outcomes:

- proof-gated closure
- unresolved-work visibility
- acceptance rules
- evidence trails
- autonomous closeout
- escalation
- durable final-state records
- receipt-backed final state

Public positioning must not disclose internal mechanics that create those guarantees.

Do not expose:

- kernel alignment
- chain design
- idempotency details
- append-only enforcement
- mutation boundaries
- anti-bypass architecture
- receipt-chain internals
- backend enforcement paths

Use outcome language, not mechanism language.

Technical or investor-facing material may imply structural seriousness without revealing trade-secret mechanics:

> AutoKirk is designed so closure is not just a status change. It is a governed decision based on proof, rules, and the evidence trail behind the result.

---

## 15. Public Category Language

Use:

- proof-gated closure
- closure authority
- autonomous closeout
- proof contracts
- receipt-backed finality
- unresolved work visibility
- attachment layer
- existing systems
- close / fail / escalate

Avoid on homepage:

- doctrine
- kernel
- projection
- verticalization
- truth surface
- lifecycle semantics
- append-only enforcement

Those concepts remain important internally and technically, but buyer-facing product language should stay operational.

---

## 16. Defensible Market Claim

Avoid claiming:

> No software exists like AutoKirk.

Use:

> Most systems manage activity. AutoKirk governs whether activity is allowed to count as complete.

This is stronger, safer, and more understandable.

---

## 17. Final Positioning Stack

Primary line:

> Keep your software. Add proof-gated closure.

Secondary line:

> Existing systems create actions. AutoKirk governs whether they can close.

Enterprise line:

> AutoKirk is the closure authority attached across your operational systems.

Emotional line:

> Unresolved work should not disappear.

Technical line:

> Actions close automatically only when proof satisfies the obligation contract.

Infrastructure line:

> AutoKirk is proof-gated closure infrastructure for enterprise systems and AI operations.

AI producer/consumer line:

> AI can create, suggest, and act. AutoKirk governs whether the result is allowed to count as complete — based on the user's rules, required proof, and evidence of how it got there.

---

## 18. Protected Boundary

This document is positioning and product-surface guidance only.

It must not be used as authorization to change:

- kernel tables
- receipt semantics
- proof semantics
- migration history
- API mutation authority
- Supabase schema
- enforcement paths
- append-only behavior

Any implementation change must be separately proposed and approved.
