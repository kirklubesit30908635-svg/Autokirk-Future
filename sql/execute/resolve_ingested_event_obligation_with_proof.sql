with target as (
  select os.obligation_id
  from ingest.source_events se
  join core.obligation_sources os
    on os.source_event_id = se.id
  where se.source_system = 'test_system'
    and se.source_event_key = 'event-1'
)
select api.resolve_obligation(
  p_obligation_id := (select obligation_id from target),
  p_actor_id := '11111111-1111-1111-1111-111111111111'::uuid,
  p_resolution_type := 'resolve_with_proof',
  p_reason := 'resolved from ingested event',
  p_evidence_present := '{}'::jsonb,
  p_failed_checks := '[]'::jsonb,
  p_rule_version := 'v1',
  p_idempotency_key := 'ingested-event-1-proof'
);
