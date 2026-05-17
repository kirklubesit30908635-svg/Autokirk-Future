# AutoKirk Two-Tenant Board Isolation Proof — Failed

Date: 2026-05-17

## Scope

This proof attempted to validate the next gate after production hardening: tenant-safe board/customer access under realistic production conditions.

The proof was intentionally treated as an adversarial tenant-isolation check, not as a marketing or activation artifact.

## Result

Status: **FAILED / NOT SEALED**

The board/customer access proof cannot be honestly sealed yet because source inspection found hardcoded trusted public workspace IDs in `lib/board/getTenantBoard.ts`.

Those workspace IDs are treated as public board-access exceptions. In production, some of those workspaces contain obligations and receipts. That means a user with the workspace URL can reach board data without either:

- authenticated workspace membership, or
- a signed board token.

This violates the intended controlled-design-partner boundary.

## Production data used for proof

Production Supabase project: `aiuicbyufelqdeiwhmyi`.

Production workspaces include multiple real workspaces with obligations and receipts, including:

- `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`: 24 obligations, 19 receipts.
- `88eecda6-80e4-4eb7-b890-4330674fa7a7`: 6 obligations, 1 receipt.
- `fe04f558-dca1-4948-88d9-87cd1ccd15f2`: 4 obligations, 3 receipts.

Production RLS status was checked for core tenant tables and receipts:

- `core.workspaces`: RLS enabled.
- `core.workspace_members`: RLS enabled.
- `core.obligations`: RLS enabled.
- `core.obligation_sources`: RLS enabled.
- `receipts.receipts`: RLS enabled.

Production SELECT policies are membership-scoped:

- obligations SELECT uses `kernel.user_is_workspace_member(workspace_id)`.
- obligation_sources SELECT uses `kernel.user_is_workspace_member(workspace_id)`.
- receipts SELECT uses `kernel.user_is_workspace_member(workspace_id)`.
- workspaces SELECT uses `kernel.user_is_workspace_member(id)`.
- workspace_members SELECT is scoped to the authenticated user's own membership rows.

This means the database RLS design is directionally correct. The failed boundary is the server-side board exception, not the kernel doctrine.

## Source finding

`lib/board/getTenantBoard.ts` contains a `TRUSTED_PUBLIC_BOARD_WORKSPACES` set. The current implementation includes hardcoded workspace IDs and then allows service-role board reads when `trustedPublicBoard` is true.

That creates this access path:

```txt
public board URL -> hardcoded trusted workspace -> service-role read -> board data returned
```

The safe intended path should be:

```txt
authenticated workspace member -> user-scoped read
```

or:

```txt
signed board token -> service-role read for exactly that workspace
```

## Mutation boundary source check

`pages/api/obligations/resolve-with-proof.ts` does not resolve an obligation merely because a caller provides an obligation ID.

The route first loads the obligation, then accepts mutation only when one of these is true:

- authenticated user is a member of the obligation's workspace; or
- supplied proof-action token verifies against that exact `workspace_id` and `obligation_id`.

The proof-action token is workspace- and obligation-bound, so it cannot be reused across tenants or obligations if the signing key remains secret.

## Required correction

Remove all hardcoded public board workspace IDs from `TRUSTED_PUBLIC_BOARD_WORKSPACES`.

The corrected shape should be:

```ts
const TRUSTED_PUBLIC_BOARD_WORKSPACES = new Set(
  (process.env.AUTOKIRK_PUBLIC_BOARD_WORKSPACE_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
```

For controlled design-partner activation, the production environment should leave `AUTOKIRK_PUBLIC_BOARD_WORKSPACE_IDS` empty unless there is a deliberately documented public demo workspace with no sensitive obligations or receipts.

## Re-run criteria

After correcting the board access exception, rerun the proof:

1. Public request to `/board/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` with no key must return fallback/empty board.
2. Public request to `/board/88eecda6-80e4-4eb7-b890-4330674fa7a7` with no key must return fallback/empty board.
3. Public request to `/board/fe04f558-dca1-4948-88d9-87cd1ccd15f2` with no key must return fallback/empty board.
4. Signed board URL for one workspace must show only that workspace's obligations and receipts.
5. A proof-action token generated for Workspace A / Obligation A must not resolve Workspace B / Obligation B.
6. Authenticated user access must be limited by `core.workspace_members` membership.

## Claim

AutoKirk tenant isolation is not yet sealed for controlled design-partner activation.

The kernel/RLS posture is directionally correct, but board-level hardcoded public workspace access must be removed before the proof can pass.

## Non-claims

This artifact does not claim:

- two-tenant board isolation is sealed;
- broad self-serve readiness;
- enterprise readiness;
- compliance certification;
- audit-proof or legal-proof status.
