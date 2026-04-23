begin;

create temporary table _proof_ctx as
select
  '1298b412-103e-4772-a110-980291fc5a74'::uuid as workspace_id,
  'd3939c3a-ce5c-409d-9420-ba2eb1df3bd1'::uuid as actor_id,
  '54566430-04e4-48de-a010-c369be9cb26b'::uuid as obligation_id,
  'proof-resolve-obligation-1'::text as idem_key,
  'fulfilled'::text as resolution_type,
  'local end-to-end proof'::text as reason,
  '{"proof":"local-e2e"}'::jsonb as evidence_present,
  '[]'::jsonb as failed_checks,
  'rule-v1'::text as rule_version;

create temporary table _proof_before as
select
  (select count(*) from ledger.events e join _proof_ctx c on e.obligation_id = c.obligation_id) as event_count,
  (select count(*) from receipts.receipts r join _proof_ctx c on r.obligation_id = c.obligation_id) as receipt_count;

select 'before' as phase, * from _proof_before;

select api.resolve_obligation(
  p_obligation_id    := (select obligation_id from _proof_ctx),
  p_actor_id         := (select actor_id from _proof_ctx),
  p_resolution_type  := (select resolution_type from _proof_ctx),
  p_reason           := (select reason from _proof_ctx),
  p_evidence_present := (select evidence_present from _proof_ctx),
  p_failed_checks    := (select failed_checks from _proof_ctx),
  p_rule_version     := (select rule_version from _proof_ctx),
  p_idempotency_key  := (select idem_key from _proof_ctx)
) as first_call_result;

create temporary table _proof_after_first as
select
  (select count(*) from ledger.events e join _proof_ctx c on e.obligation_id = c.obligation_id) as event_count,
  (select count(*) from receipts.receipts r join _proof_ctx c on r.obligation_id = c.obligation_id) as receipt_count;

select 'after_first_call' as phase, * from _proof_after_first;

select
  o.id,
  o.workspace_id,
  o.status,
  o.resolution_type,
  o.resolution_reason,
  o.proof_status,
  o.created_at,
  o.resolved_at
from core.obligations o
join _proof_ctx c on o.id = c.obligation_id;

select
  e.*
from ledger.events e
join _proof_ctx c on e.obligation_id = c.obligation_id
order by 1;

select
  r.*
from receipts.receipts r
join _proof_ctx c on r.obligation_id = c.obligation_id
order by r.emitted_at desc;

select api.resolve_obligation(
  p_obligation_id    := (select obligation_id from _proof_ctx),
  p_actor_id         := (select actor_id from _proof_ctx),
  p_resolution_type  := (select resolution_type from _proof_ctx),
  p_reason           := (select reason from _proof_ctx),
  p_evidence_present := (select evidence_present from _proof_ctx),
  p_failed_checks    := (select failed_checks from _proof_ctx),
  p_rule_version     := (select rule_version from _proof_ctx),
  p_idempotency_key  := (select idem_key from _proof_ctx)
) as second_call_result;

create temporary table _proof_after_second as
select
  (select count(*) from ledger.events e join _proof_ctx c on e.obligation_id = c.obligation_id) as event_count,
  (select count(*) from receipts.receipts r join _proof_ctx c on r.obligation_id = c.obligation_id) as receipt_count;

select 'after_second_call' as phase, * from _proof_after_second;

with
b as (select * from _proof_before),
f as (select * from _proof_after_first),
s as (select * from _proof_after_second)
select
  b.event_count as before_events,
  f.event_count as after_first_events,
  s.event_count as after_second_events,
  b.receipt_count as before_receipts,
  f.receipt_count as after_first_receipts,
  s.receipt_count as after_second_receipts,
  (f.event_count >= b.event_count + 1) as event_created_on_first_call,
  (f.receipt_count >= b.receipt_count + 1) as receipt_created_on_first_call,
  (s.event_count = f.event_count) as no_duplicate_event_on_replay,
  (s.receipt_count = f.receipt_count) as no_duplicate_receipt_on_replay,
  (
    select o.resolved_at is not null
    from core.obligations o
    join _proof_ctx c on o.id = c.obligation_id
  ) as obligation_resolved,
  (
    select o.resolution_type = (select resolution_type from _proof_ctx)
    from core.obligations o
    join _proof_ctx c on o.id = c.obligation_id
  ) as obligation_resolution_type_written,
  (
    select exists (
      select 1
      from receipts.receipts r
      join _proof_ctx c on r.obligation_id = c.obligation_id
      where r.actor_id = c.actor_id
        and r.resolution_type = c.resolution_type
        and r.reason = c.reason
        and r.rule_version = c.rule_version
    )
  ) as receipt_payload_written;

commit;