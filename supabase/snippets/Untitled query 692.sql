insert into core.obligations (workspace_id, status, resolution_type)
values (
  '<NEW_WORKSPACE_ID>'::uuid,
  'open',
  null
)
returning id;