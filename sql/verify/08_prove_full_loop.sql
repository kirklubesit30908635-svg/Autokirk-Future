with ingest as (
  select api.ingest_event_to_obligation(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'test_system',
    'event-1',
    'service_commitment_created',
    '{"service":"founder_ops","promise":"deliver service commitment"}'::jsonb,
    now()
  ) as result
),
parsed as (
  select
    result as ingest_result,
    (result ->> 'source_event_id')::uuid as source_event_id,
    ((result -> 'obligation' ->> 'obligation_id'))::uuid as obligation_id
  from ingest
),
resolve as (
  select api.resolve_obligation(
    (select obligation_id from parsed),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'resolve_with_proof',
    'canonical verify path',
    '{"proof":true}'::jsonb,
    '[]'::jsonb,
    'v1',
    'manual-test-resolution-001'
  ) as resolve_result
)
select
  (select ingest_result from parsed) as ingest_result,
  (select obligation_id from parsed) as obligation_id,
  (select resolve_result from resolve) as resolve_result,
  (
    select o.entity_id::text
    from core.obligations o
    where o.id = (select obligation_id from parsed)
    limit 1
  ) as entity_id,
  (
    select r.entity_id::text
    from receipts.receipts r
    where r.obligation_id = (select obligation_id from parsed)
    order by r.emitted_at desc
    limit 1
  ) as receipt_entity_id;
