insert into core.workspaces (id, name)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'AutoKirk Local Test Workspace'
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

insert into core.obligations (id, workspace_id, status, proof_status)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'open',
  'pending'
)
on conflict do nothing;
