# Authority Substrate Scope Decision

## Decision

`core.workspace_members` is the sole canonical membership authority substrate in AutoKirk Future.

## Meaning

Membership truth for a workspace is determined only by rows in:

`core.workspace_members`

No other table, view, function, route, helper, or projection layer may serve as base membership truth.

## Rejected substrate

The following is permanently rejected as canonical membership truth:

`core.memberships`

It must not be created, referenced, patched, or reintroduced into the active Future spine.

## Guard rule

All membership enforcement must flow through:

- `core.is_member(p_workspace_id uuid)`
- `core.assert_member(p_workspace_id uuid)`

These functions must evaluate membership only from `core.workspace_members`.

## Boundary rule

- Kernel is the only mutation authority
- Watchdog is read-only
- Learning is advisory-only
- UI is projection-only

No layer outside kernel may define or mutate membership truth.

## Build implication

Any migration, function, RPC, route, helper, or UI flow that derives membership truth from anything other than `core.workspace_members` fails constitutional review.

## Current implementation

Implemented in spine:

- `0004_workspace_members.sql`
- `0005_membership_guards.sql`

## Status

LOCKED
