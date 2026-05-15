with k as (
  select
    gen_random_uuid()::text as source_key,
    gen_random_uuid()::text as idem_key
),
ing as (
  select api.ingest_event_to_obligation(
    p_workspace_id := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    p_actor_id := '11111111-1111-1111-1111-111111111111'::uuid,
    p_source_system := 'governed_completion_proof',
    p_source_event_key := (select source_key from k),
    p_source_event_type := 'service_commitment_created',
    p_payload := '{"claim":"execution_happened"}'::jsonb,
    p_occurred_at := now(),
    p_obligation_code := 'fulfill_promised_service'
  ) as ingest_result
),
parsed as (
  select
    (ingest_result ->> 'source_event_id')::uuid as source_event_id,
    (ingest_result ->> 'entity_id')::uuid as source_entity_id,
    ((ingest_result -> 'obligation' ->> 'obligation_id'))::uuid as obligation_id,
    ingest_result
  from ing
),
res as (
  select api.resolve_with_proof(
    p_obligation_id := (select obligation_id from parsed),
    p_actor_id := '11111111-1111-1111-1111-111111111111'::uuid,
    p_reason := 'governed completion proof: execution governed and completed without drift',
    p_evidence_present := '{"proof":true,"claim":"execution_happened","drift_check":"required"}'::jsonb,
    p_failed_checks := '[]'::jsonb,
    p_rule_version := 'governed-completion-v1',
    p_idempotency_key := ('governed-completion-' || (select idem_key from k))
  ) as resolve_result
),
resolved as (
  select
    (resolve_result ->> 'event_id')::uuid as event_id,
    (resolve_result ->> 'receipt_id')::uuid as receipt_id,
    resolve_result
  from res
),
facts as (
  select
    se.id as source_event_id,
    o.id as obligation_id,
    le.id as ledger_event_id,
    r.id as receipt_id,
    pl.lifecycle_state,
    se.entity_id as source_entity_id,
    o.entity_id as obligation_entity_id,
    r.entity_id as receipt_entity_id,
    pl.entity_id as lifecycle_entity_id,
    pl.receipt_entity_id as lifecycle_receipt_entity_id,
    o.status as obligation_status,
    o.proof_status as obligation_proof_status,
    le.obligation_id as ledger_obligation_id,
    r.obligation_id as receipt_obligation_id
  from parsed p
  join resolved x on true
  join ingest.source_events se on se.id = p.source_event_id
  join core.obligations o on o.id = p.obligation_id
  join ledger.events le on le.id = x.event_id
  join receipts.receipts r on r.id = x.receipt_id
  join projection.obligation_lifecycle pl on pl.obligation_id = p.obligation_id
)
select
  source_event_id is not null and ledger_event_id is not null as execution_happened,
  obligation_id is not null
    and obligation_status = 'resolved'
    and obligation_proof_status = 'sufficient' as was_governed,
  receipt_id is not null
    and receipt_obligation_id = obligation_id as receipt_produced,
  receipt_obligation_id = obligation_id
    and ledger_obligation_id = obligation_id
    and lifecycle_state = 'resolved'
    and source_entity_id = obligation_entity_id
    and receipt_entity_id = obligation_entity_id
    and lifecycle_entity_id = obligation_entity_id
    and lifecycle_receipt_entity_id = obligation_entity_id as completed_without_drift,
  case
    when source_event_id is not null
     and ledger_event_id is not null
     and obligation_id is not null
     and obligation_status = 'resolved'
     and obligation_proof_status = 'sufficient'
     and receipt_id is not null
     and receipt_obligation_id = obligation_id
     and ledger_obligation_id = obligation_id
     and lifecycle_state = 'resolved'
     and source_entity_id = obligation_entity_id
     and receipt_entity_id = obligation_entity_id
     and lifecycle_entity_id = obligation_entity_id
     and lifecycle_receipt_entity_id = obligation_entity_id
    then 'governed_completion_proven'
    else 'governed_completion_not_proven'
  end as claim
from facts;
