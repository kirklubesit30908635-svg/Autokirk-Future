-- hard reset test context
do table
declare
  v_workspace_id uuid := gen_random_uuid();
  v_actor_id uuid := gen_random_uuid();
  v_result jsonb;
  v_obligation_id uuid;
begin
  -- create workspace + actor binding
  insert into core.legal_entities (id, entity_name, entity_type)
  values (v_workspace_id, 'test-workspace-entity', 'workspace');

  insert into core.workspaces (id, name, entity_id)
  values (v_workspace_id, 'test-workspace', v_workspace_id);

  insert into core.workspace_members (workspace_id, actor_id)
  values (v_workspace_id, v_actor_id);

  -- INGEST → obligation
  select api.ingest_event_to_obligation(
    v_workspace_id,
    v_actor_id,
    'test_system',
    'event_1',
    'test_event',
    '{}'::jsonb,
    now()
  )
  into v_result;

  v_obligation_id := (v_result->'obligation'->>'obligation_id')::uuid;

  -- RESOLVE → receipt
  perform api.resolve_obligation(
    v_obligation_id,
    v_actor_id,
    'resolve_with_proof',
    '{"proof":"ok"}'::jsonb
  );
end table;

-- VERIFY COUNTS
select
  (select count(*) from ingest.source_events) as source_event_count,
  (select count(*) from core.obligations) as obligation_count,
  (select count(*) from receipts.receipts) as receipt_count;
