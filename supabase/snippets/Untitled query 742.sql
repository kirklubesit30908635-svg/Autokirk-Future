begin;

create temporary table _seed_ids as
select
  gen_random_uuid() as workspace_id,
  gen_random_uuid() as user_id,
  gen_random_uuid() as member_id,
  gen_random_uuid() as obligation_id;

insert into core.workspaces (
  id,
  name,
  created_at
)
select
  workspace_id,
  'Proof Workspace',
  now()
from _seed_ids;

insert into core.workspace_members (
  id,
  workspace_id,
  user_id,
  role,
  created_at
)
select
  member_id,
  workspace_id,
  user_id,
  'owner',
  now()
from _seed_ids;

insert into core.obligations (
  id,
  workspace_id,
  status,
  resolution_type,
  resolution_reason,
  proof_status,
  created_at,
  resolved_at
)
select
  obligation_id,
  workspace_id,
  'open',
  null,
  null,
  'pending',
  now(),
  null
from _seed_ids;

select
  w.id as workspace_id,
  wm.user_id as actor_id,
  o.id as obligation_id
from core.workspaces w
join core.workspace_members wm on wm.workspace_id = w.id
join core.obligations o on o.workspace_id = w.id
join _seed_ids s on s.workspace_id = w.id;

commit;