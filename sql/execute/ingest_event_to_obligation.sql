select api.ingest_event_to_obligation(
  p_workspace_id := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  p_actor_id := '11111111-1111-1111-1111-111111111111'::uuid,
  p_source_system := 'test_system',
  p_source_event_key := 'event-1',
  p_source_event_type := 'test_event',
  p_payload := '{}'::jsonb,
  p_occurred_at := now()
);
