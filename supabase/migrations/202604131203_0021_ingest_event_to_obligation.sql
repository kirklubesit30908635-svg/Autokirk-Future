create or replace function api.ingest_event_to_obligation(
    p_workspace_id uuid,
    p_source_system text,
    p_source_event_key text,
    p_source_event_type text,
    p_payload jsonb,
    p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_source_event_id uuid;
    v_existing_source_event_id uuid;
    v_result jsonb;
begin
    select se.id
      into v_existing_source_event_id
      from ingest.source_events se
     where se.workspace_id = p_workspace_id
       and se.source_system = p_source_system
       and se.source_event_key = p_source_event_key;

    if v_existing_source_event_id is null then
        insert into ingest.source_events (
            workspace_id,
            source_system,
            source_event_key,
            source_event_type,
            payload,
            occurred_at
        )
        values (
            p_workspace_id,
            p_source_system,
            p_source_event_key,
            p_source_event_type,
            coalesce(p_payload, '{}'::jsonb),
            coalesce(p_occurred_at, now())
        )
        returning id into v_source_event_id;
    else
        v_source_event_id := v_existing_source_event_id;
    end if;

    v_result := kernel.open_obligation_internal(
        p_workspace_id => p_workspace_id,
        p_source_event_id => v_source_event_id
    );

    return jsonb_build_object(
        'source_event_id', v_source_event_id,
        'obligation', v_result
    );
end;
$$;
