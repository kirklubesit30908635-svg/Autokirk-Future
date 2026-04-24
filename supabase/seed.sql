insert into core.legal_entities (id, entity_name, entity_type)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'AutoKirk Local Test Workspace Entity',
  'workspace'
)
on conflict (id) do update
set
  entity_name = excluded.entity_name,
  entity_type = excluded.entity_type;

insert into core.workspaces (id, name, entity_id)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'AutoKirk Local Test Workspace',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
)
on conflict do nothing;

insert into core.workspace_members (id, workspace_id, user_id, role)
values (
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'owner'
)
on conflict do nothing;
