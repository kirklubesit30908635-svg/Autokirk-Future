insert into core.obligations (workspace_id, status, resolution_type)
values (
  '5dbbfd1b-b6e9-4ab1-bb1e-98cc000d5168'::uuid,
  'open',
  null
)
returning id;