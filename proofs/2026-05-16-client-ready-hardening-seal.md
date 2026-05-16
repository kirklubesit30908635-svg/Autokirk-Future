# Client-ready hardening seal

Date: 2026-05-16

## Scope

This hardening pass cleaned up the operational-ingestion and agentic proof-boundary upgrade for a safer client-ready posture.

This artifact is the canonical client-ready production hardening seal for commit `3a7ddbc4fc18b07fd706050b2e26adbf6f94497c` and deployment `dpl_5w7Kg42RFojRAchoYLVgmKRM8ma9`.

## Live Supabase project

Canonical project: `aiuicbyufelqdeiwhmyi`

## Applied live

### Postgres upgrade verification

Live query:

```sql
select version();
```

Returned:

```text
PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
```

Upgrade claim status: verified.

### SECURITY DEFINER direct-execution lockdown

Remaining privileged SECURITY DEFINER functions in `api`, `core`, `ledger`, and `public` schemas were locked down so `anon` and `authenticated` cannot execute them directly.

Verified live query returned:

```text
exposed_security_definer_count = 0
total_security_definer_count = 30
```

Follow-up verification query returned no exposed functions:

```json
[]
```

Current required path:

```text
browser UI -> Next.js API route -> service_role -> governed API/kernel function
```

Rejected path:

```text
browser UI -> direct Supabase privileged RPC
```

### Ops endpoint boundary verification

Representative endpoint:

```text
https://autokirk.com/api/ops/capability-status
```

Route contract from code:

```text
GET without AUTOKIRK_OPS_KEY -> 401 OPS_KEY_REQUIRED
GET with valid AUTOKIRK_OPS_KEY as Bearer token or query key -> 200 authorized capability status
```

Live no-key call:

```text
GET /api/ops/capability-status
status = 401
body = {"ok":false,"error":"OPS_KEY_REQUIRED"}
```

With-key call:

```text
status = pending
reason = external verifier did not have access to AUTOKIRK_OPS_KEY or a secret-aware connector capable of injecting the production key
```

Ops API protection claim status: denial verified; authorized success pending keyed runtime proof.

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

Leaked-password protection status: pending manual dashboard toggle.

## GitHub/client hardening

Added/updated:

- `pages/api/ops/capability-status.ts` now requires `AUTOKIRK_OPS_KEY` before returning operational table counts.
- `pages/api/ops/intake-registry.ts` was tightened to require `AUTOKIRK_OPS_KEY` and remove sensitive row fields from the ops response.
- `proofs/2026-05-16-client-ready-rpc-lockdown.md` documents the live direct-RPC lockdown.

## Verified / pending split

Verified:

- Production deployment `dpl_5w7Kg42RFojRAchoYLVgmKRM8ma9` is READY on Vercel.
- Deployment commit is `3a7ddbc4fc18b07fd706050b2e26adbf6f94497c` with message `Document client-ready hardening seal`.
- `autokirk.com` is attached to the production Vercel project.
- Supabase project `aiuicbyufelqdeiwhmyi` reports PostgreSQL 17.6.
- Exposed privileged SECURITY DEFINER function count for browser roles is 0.
- Live unauthenticated ops endpoint access is denied with 401 `OPS_KEY_REQUIRED`.
- Supabase security advisors no longer show search-path warnings in the current security advisor output.

Pending:

- Execute the authorized ops endpoint check with the production `AUTOKIRK_OPS_KEY` and record the success response code.
- Enable Supabase Auth leaked-password protection in the Supabase dashboard.
- Re-run Supabase security advisors after the Auth toggle and record zero remaining security warnings, if clean.

## Remaining manual step

Enable leaked-password protection in Supabase Auth settings.

## Client-ready result

The upgraded AutoKirk system now exposes operational ingestion and proof-boundary capability through UI/server routes while keeping privileged mutation and kernel surfaces server-bound.

Canonical claim:

```text
AutoKirk production is client-ready from the deployment and security-boundary perspective, with privileged browser RPC closed, Postgres upgraded, search-path advisories cleared, and unauthenticated ops access denied. Final Auth hardening remains pending until leaked-password protection is enabled and the authorized ops-key success call is captured.
```
