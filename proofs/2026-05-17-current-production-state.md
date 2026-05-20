# AutoKirk current production state seal

Date: 2026-05-17

This proof artifact records the current cross-system production state across Vercel, GitHub, and Supabase after the May 16 client-ready hardening seal and the May 17 follow-up production deployments.

## Live product identity

- Production domain: `autokirk.com`
- Vercel project: `autokirk-future`
- Vercel project id: `prj_lJhyFrdcF6qOokBzf2cNVuMyhWoh`
- Supabase project ref: `aiuicbyufelqdeiwhmyi`
- Supabase project name: `AutoKirk-Future`
- GitHub repository: `kirklubesit30908635-svg/Autokirk-Future`
- Default branch: `main`

## Production deployment observed before this seal update

Latest observed Vercel production deployment before this proof update:

```text
dpl_E6un4CZWM7pB3Muts8LQCodThy4R
```

Observed deployment state:

```text
READY
```

Observed production aliases:

```text
autokirk.com
autokirk-future-kirklubesit30908635-svgs-projects.vercel.app
autokirk-future-git-main-kirklubesit30908635-svgs-projects.vercel.app
```

Observed GitHub deployment commit:

```text
753a7bed0f386b8c9aed915297b272f4c9484d56
```

Observed commit message:

```text
Align system truth verifier fixtures
```

## Supabase state observed for this seal

Project details observed through the connected Supabase management surface:

```text
project_ref = aiuicbyufelqdeiwhmyi
name = AutoKirk-Future
status = ACTIVE_HEALTHY
region = us-east-1
database_version = 17.6.1.104
postgres_engine = 17
release_channel = ga
```

Security advisor output observed for this seal:

```json
{"lints":[]}
```

Supabase production claim status: active, healthy, Postgres 17.6.x, current security advisor lints empty.

## Live unauthenticated ops endpoint verification

Endpoint checked:

```text
https://autokirk.com/api/ops/capability-status
```

Observed no-key response:

```text
HTTP 401 Unauthorized
{"ok":false,"error":"OPS_KEY_REQUIRED"}
```

Unauthenticated ops-boundary claim status: verified.

## Ops key transport hardening applied in this seal update

The previous ops route implementation accepted `AUTOKIRK_OPS_KEY` either as a Bearer authorization header or as a `?key=` query parameter.

This seal update removed query-string key acceptance from:

```text
pages/api/ops/capability-status.ts
pages/api/ops/intake-registry.ts
```

Current route contract after this update:

```text
GET without Authorization: Bearer <AUTOKIRK_OPS_KEY> -> 401 OPS_KEY_REQUIRED
GET with valid Authorization: Bearer <AUTOKIRK_OPS_KEY> -> 200 authorized ops response
Query-string key transport is not accepted.
```

Commits created by this hardening update:

```text
1b4ae39876ec12fbc6ceed2fade665597b868771 - Require Bearer ops key for capability status
7ce8f30801a57ed0880c86f821248f30684c1fa1 - Require Bearer ops key for intake registry
```

## Current verified / pending split

Verified:

- Supabase project `aiuicbyufelqdeiwhmyi` is active and healthy.
- Supabase database is on Postgres 17.6.x / engine 17.
- Supabase security advisor currently returns zero lints.
- Vercel production deployment observed before this seal was READY.
- `autokirk.com` was attached to the observed production deployment.
- Unauthenticated live ops endpoint access is denied with `401 OPS_KEY_REQUIRED`.
- Query-string ops-key support has been removed from the two ops endpoints in source control.

Pending / requires a secret-aware runtime check or dashboard confirmation:

- Confirm the fresh Vercel deployment created from this proof update and the two Bearer-only route commits is READY.
- Re-check live `/api/ops/capability-status?key=<AUTOKIRK_OPS_KEY>` after deployment and record that query-string key access is rejected.
- Execute the authorized Bearer-token ops endpoint check with the production `AUTOKIRK_OPS_KEY` and record the success status without exposing the key.
- Confirm Supabase Auth leaked-password protection in the Supabase dashboard if that setting is not directly visible through the management connector.
- Re-run Supabase security advisor after any Auth dashboard change and record the result.

## Current safe claim

```text
AutoKirk production is live and healthy across Vercel and Supabase, with `autokirk.com` attached, Supabase active on Postgres 17.6.x, current Supabase security advisor lints empty, and unauthenticated ops access denied. The ops key transport path has been hardened in source control to Bearer-token-only access. Final runtime closure requires verifying the fresh Vercel deployment, confirming query-string key rejection live, capturing authorized Bearer-token success with the production ops key, and explicitly confirming the Supabase Auth leaked-password protection setting.
```
