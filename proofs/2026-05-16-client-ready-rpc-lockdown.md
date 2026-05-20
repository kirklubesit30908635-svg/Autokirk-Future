# Client-ready RPC lockdown

Date: 2026-05-16

Live Supabase project: `aiuicbyufelqdeiwhmyi`

## Applied live

Two Supabase hardening migrations were applied live:

- `20260516150100_client_ready_api_rpc_lockdown`
- `20260516150200_client_ready_core_ledger_rpc_lockdown`

The direct `anon` and `authenticated` execute grants were removed from remaining privileged SECURITY DEFINER functions in `api`, `core`, `ledger`, and `public` schemas.

## Verified live

Verification query returned zero rows for SECURITY DEFINER functions in `api`, `core`, `ledger`, or `public` that are still executable by `anon` or `authenticated`.

## Current doctrine

Browser/client code must not call privileged RPCs directly.

Allowed path:

```text
browser UI -> Next.js API route -> service_role -> governed API/kernel function
```

Not allowed:

```text
browser UI -> Supabase anon/authenticated direct privileged RPC
```

## Why this matters

This moves AutoKirk closer to a client-ready posture: the UI can expose operational capability while the governed mutation surface remains server-bound.

## Repo note

The live lockdown SQL was applied directly through the Supabase connector. A full migration file was not committed because the GitHub write safety filter blocked committing the bulk revoke/grant SQL. This evidence note preserves the operational state and verification result.
