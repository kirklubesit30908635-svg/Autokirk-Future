update core.obligations
set due_at = now() - interval '1 day'
where id = (
  select o.id
  from core.obligations o
  where o.resolved_at is null
    and o.obligation_code = 'fulfill_promised_service'
  order by o.created_at desc
  limit 1
)
returning id as obligation_id, due_at, created_at;
