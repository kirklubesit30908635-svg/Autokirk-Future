# AutoKirk Launch Hardening Runbook

Date: 2026-05-13
Scope: production launch readiness for the first external paying-customer path.

## Launch posture

AutoKirk can launch only when checkout, authentication, tenant visibility, recovery, and support all converge on one rule:

> After checkout, sign in once, then use AutoKirk daily.

The kernel remains the source of governed obligation truth. Launch work must not add browser-side writes around the kernel or bypass the governed `api.*` entry points.

## Engineering acceptance checks

### 1. Stripe billing-account mapping

Status in this branch: implemented.

Files:
- `pages/api/stripe/create-checkout-session.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/migrations/20260513120000_billing_account_mapping.sql`

Required environment variables:
- `AUTOKIRK_PLATFORM_WORKSPACE_ID`
- `AUTOKIRK_PLATFORM_ACTOR_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Acceptance:
- Checkout creation fails closed if platform workspace or actor id is missing or malformed.
- Stripe Checkout carries `workspace_id` and `actor_id` metadata.
- `checkout.session.completed` upserts `billing.accounts`.
- Future Stripe events resolve workspace/actor from `billing.accounts` by customer, subscription, or checkout session.
- The webhook no longer contains hard-coded UUID constants.
- Browser roles cannot read or mutate `billing.accounts`.

Manual proof:
1. Create a Stripe test checkout session from `/platform`.
2. Complete payment with a Stripe test card.
3. Confirm a row exists in `billing.accounts` for the Stripe customer.
4. Replay a Stripe event for the same customer.
5. Confirm `api.ingest_event_to_obligation` received the mapped workspace and actor.
6. Confirm a second customer cannot land in the first customer's workspace unless the checkout metadata explicitly maps to that workspace.

### 2. Supabase exposed-surface lockdown

Status in this branch: runbook defined; production audit still required before merge/deploy.

Audit queries:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname in ('core', 'ledger', 'receipts', 'billing', 'registry', 'api')
order by schemaname, tablename;
```

```sql
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('api', 'kernel', 'billing')
order by n.nspname, p.proname, args;
```

```sql
select n.nspname as schema_name,
       p.proname as function_name,
       r.rolname as grantee,
       has_function_privilege(r.rolname, p.oid, 'execute') as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname in ('api', 'kernel', 'billing')
  and r.rolname in ('anon', 'authenticated')
order by schema_name, function_name, grantee;
```

Acceptance:
- Kernel tables stay write-protected from browser roles.
- `billing.accounts` is service-role only.
- Every exposed `api.*` RPC is intentionally exposed, documented, and fail-closed.
- No `kernel.*` function is executable by `anon` or `authenticated` unless explicitly justified.
- Supabase security advisors are reviewed after migration.

### 3. Auth stabilization

Status in this branch: runbook defined.

Production config:
- Site URL: `https://autokirk.com`
- Success path: `/login?session_id={CHECKOUT_SESSION_ID}&next=/platform`
- Cancel path: `/platform?checkout=cancelled`
- OTP/email fallback stays enabled until external customer onboarding is stable.

Acceptance:
- Checkout success sends the user to login once, then `/platform`.
- A signed-out platform user can authenticate without losing `session_id`.
- A signed-in platform user can create the first obligation.
- Auth logs are reviewed for failed redirects, expired OTP, and invalid token errors after a test checkout.

### 4. Production recovery discipline

Status in this branch: runbook defined.

Acceptance:
- PITR is enabled for the production Supabase project.
- Daily logical export strategy is documented and tested.
- Storage export strategy is documented and tested.
- Restore drill completes into a non-production project or branch.
- Drill validates these tables/schemas at minimum: `core`, `ledger`, `receipts`, `billing`, `registry`.

Restore drill evidence template:

```md
# Restore drill evidence
Date:
Source project:
Restore target:
Backup source:
Schemas verified:
Receipt/event chain check:
Known gaps:
Decision: pass/fail
```

## Product acceptance checks

### Initial ICP package

Ship exactly two workflow packages first:

1. Support promises
   - Promise: customer request, service answer, follow-up, or fix.
   - Proof: reply sent, issue closed with evidence, or customer-visible confirmation.
   - Failure state: promise exists but proof is absent or insufficient.

2. Approvals and handoffs
   - Promise: approval, review, handoff, or decision is owed.
   - Proof: approval artifact, decision note, owner acceptance, or handoff receipt.
   - Failure state: work is marked done but no proof-backed acceptance exists.

Acceptance:
- No third workflow is marketed until one of these two produces repeat paid usage.
- Onboarding copy says: `After checkout, sign in once, then use AutoKirk daily.`
- Landing pages explain one outcome each, not the whole kernel.

## Ops acceptance checks

Support process:
- Shared inbox exists and is listed in customer-facing support copy.
- Initial SLA: first response within one business day.
- Escalation path: support inbox -> founder/operator -> engineering issue.
- Known-issues page exists and includes auth, checkout, and first-obligation creation states.

## Legal acceptance checks

Required before broad customer onboarding:
- MSA
- DPA
- SCCs, if applicable
- Subprocessor appendix
- Retention/deletion policy

Launch can proceed with a controlled founder-led customer only if the customer has accepted a lightweight written agreement covering data handling, support expectations, and deletion.

## Marketing acceptance checks

Commercial site must ship:
- One short demo video focused on one workflow.
- One support-promises landing page.
- One approvals/handoffs landing page.
- One customer-story template, even if the first story is founder/customer-zero.

## Merge gate

Before merging this branch:
- `npm run build` passes.
- `npm run prove` passes.
- Supabase migration replays locally.
- Stripe test checkout creates a `billing.accounts` row.
- Webhook replay opens an obligation in the mapped workspace.
- Supabase security advisors are reviewed.
- No kernel write path is changed outside governed API boundaries.
