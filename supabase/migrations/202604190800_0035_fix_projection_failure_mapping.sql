create schema if not exists projection;

drop view if exists projection.payment_operationalization_watchdog;
drop view if exists projection.obligation_lifecycle;

create view projection.obligation_lifecycle as
select
  o.id as obligation_id,
  o.obligation_code,
  o.workspace_id,
  o.created_at as obligation_created_at,
  os.source_event_id,
  se.source_system,
  se.source_event_key,
  se.source_event_type,
  se.created_at as source_event_created_at,
  r.id as receipt_id,
  r.resolution_type,
  r.proof_status,
  r.emitted_at as receipt_emitted_at,
  o.truth_burden,
  case
    when r.id is null then 'open'
    when r.proof_status = 'sufficient' then 'resolved'
    when r.proof_status in ('insufficient', 'rejected') then 'failed'
    else 'unknown'
  end as lifecycle_state
from core.obligation_sources os
join core.obligations o
  on o.id = os.obligation_id
left join ingest.source_events se
  on se.id = os.source_event_id
left join receipts.receipts r
  on r.obligation_id = o.id;

create view projection.payment_operationalization_watchdog as
with lifecycle as (
  select
    pl.obligation_id,
    pl.workspace_id,
    pl.obligation_code,
    pl.obligation_created_at as opened_at,
    pl.source_event_id,
    pl.source_system,
    pl.source_event_key,
    pl.source_event_type,
    pl.source_event_created_at,
    pl.receipt_id,
    pl.resolution_type,
    pl.proof_status
  from projection.obligation_lifecycle pl
  where pl.obligation_code = 'payment_operationalization_required'
     or pl.source_event_type = 'payment_intent.succeeded'
),
normalized as (
  select
    lifecycle.obligation_id,
    lifecycle.workspace_id,
    case
      when lifecycle.obligation_code = 'payment_operationalization_required'
        then lifecycle.obligation_code
      when lifecycle.source_event_type = 'payment_intent.succeeded'
        then 'payment_operationalization_required'
      else lifecycle.obligation_code
    end as obligation_code,
    lifecycle.opened_at,
    lifecycle.source_event_id,
    lifecycle.source_system,
    lifecycle.source_event_key,
    lifecycle.source_event_type,
    lifecycle.source_event_created_at,
    lifecycle.receipt_id,
    lifecycle.resolution_type,
    lifecycle.proof_status,
    lifecycle.opened_at + interval '2 days' as at_risk_at,
    lifecycle.opened_at + interval '5 days' as breached_at
  from lifecycle
)
select
  obligation_id,
  workspace_id,
  obligation_code,
  opened_at,
  at_risk_at,
  breached_at,
  source_event_id,
  source_system,
  source_event_key,
  source_event_type,
  source_event_created_at,
  receipt_id,
  resolution_type,
  proof_status,
  case
    when receipt_id is not null then 'resolved'
    when now() >= breached_at then 'breached'
    when now() >= at_risk_at then 'at_risk'
    else 'open'
  end as watchdog_state
from normalized;
