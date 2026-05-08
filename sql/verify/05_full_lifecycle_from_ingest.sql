do $$
declare
  v_source_event_key text := 'verify-05-' || gen_random_uuid()::text;
  v_ingest_result jsonb;
  v_resolve_result jsonb;
  v_source_event_id uuid;
  v_obligation_id uuid;
  v_entity_id uuid;
  v_receipt_entity_id uuid;
  v_source_event_count integer;
  v_obligation_count integer;
  v_receipt_count integer;
begin
  select api.ingest_event_to_obligation(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'test_system',
    v_source_event_key,
    'service_commitment_created',
    '{"service":"verify","promise":"full lifecycle from ingest"}'::jsonb,
    now()
  )
  into v_ingest_result;

  v_source_event_id := (v_ingest_result ->> 'source_event_id')::uuid;
  v_obligation_id := ((v_ingest_result -> 'obligation' ->> 'obligation_id'))::uuid;

  if v_source_event_id is null then
    raise exception 'VERIFY_05_SOURCE_EVENT_ID_NULL';
  end if;

  if v_obligation_id is null then
    raise exception 'VERIFY_05_OBLIGATION_ID_NULL';
  end if;

  select api.resolve_obligation(
    v_obligation_id,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'resolve_with_proof',
    'verify full lifecycle from ingest',
    '{"proof":true}'::jsonb,
    '[]'::jsonb,
    'v1',
    'verify-05-resolution-' || v_obligation_id::text
  )
  into v_resolve_result;

  select count(*)::int
    into v_source_event_count
  from ingest.source_events se
  where se.id = v_source_event_id;

  select count(*)::int
    into v_obligation_count
  from core.obligations o
  where o.id = v_obligation_id;

  select o.entity_id
    into v_entity_id
  from core.obligations o
  where o.id = v_obligation_id;

  select count(*)::int
    into v_receipt_count
  from receipts.receipts r
  where r.obligation_id = v_obligation_id;

  select r.entity_id
    into v_receipt_entity_id
  from receipts.receipts r
  where r.obligation_id = v_obligation_id
  order by r.emitted_at desc
  limit 1;

  if v_source_event_count <> 1 then
    raise exception 'VERIFY_05_SOURCE_EVENT_COUNT_INVALID';
  end if;

  if v_obligation_count <> 1 then
    raise exception 'VERIFY_05_OBLIGATION_COUNT_INVALID';
  end if;

  if v_receipt_count <> 1 then
    raise exception 'VERIFY_05_RECEIPT_COUNT_INVALID';
  end if;

  if v_entity_id is null then
    raise exception 'VERIFY_05_OBLIGATION_ENTITY_ID_NULL';
  end if;

  if v_receipt_entity_id is distinct from v_entity_id then
    raise exception 'VERIFY_05_RECEIPT_ENTITY_MISMATCH';
  end if;

  if (v_resolve_result ->> 'receipt_id') is null then
    raise exception 'VERIFY_05_RESOLVE_RESULT_MISSING_RECEIPT_ID';
  end if;
end
$$;
