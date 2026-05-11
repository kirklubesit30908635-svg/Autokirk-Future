-- Local verification seed data
-- This file is replayed by `npx supabase db reset` after all migrations.
--
-- Canonical local proof fixture:
--   entity_id    = 33333333-3333-3333-3333-333333333333
--   workspace_id = aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
--   actor_id     = 11111111-1111-1111-1111-111111111111
--
-- The verify scripts call governed API paths with workspace_id + actor_id.
-- core.assert_member(workspace_id, actor_id) requires the membership row.
-- Entity projections and integrity proofs expect the legal entity id.

insert into core.legal_entities (
  id,
  entity_name,
  entity_type
)
values (
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Autokirk Proof Entity',
  'test'
)
on conflict (id) do update
set
  entity_name = excluded.entity_name,
  entity_type = excluded.entity_type;

insert into core.workspaces (
  id,
  name,
  entity_id
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'Autokirk Proof Workspace',
  '33333333-3333-3333-3333-333333333333'::uuid
)
on conflict (id) do update
set
  name = excluded.name,
  entity_id = excluded.entity_id;

insert into core.workspace_members (
  workspace_id,
  user_id,
  role
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'owner'
)
on conflict do nothing;

-- Phase 2 cross-tenant isolation fixture
-- Tenant B exists so user 2222 can prove positive access to B
-- while user 1111 proves denial against B.

insert into core.legal_entities (
  id,
  entity_name,
  entity_type
)
values (
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Autokirk Isolation Test Entity',
  'test'
)
on conflict (id) do update
set
  entity_name = excluded.entity_name,
  entity_type = excluded.entity_type;

insert into core.workspaces (
  id,
  name,
  entity_id
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'Autokirk Isolation Test Workspace',
  '44444444-4444-4444-4444-444444444444'::uuid
)
on conflict (id) do update
set
  name = excluded.name,
  entity_id = excluded.entity_id;

insert into core.workspace_members (
  workspace_id,
  user_id,
  role
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'owner'
)
on conflict do nothing;
