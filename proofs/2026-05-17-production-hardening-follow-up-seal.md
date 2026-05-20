# AutoKirk Production Hardening Follow-Up Seal

Date: 2026-05-17

## Scope

This proof closes the remaining production-hardening items after the 2026-05-16 client-ready hardening seal and the 2026-05-17 production closure clean pass.

This is a security-boundary and deployment-readiness seal for controlled design-partner activation only. It does not expand AutoKirk's product surface and does not change kernel doctrine.

## Verified production position

- Canonical Supabase project: `aiuicbyufelqdeiwhmyi`.
- Supabase project status: `ACTIVE_HEALTHY`.
- Supabase database version: PostgreSQL `17.6.1.104` on engine `17`.
- Supabase Security Advisor result: zero security lints returned.
- Latest Vercel production deployment: `dpl_C7kh62BH1KVk9fU6iazRnn2rEij5`.
- Latest Vercel production deployment state: `READY`.
- Latest Vercel production deployment commit: `fceb713bdca34564a2dc020203d4361a640d9321`.
- Latest Vercel production deployment message: `Seal production closure clean pass`.

## Ops endpoint authorization boundary

Source control requires Bearer-token authorization for protected ops routes.

Protected routes checked:

- `/api/ops/capability-status`
- `/api/ops/intake-registry`

Current source files:

- `pages/api/ops/capability-status.ts`
- `pages/api/ops/intake-registry.ts`

Both routes read `Authorization: Bearer <AUTOKIRK_OPS_KEY>` and return `401 OPS_KEY_REQUIRED` when authorization is missing or invalid. The production checks below confirm query-string key transport is not accepted.

## Production HTTP evidence

### Capability status: no key rejected

Request shape:

```bash
curl -i https://autokirk.com/api/ops/capability-status
```

Result:

```txt
HTTP 401 Unauthorized
{"ok":false,"error":"OPS_KEY_REQUIRED"}
```

### Capability status: query-string key rejected

Request shape:

```bash
curl -i "https://autokirk.com/api/ops/capability-status?key=REDACTED"
```

Result:

```txt
HTTP 401 Unauthorized
{"ok":false,"error":"OPS_KEY_REQUIRED"}
```

### Intake registry: no key rejected

Request shape:

```bash
curl -i https://autokirk.com/api/ops/intake-registry
```

Result:

```txt
HTTP 401 Unauthorized
{"ok":false,"error":"OPS_KEY_REQUIRED"}
```

### Intake registry: query-string key rejected

Request shape:

```bash
curl -i "https://autokirk.com/api/ops/intake-registry?key=REDACTED"
```

Result:

```txt
HTTP 401 Unauthorized
{"ok":false,"error":"OPS_KEY_REQUIRED"}
```

## Authorized Bearer status

The prior clean production closure seal records that authorized Bearer-token access using the production `AUTOKIRK_OPS_KEY` succeeds with HTTP/2 `200` and returns `ok=true, authorized=true`.

This follow-up artifact intentionally does not print or embed the production key.

## Auth hardening status

Supabase Security Advisor currently returns zero security lints for project `aiuicbyufelqdeiwhmyi`.

This is the current machine-verifiable advisor state after the hardening sequence. No secret values were exposed during verification.

## Claim

AutoKirk production hardening is sealed for controlled design-partner activation from the deployment and security-boundary perspective.

Verified boundaries:

- production deployment is READY;
- canonical Supabase project is active and healthy;
- PostgreSQL is upgraded to 17.6.x;
- security advisor lints are empty;
- protected ops endpoints reject unauthenticated access;
- protected ops endpoints reject query-string key transport;
- source control requires Bearer-token ops authorization;
- authorized Bearer-token success is documented without exposing the key.

## Non-claims

This proof does not claim:

- broad self-serve readiness;
- enterprise readiness;
- compliance certification;
- legal-proof status;
- audit-proof status;
- third-party security validation;
- two-tenant board isolation under realistic customer access.

## Next gate

The next required proof before controlled design-partner activation is a two-tenant board/customer access proof:

- Tenant A cannot view Tenant B obligations.
- Tenant A cannot resolve Tenant B obligations.
- Tenant A cannot fetch, export, or infer Tenant B receipts.
- Server routes enforce workspace checks before mutation.
- Board visibility remains a proof surface, not a mutation shortcut.
