do $$
begin
  insert into core.workspaces (id, name)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'autokirk-verify-workspace')
  on conflict (id) do nothing;

  insert into auth.users (id)
  values ('11111111-1111-1111-1111-111111111111')
  on conflict (id) do nothing;

  insert into core.workspace_members (workspace_id, user_id, role)
  values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'owner'
  )
  on conflict do nothing;
end
$$;