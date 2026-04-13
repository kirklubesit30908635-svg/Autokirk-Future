select api.ingest_event_to_obligation(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'test_harness',
  'evt_001',
  'payment_captured',
  '{"amount":100,"currency":"USD"}'::jsonb,
  now()
);
