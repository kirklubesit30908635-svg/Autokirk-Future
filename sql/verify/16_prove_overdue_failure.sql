with target as (
  select o.id
  from core.obligations o
  where o.resolved_at is null
  order by o.created_at desc
  limit 1
),
updated as (
  update core.obligations o
     set due_at = now() - interval '1 day'
    from target t
   where o.id = t.id
  returning o.id, o.due_at
)
select
  p.obligation_id,
  p.resolution_type,
  p.proof_status,
  p.lifecycle_state,
  p.due_at
from projection.obligation_lifecycle p
join updated u
  on u.id = p.obligation_id;
