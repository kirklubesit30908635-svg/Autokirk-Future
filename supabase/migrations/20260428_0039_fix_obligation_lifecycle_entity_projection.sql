begin;

alter table core.obligations
  alter column entity_id set not null;

alter table ingest.source_events
  alter column entity_id set not null,
  alter column source_event_key set not null,
  alter column source_system set not null,
  alter column source_event_type set not null;

alter table receipts.receipts
  alter column entity_id set not null,
  alter column proof_status set not null;

create or replace view projection.obligation_lifecycle as
select
  o.id as obligation_id,
  o.entity_id,
  o.obligation_code,
  o.workspace_id,
  o.created_at as obligation_created_at,
  os.source_event_id,
  se.source_system,
  se.source_event_key,
  se.source_event_type,
  se.created_at as source_event_created_at,
  r.id as receipt_id,
  r.entity_id as receipt_entity_id,
  r.resolution_type,
  r.proof_status,
  r.emitted_at as receipt_emitted_at,
  o.truth_burden,
  o.due_at,
  case
    when r.id is null
      and o.due_at is not null
      and o.due_at < now() then 'failed'
    when r.id is null then 'open'
    when r.proof_status = 'sufficient' then 'resolved'
    when r.proof_status = any (array['insufficient','rejected']) then 'failed'
    else 'unknown'
  end as lifecycle_state
from core.obligation_sources os
join core.obligations o
  on o.id = os.obligation_id
left join ingest.source_events se
  on se.id = os.source_event_id
left join receipts.receipts r
  on r.obligation_id = o.id;

commit;
