# Client-ready hardening seal

Date: 2026-05-16

## Scope

This hardening pass cleaned up the operational-ingestion and agentic proof-boundary upgrade for a safer client-ready posture.

## Live Supabase project

Canonical project: `aiuicbyufelqdeiwhmyi`

## Applied live

### SECURITY DEFINER direct-execution lockdown

Remaining privileged SECURITY DEFINER functions in `api`, `core`, `ledger`, and `public` schemas were locked down so `anon` and `authenticated` cannot execute them directly.

Verified live query returned:

```text
exposed_security_definer_count = 0
total_security_definer_count = 30
```

Current required path:

```text
browser UI -> Next.js API route -> service_role -> governed API/kernel function
```

Rejected path:

```text
browser UI -> direct Supabase privileged RPC
```

### Search-path hardening

Supabase advisor `function_search_path_mutable` warnings were resolved for legacy helper functions by setting explicit `search_path` values without rewriting function bodies.

Applied live batches:

- `20260516151110_pin_ledger_hash_function_search_paths`
- `20260516151120_pin_kernel_guard_function_search_paths`
- `20260516151130_pin_core_guard_function_search_paths`

### Advisor state after hardening

Supabase security advisors now show only:

- `auth_leaked_password_protection` disabled

That is a Supabase Auth project setting, not a SQL migration. It should be enabled in Supabase Dashboard > Authentication > Security / Password protection.

## GitHub/client hardening

Added/updated:

- `pages/api/ops/capability-status.ts` now requires `AUTOKIRK_OPS_KEY` before returning operational table counts.
- `pages/api/ops/intake-registry.ts` was tightened to require `AUTOKIRK_OPS_KEY` and remove sensitive row fields from the ops response.
- `proofs/2026-05-16-client-ready-rpc-lockdown.md` documents the live direct-RPC lockdown.

## Remaining manual step

Enable leaked-password protection in Supabase Auth settings.

## Client-ready result

The upgraded AutoKirk system now exposes operational ingestion and proof-boundary capability through UI/server routes while keeping privileged mutation and kernel surfaces server-bound.
