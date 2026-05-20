# Local Board Auth Seed (Dev Only)

Purpose: one-command local smoke-login/session seed for `/system-proof` without touching kernel mutation code.

## Command

```powershell
npm run board:auth:seed
```

This command:

1. Creates or reuses a local Supabase auth user (by email).
2. Upserts membership in `core.workspace_members` for workspace `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` using `supabase db query --local`.
3. Performs password sign-in against local Supabase.
4. Prints a `/system-proof#access_token=...` URL that establishes a browser session for board smoke runs.

Prerequisite:

- Local Supabase must be running (`npx supabase start`).

## Optional overrides

```powershell
npm run board:auth:seed -- --email board.local+qa@autokirk.local --password "your-local-password" --site-url http://localhost:3000
```

Supported env/arg overrides:

- `LOCAL_BOARD_DEV_EMAIL` or `--email`
- `LOCAL_BOARD_DEV_PASSWORD` or `--password`
- `LOCAL_BOARD_SITE_URL` or `--site-url`

## Local-only guardrails

- The helper exits unless `NEXT_PUBLIC_SUPABASE_URL` points to localhost/127.0.0.1.
- The helper exits unless the board `site-url` points to localhost/127.0.0.1.
- This helper is for local smoke/dev sessions only. Do not use in production.
