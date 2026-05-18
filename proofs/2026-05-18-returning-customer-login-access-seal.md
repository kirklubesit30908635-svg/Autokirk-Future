# Returning Customer Login Access Seal

Date: 2026-05-18
Branch: `returning-customer-login-access`
Scope: activation and returning-customer access only

## Contract

AutoKirk customer access is now defined as:

```text
Stripe once
-> activation verifies checkout
-> customer signs in by email
-> server resolves paid workspace
-> membership is linked if needed
-> /board/[tenant] opens under auth + membership + billing gate
```

Stripe is an activation/provisioning event. Stripe is not the recurring workspace access mechanism.

## Files changed

```text
pages/api/stripe/create-checkout-session.ts
pages/activate.tsx
pages/login.tsx
pages/api/customer/returning-access.ts
```

## Behavior sealed

### New customer

```text
/platform
-> POST /api/stripe/create-checkout-session
-> Stripe Checkout
-> /activate?session_id={CHECKOUT_SESSION_ID}
-> GET /api/stripe/checkout-session verifies payment_status=paid
-> Continue to /login?session_id=...
-> Supabase email login
-> GET /api/customer/returning-access
-> /board/[tenant]
```

### Returning customer

```text
/login
-> Supabase email login
-> GET /api/customer/returning-access
-> existing membership or billing email match
-> /board/[tenant]
```

## Access gates

`/api/customer/returning-access` requires:

```text
valid Supabase auth session
service-side billing lookup
active/trialing/past_due billing status
workspace membership already present OR billing customer_email matching signed-in user email
```

The board route remains tenant-gated by the existing server board loader. The loader checks Supabase auth, confirms `core.workspace_members` membership for the requested workspace, and only then permits user-scoped board reads. If membership is absent, the board loader returns forbidden unless a signed board token or explicitly trusted public workspace path exists.

## Kernel boundary

No kernel doctrine changed.
No direct browser read of billing tables was introduced.
No non-governed obligation mutation path was introduced.
No route bypasses `api`/kernel proof semantics.

This slice only fixes customer access:

```text
activation != daily access
checkout != login
billing != board truth
membership + billing state gates board access
```

## Claim boundary

This seal supports the following claim only:

```text
A controlled design-partner customer should pay once, then use email login for future workspace access, with board access guarded by auth, tenant membership, and billing status.
```

This seal does not claim broad self-serve readiness, enterprise readiness, legal-proof status, compliance readiness, or third-party audit validation.

## Captured smoke evidence

Preview deployment for branch commit `7bc6747664c26e7a709440daa212fa02b2ce8e55` reached Vercel `READY` as deployment `dpl_4jx35Na13fREGA5mgpGwzpQzSC6g`.

Unauthenticated live request to the preview deployment proved the returning-access resolver does not open a workspace without an auth session:

```text
GET /api/customer/returning-access
HTTP 401 Unauthorized
{"ok":false,"error":"Auth session missing!"}
```

The first GitHub Actions proof-gate run for commit `7bc6747664c26e7a709440daa212fa02b2ce8e55` ended in `startup_failure` before creating jobs or artifacts. That run could not be retried through GitHub. This document update intentionally creates a new branch commit to trigger a fresh proof-gate attempt.

## Remaining proof work

Before promoting this as production-sealed, run and capture:

```text
1. GitHub proof gate result for latest branch commit
2. Build/typecheck result for branch
3. Successful Stripe test checkout redirecting to /activate?session_id=...
4. Verified activation page exposing Continue to email login only after paid session
5. Returning email login resolving to /board/[tenant]
6. No-auth /api/customer/returning-access -> 401
7. Signed-in user with no billing/membership -> denied
8. Inactive/canceled billing -> denied
9. Wrong-tenant board access -> forbidden
```

## Verdict

The access architecture now matches the product doctrine:

```text
Stripe once -> login forever -> tenant-safe board access
```
