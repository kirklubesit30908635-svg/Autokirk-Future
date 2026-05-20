# AUTOKIRK — LEARNING DOSSIER

## Governance, Proof, and First Activation Playbook

**Status:** Canonical proof and activation reference
**Scope:** Learning core, founder gate, governed WRITE activation
**Purpose:** Merge verified chat-derived guidance and proof artifacts into a single authoritative reference.

This dossier establishes:

- The current governed state of the AutoKirk learning core
- Hard proof of why learning is inert
- The exact minimal procedure to flip learning live through one governed WRITE action

This document is suitable for engineers, auditors, and future system review without external context.

---

## Part I — System Position (Verified)

**Current state:** The primary founder-gated control plane is unlockable under real authentication context and is ready to wire approvals and execution into the Operator Console.

**Meaning:** The system has transitioned from schema-present to execution-ready, pending founder-gate confirmation and first governed WRITE.

---

## Part II — Founder Gate Proof (Control Plane Validation)

### II.1 Definition of Confirmed Complete

Founder access is confirmed only when all of the following are true:

1. A real authenticated founder user exists in Supabase Auth.
2. Founder rows exist for that user's UUID in founder source table(s).
3. Under simulated JWT context, founder gates return true.
4. Under real app auth, RLS unlocks on a founder-only table.

This is the boundary between "tables exist" and "system works."

### II.2 Verification Steps (Condensed)

#### Identify Founder UUID

In Supabase Dashboard:

1. Open Authentication.
2. Open Users.
3. Copy the founder user's `id`.

#### Ensure Founder Rows Exist

Temporary dual-source confirmation:

- `ak.founders`
  - `user_id = <UUID>`
  - `is_active = true`
- `founder.founder_profiles` if present
  - `user_id = <UUID>`
  - `enabled = true`

#### Simulate JWT Context in SQL Editor

Set:

```sql
select set_config('request.jwt.claim.sub', '<UUID>', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
```

#### Pass Conditions

All must pass:

- `auth.uid()` resolves to the founder UUID.
- `ak.is_founder()` returns true.
- `public.is_founder()` returns true.

#### RLS Proof

- Founder JWT: founder-only table `SELECT` succeeds.
- Non-founder JWT: same query is denied or returns empty.

---

## Part III — Learning Core Proof (Design vs Activity)

### III.1 Learning Output Exists (Rollup)

Table:

```text
audit.learning_signals_daily
```

Tracks daily governance and execution telemetry, including:

- executions succeeded and failed
- proposals created
- approvals granted and denied
- containment and elimination blocks
- tool successes and errors

This confirms learning aggregation is implemented at the schema level.

### III.2 Learning Input Exhaust Exists (Event Sources)

Event and log tables intended to feed learning:

- `ak.audit_log`
- `ak.guardrail_events`
- `ak.job_events`
- `public.event_log`
- `public.ingestion_events`
- `public.tool_audit_log`
- `public.policy_audit_snapshots`

This confirms a governed exhaust layer exists.

### III.3 Memory and Embedding Infrastructure Exists

The system includes memory and vector infrastructure:

- `public.engine_one_memory`
- `founder.memory_items`
- `public.embeddings_index`
- `storage.buckets_vectors`
- `storage.vector_indexes`

The system can persist structured memory and vectorized representations.

### III.4 Governance and Sovereignty (RLS)

Learning and memory tables are founder-only or tightly scoped through RLS, confirming:

- no uncontrolled learning
- no operator-visible memory
- founder sovereignty preserved

### III.5 Hard Evidence: Learning Is Inert

Verified row counts:

- `ak.audit_log` → 0
- `ak.job_events` → 0
- `ak.guardrail_events` → 0

Rollup query:

- `audit.learning_signals_daily` → no rows

**Binary conclusion:** Learning is designed and governed. Learning is inactive by design because no governed WRITE actions have occurred yet.

This is correct system behavior.

---

## Part IV — Causality Chain: Why Learning Is Inert

1. No approvals executed.
2. No jobs queued or run.
3. No audit or guardrail events written.
4. No learning exhaust generated.
5. No rollups produced.

The absence of learning signals proves lack of execution, not system failure.

---

## Part V — First Governed WRITE Action (Activation Playbook)

This section defines the minimal controlled action required to flip learning live.

### V.1 Objective

Generate the first governed WRITE exhaust while preserving full founder control and auditability.

### V.2 Preconditions

All must be true:

- Founder gates confirmed complete.
- RLS proven to unlock for founder.
- No automation or operators required.

### V.3 Minimal Action

**Action type:** Founder-created approval that results in a queued and executed job.

Conceptual flow:

1. Create an approval record for a benign action.
2. Approve it as founder.
3. Execute through a controlled function or service role.

No real-world side effects are required. The action exists solely to exercise governance.

### V.4 Expected Exhaust (Proof of Life)

After execution, at least one of the following must occur:

- row inserted into `ak.job_events`
- row inserted into `ak.audit_log`
- optional row inserted into `ak.guardrail_events`

### V.5 Verification Queries

```sql
select *
from ak.job_events
order by created_at desc
limit 5;

select *
from ak.audit_log
order by created_at desc
limit 5;

select *
from ak.guardrail_events
order by created_at desc
limit 5;
```

Presence of rows confirms the learning exhaust is live.

### V.6 Rollup Confirmation (Next Cycle)

On the next rollup execution:

- `audit.learning_signals_daily` populates with non-zero metrics.

This confirms learning activation end-to-end.

---

## Part VI — Final Assertion

This dossier proves:

- Governance architecture exists and is enforced.
- Founder sovereignty is real.
- Learning infrastructure is fully implemented.
- Learning inactivity prior to execution is intentional and correct.

Once the First Governed WRITE Action completes, the system transitions from learning-inert to learning-active without architectural changes.

---

END OF DOSSIER
