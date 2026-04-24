begin;

create temporary table _proof_ctx as
select
  wm.workspace_id,
  wm.user_id as actor_id,
  (
    select o.id
    from kernel.obligations o
    where o.workspace_id = wm.workspace_id
      and o.resolved_at is null
    order by o.created_at asc
    limit 1
  ) as obligation_id,
  'proof-resolve-obligation-1'::text as idem_key
from core.workspace_members wm
limit 1;

do $$
begin
  if not exists (select 1 from _proof_ctx) then
    raise exception 'PROOF_BLOCKED: no core.workspace_members row found';
  end if;

  if (select obligation_id from _proof_ctx limit 1) is null then
    raise exception 'PROOF_BLOCKED: no unresolved kernel.obligations row found';
  end if;
end
$$;

create temporary table _proof_before as
select
  (select count(*) from kernel.events e join _proof_ctx c on e.obligation_id = c.obligation_id) as event_count,
  (select count(*) from kernel.receipts r join _proof_ctx c on r.obligation_id = c.obligation_id) as receipt_count;

select api.resolve_obligation(
  p_workspace_id      := (select workspace_id from _proof_ctx),
  p_obligation_id     := (select obligation_id from _proof_ctx),
  p_resolution_code   := 'fulfilled',
  p_resolution_reason := 'local end-to-end proof',
  p_actor_id          := (select actor_id from _proof_ctx),
  p_evidence          := '{"proof":"local-e2e"}'::jsonb,
  p_idempotency_key   := (select idem_key from _proof_ctx)
) as first_call_result;

create temporary table _proof_after_first as
select
  (select count(*) from kernel.events e join _proof_ctx c on e.obligation_id = c.obligation_id) as event_count,
  (select count(*) from kernel.receipts r join _proof_ctx c on r.obligation_id = c.obligation_id) as receipt_count;

select
  o.id,
  o.status,
  o.resolution_code,
  o.resolution_reason,
  o.resolved_at,
  o.last_receipt_id
from kernel.obligations o
join _proof_ctx c on o.id = c.obligation_id;

select api.resolve_obligation(
  p_workspace_id      := (select workspace_id from _proof_ctx),
  p_obligation_id     := (select obligation_id from _proof_ctx),
  p_resolution_code   := 'fulfilled',
  p_resolution_reason := 'local end-to-end proof',
  p_actor_id          := (select actor_id from _proof_ctx),
  p_evidence          := '{"proof":"local-e2e"}'::jsonb,
  p_idempotency_key   := (select idem_key from _proof_ctx)
) as second_call_result;

create temporary table _proof_after_second as
select
  (select count(*) from kernel.events e join _proof_ctx c on e.obligation_id = c.obligation_id) as event_count,
  (select count(*) from kernel.receipts r join _proof_ctx c on r.obligation_id = c.obligation_id) as receipt_count;

with
b as (select * from _proof_before),
f as (select * from _proof_after_first),
s as (select * from _proof_after_second)
select
  (f.event_count >= b.event_count + 1) as event_created_on_first_call,
  (f.receipt_count >= b.receipt_count + 1) as receipt_created_on_first_call,
  (s.event_count = f.event_count) as no_duplicate_event_on_replay,
  (s.receipt_count = f.receipt_count) as no_duplicate_receipt_on_replay,
  (
    select o.resolved_at is not null
    from kernel.obligations o
    join _proof_ctx c on o.id = c.obligation_id
  ) as obligation_resolved,
  (
    select o.last_receipt_id is not null
    from kernel.obligations o
    join _proof_ctx c on o.id = c.obligation_id
  ) as receipt_linked_to_obligation;

commit;