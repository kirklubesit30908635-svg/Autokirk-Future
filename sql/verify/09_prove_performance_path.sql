with ingest as (
  select api.ingest_event_to_obligation(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'stripe',
    'payment-1',
    'payment_intent.succeeded',
    '{"amount":100}'::jsonb,
    now()
  ) as result
),
parsed as (
  select
    result as ingest_result,
    ((result -> 'obligation' ->> 'obligation_id'))::uuid as obligation_id
  from ingest
),
resolve as (
  select api.resolve_obligation(
    (select obligation_id from parsed),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'resolve_with_proof',
    'payment confirmed',
    '{"payment_verified":true}'::jsonb,
    '[]'::jsonb,
    'v1',
    'payment-resolution-001'
  ) as resolve_result
)
select
  (select ingest_result from parsed) as ingest_result,
  (select obligation_id from parsed) as obligation_id,
  (select resolve_result from resolve) as resolve_result;
