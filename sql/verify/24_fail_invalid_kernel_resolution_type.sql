with ingest as (
  select api.ingest_event_to_obligation(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'test_system',
    'neg-kernel-invalid-resolution-' || gen_random_uuid()::text,
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
select kernel.resolve_obligation_internal(
  (select obligation_id from parsed),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'not_a_real_resolution_type',
  'negative verify invalid kernel resolution type',
  '{"proof":true}'::jsonb,
  '[]'::jsonb,
  'v1',
  'sufficient',
  'neg-invalid-kernel-resolution-001'
);
