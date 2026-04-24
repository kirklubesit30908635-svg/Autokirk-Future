insert into core.obligations (workspace_id, status, resolution_type)
values (
  '91befe9d-ccb6-42cc-9f63-eedc9b191b58'::uuid,
  'open',
  null
)
returning id;