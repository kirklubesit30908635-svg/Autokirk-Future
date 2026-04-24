insert into core.obligations (workspace_id, status, resolution_type)
values (
  'dac0bf40-aba8-4d65-bc42-157dd103f7f6'::uuid,
  'open',
  null
)
returning id;