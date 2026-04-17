# Repo Cleanup Boundary

## Status
Locked

## Purpose
Preserve singular authority inside AutoKirk Future.

This boundary exists to prevent duplicate execution surfaces, legacy authority drift, schema ambiguity, ingress ambiguity, and repo-state contamination.

This file is not guidance.  
It is enforcement.

## Core Rule
AutoKirk Future does not permit parallel authority.

If a surface is not canonical, it must be:
- removed
- disabled
- archived
- or explicitly marked non-operational

Anything left ambiguous becomes drift.

## Authority Lock

### Migration Authority
- `supabase/migrations/*` is the only executable schema authority.
- `spine/migrations/*` is reference-only and must not be executed.
- No schema truth may be inferred from any migration surface outside `supabase/migrations/*`.

### Ingress Authority
- `supabase/functions/stripe-webhook` is the only canonical ingress surface.
- `pages/api/webhook.ts` is non-canonical and must be removed or disabled.
- No other route, function, or service may ingest external events.
- External ingress must remain singular so event identity, replay behavior, obligation creation, and receipt lineage remain deterministic.

### Membership Authority
- `core.workspace_members` is the sole membership authority substrate.
- `core.memberships` is legacy and non-operational.
- No runtime code, function, route, helper, view, or projection may derive membership truth from `core.memberships`.
- Any use of `core.memberships` outside doctrine or cleanup documentation is drift.

### Environment Authority
- Local database is the canonical development environment.
- `--linked` must not be used during lifecycle verification.
- A proof run is valid only when execution and observation occur in the same environment.
- Mixed-environment verification is invalid proof.

## Canonical Active Surface
The following are active and authoritative:

- `supabase/migrations/*`
- governed kernel mutation paths
- kernel lifecycle verification scripts
- receipt-backed lifecycle verification
- doctrine files that still match current truth
- `core.workspace_members` as sole membership authority substrate
- read-only projection surfaces derived from canonical truth

## Reference-Only Surface
The following may remain only as historical reference and must not influence execution:

- `spine/migrations/*`
- archived notes explaining earlier structure
- legacy design references that do not define current runtime behavior

Reference is not authority.

## Remove or Archive
The following must be removed from active repo state or archived outside executable paths:

- `supabase/snippets/Untitled query *.sql`
- `pages/api/webhook.ts`
- duplicate migration copies outside `supabase/migrations/*`
- files implying `core.memberships` is active runtime truth
- any helper, route, or file that creates ambiguity around ingress, membership, schema, or execution authority

Archive is permitted for history.  
Archive does not preserve authority.

## Purge Immediately
The following must not remain in the repo:

- any repo-resident env file containing keys or tokens
- `spine/migrations/.env.local.txt`
- any committed service-role key, anon key, webhook secret, token, or local credential artifact
- any temporary file exposing project identity or credentials beyond approved runtime configuration

If a secret has existed in repo history, it must be treated as compromised and rotated.

## Enforcement Rules

### Rule 1 — Single Schema Path
All schema mutation authority flows through `supabase/migrations/*`.

### Rule 2 — Single Ingress Path
All external events enter through `supabase/functions/stripe-webhook` only.

### Rule 3 — Single Membership Substrate
All membership truth derives from `core.workspace_members` only.

### Rule 4 — Single Environment During Proof
A lifecycle proof must be executed and observed within the same environment boundary.

### Rule 5 — Projection Is Observation Only
Projection may expose canonical truth but may not define, mutate, soften, reinterpret, or replace kernel authority.

### Rule 6 — Repo-Bound Execution Only
Work must remain anchored to this repo and its declared authority surfaces.  
External deployments, legacy repos, screenshots, and prior UI behavior do not override repo truth.

## Cleanup Execution Order
Cleanup proceeds in this order:

1. purge secret-bearing repo artifacts
2. disable or remove non-canonical ingress surfaces
3. quarantine duplicate migration trees
4. remove snippet clutter and legacy runtime drift
5. verify zero runtime usage of non-canonical membership surfaces
6. confirm only canonical authority surfaces remain active

## Verification Standard
Cleanup is complete only when all of the following are true:

- only `supabase/migrations/*` remains executable
- only `supabase/functions/stripe-webhook` remains ingress-authoritative
- no runtime code references `core.memberships`
- no repo-resident secret-bearing artifacts remain
- reference-only material is clearly non-executable
- lifecycle verification scripts still pass
- projection surfaces still derive from canonical truth only

## Failure Conditions
Cleanup fails if any of the following are true:

- more than one active ingress surface exists
- more than one executable migration surface exists
- runtime code references `core.memberships`
- verification mixes local and remote environments
- repo contains active secret-bearing artifacts
- archived or reference-only material continues to shape runtime behavior

## Operating Note
AutoKirk Future remains valid only while authority stays singular.

The moment duplicate authority is tolerated, determinism starts degrading.

This file exists to prevent that.
