# AutoKirk Two-Tenant Board Isolation Pass Seal

Date: 2026-05-17

## Scope

This proof seals the corrective follow-up to the failed two-tenant board isolation proof recorded in `proofs/2026-05-17-two-tenant-board-isolation-failed-proof.md`.

The purpose was to remove the board-level public workspace exception, deploy the patch, and verify that public board URLs no longer expose tenant obligations or receipts without membership or a signed board token.

## Correction shipped

Commit: `2d65fd9c63d091ffd5675ec9b9be882052fc847f`

Commit message: `Remove hardcoded public board workspaces`

Changed file:

- `lib/board/getTenantBoard.ts`

The hardcoded public board workspace IDs were removed from `TRUSTED_PUBLIC_BOARD_WORKSPACES`.

Corrected shape:

```ts
const TRUSTED_PUBLIC_BOARD_WORKSPACES = new Set(
  (process.env.AUTOKIRK_PUBLIC_BOARD_WORKSPACE_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
```

The only remaining public-board escape hatch is explicit environment configuration through `AUTOKIRK_PUBLIC_BOARD_WORKSPACE_IDS`.

Controlled design-partner production should leave that variable empty unless a deliberately fake/demo workspace with no sensitive obligations or receipts is created and documented.

## Deployment verified

Production deployment:

- Deployment ID: `dpl_7PHtjStX8QKw11uBvARdXnLPLAxi`
- State: `READY`
- Alias: `autokirk.com`
- Commit: `2d65fd9c63d091ffd5675ec9b9be882052fc847f`
- Commit message: `Remove hardcoded public board workspaces`

## Production data basis

The prior failed proof established production workspaces with real tenant data:

- `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`: 24 obligations, 19 receipts.
- `88eecda6-80e4-4eb7-b890-4330674fa7a7`: 6 obligations, 1 receipt.
- `dc6b0abc-c219-444d-9608-8c43306ee838`: 8 obligations, 0 receipts.
- `fe04f558-dca1-4948-88d9-87cd1ccd15f2`: 4 obligations, 3 receipts.

The proof target is that public no-key board requests must not expose those obligations or receipts.

## Public board access checks

All checks below were run against live production on `autokirk.com` after deployment `dpl_7PHtjStX8QKw11uBvARdXnLPLAxi` reached `READY`.

### Former hardcoded workspace: `88eecda6-80e4-4eb7-b890-4330674fa7a7`

Request:

```txt
GET https://autokirk.com/board/88eecda6-80e4-4eb7-b890-4330674fa7a7
```

Observed result:

```txt
HTTP 200
Board title: Link needs refresh
obligations: []
receipts: []
systemActivity.overdueCount: 0
systemActivity.systemActingCount: 0
```

Conclusion: public no-key access does not expose this workspace's obligations or receipts.

### Former hardcoded workspace: `dc6b0abc-c219-444d-9608-8c43306ee838`

Request:

```txt
GET https://autokirk.com/board/dc6b0abc-c219-444d-9608-8c43306ee838
```

Observed result:

```txt
HTTP 200
Board title: Link needs refresh
obligations: []
receipts: []
systemActivity.overdueCount: 0
systemActivity.systemActingCount: 0
```

Conclusion: public no-key access does not expose this workspace's obligations.

### Receipt-bearing non-public workspace: `fe04f558-dca1-4948-88d9-87cd1ccd15f2`

Request:

```txt
GET https://autokirk.com/board/fe04f558-dca1-4948-88d9-87cd1ccd15f2
```

Observed result:

```txt
HTTP 200
Board title: Link needs refresh
obligations: []
receipts: []
systemActivity.overdueCount: 0
systemActivity.systemActingCount: 0
```

Conclusion: public no-key access does not expose this workspace's obligations or receipts, even though the workspace has production obligations and receipts.

## Mutation boundary source check

`pages/api/obligations/resolve-with-proof.ts` does not resolve an obligation merely because a caller provides an obligation ID.

The route first loads the obligation, then accepts mutation only if one of these is true:

- the authenticated user is a member of the obligation's workspace; or
- a supplied proof-action token verifies against that exact `workspace_id` and `obligation_id`.

The proof-action token is workspace- and obligation-bound. A token for Workspace A / Obligation A cannot be reused for Workspace B / Obligation B if the signing key remains secret.

## RLS posture retained

The prior failed proof confirmed that production RLS is enabled on the tenant-relevant tables:

- `core.workspaces`
- `core.workspace_members`
- `core.obligations`
- `core.obligation_sources`
- `receipts.receipts`

Production SELECT policies remain membership-scoped through `kernel.user_is_workspace_member(...)` or own-user membership rows.

## Claim

AutoKirk has now sealed the board-level two-tenant public-access isolation gap identified on 2026-05-17.

For public no-key board access, production now returns only the fallback board for tested tenant workspaces and does not expose obligations or receipts.

AutoKirk is ready to proceed to controlled design-partner activation from the board-public-access isolation perspective, subject to the remaining non-claims below.

## Non-claims

This proof does not claim:

- broad self-serve readiness;
- enterprise readiness;
- compliance certification;
- legal-proof status;
- audit-proof status;
- third-party security validation;
- that environment-configured public board workspaces are safe unless deliberately kept empty/demo-only;
- that every future route is tenant-safe without route-specific proof.

## Next gate

Proceed to controlled design-partner activation only in the narrow form:

- one customer;
- one workflow;
- one board;
- one proof rule;
- one receipt-backed closure;
- founder-led onboarding.

No vertical forks. No broad self-serve. No enterprise/compliance claims.