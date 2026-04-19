with ingest as (
  select api.ingest_event_to_obligation(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'test_system',
    'neg-missing-proof-1',
    'service_commitment_created',
    '{"service":"founder_ops","promise":"deliver service commitment"}'::jsonb,
    now()
  ) as result
),
parsed as (
  select
    ((result -> 'obligation' ->> 'obligation_id'))::uuid as obligation_id
  from ingest
)
select api.resolve_obligation(
  (select obligation_id from parsed),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'resolve_with_proof',
  'negative verify missing proof',
  '{}'::jsonb,
  '[]'::jsonb,
  'v1',
  'neg-missing-proof-001'
);
