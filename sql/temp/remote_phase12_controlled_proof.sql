with k as (
  select
    gen_random_uuid()::text as source_key,
    gen_random_uuid()::text as idem_key
),
ing as (
  select api.ingest_event_to_obligation(
    p_workspace_id   := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    p_actor_id       := '11111111-1111-1111-1111-111111111111'::uuid,
    p_source_system  := 'remote_phase12',
    p_source_event_key := (select source_key from k),
    p_source_event_type := 'service_commitment_created',
    p_payload        := '{"scope":"remote_phase_1_2_seal"}'::jsonb,
    p_occurred_at    := now(),
    p_obligation_code := 'fulfill_promised_service'
  ) as ingest_result
),
parsed as (
  select
    ((ingest_result -> 'obligation' ->> 'obligation_id'))::uuid as obligation_id,
    ingest_result
  from ing
),
res as (
  select api.resolve_with_proof(
    p_obligation_id    := (select obligation_id from parsed),
    p_actor_id         := '11111111-1111-1111-1111-111111111111'::uuid,
    p_reason           := 'remote phase 1.2 controlled proof',
    p_evidence_present := '{"proof":true,"surface":"remote"}'::jsonb,
    p_failed_checks    := '[]'::jsonb,
    p_rule_version     := 'v1',
    p_idempotency_key  := ('remote-phase1-2-' || (select idem_key from k))
  ) as resolve_result
)
select
  (select ingest_result from parsed) as ingest_result,
  (select obligation_id from parsed) as obligation_id,
  (select resolve_result from res) as resolve_result;
