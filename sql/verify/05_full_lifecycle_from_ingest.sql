with source_match as (
  select se.id, se.source_system, se.source_event_key
  from ingest.source_events se
  where se.source_system = 'test_system'
    and se.source_event_key = 'event-1'
),
obligation_source_match as (
  select os.obligation_id
  from core.obligation_sources os
  where os.source_system = 'test_system'
    and os.source_event_key = 'event-1'
),
obligation_match as (
  select o.id, o.status, o.obligation_code, o.truth_burden
  from core.obligations o
  join obligation_source_match os
    on os.obligation_id = o.id
),
receipt_match as (
  select r.id, r.obligation_id
  from receipts.receipts r
  join obligation_source_match os
    on os.obligation_id = r.obligation_id
)
select
  (select count(*) from source_match) as source_event_count,
  (select count(*) from obligation_source_match) as obligation_source_count,
  (select count(*) from obligation_match) as obligation_count,
  (select count(*) from receipt_match) as receipt_count,
  (select count(*) = 1 from source_match) as source_event_ok,
  (select count(*) = 1 from obligation_source_match) as obligation_source_ok,
  (select count(*) = 1 from obligation_match) as obligation_ok,
  (select count(*) = 1 from receipt_match) as receipt_ok,
  (select bool_or(status in ('resolved', 'closed', 'rejected')) from obligation_match) as terminal_status_ok,
  (select min(id::text) from obligation_match) as obligation_id,
  (select min(id::text) from receipt_match) as receipt_id,
  (select min(obligation_code) from obligation_match) as obligation_code,
<<<<<<< Updated upstream
  (select min(truth_burden) from obligation_match) as truth_burden;
=======
  (select min(truth_burden) from obligation_match) as truth_burden;
>>>>>>> Stashed changes
