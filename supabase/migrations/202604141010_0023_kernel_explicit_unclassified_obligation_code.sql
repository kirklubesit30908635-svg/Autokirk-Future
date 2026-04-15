create or replace function kernel.open_obligation_internal(
    p_workspace_id uuid,
    p_source_event_id uuid,
    p_source_system text,
    p_source_event_key text,
    p_source_event_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    return kernel.open_obligation_internal(
        p_workspace_id,
        p_source_event_id,
        p_source_system,
        p_source_event_key
    );
end;
$$;

create or replace function api.ingest_event_to_obligation(
    p_workspace_id uuid,
    p_actor_id uuid,
    p_source_system text,
    p_source_event_key text,
    p_source_event_type text,
    p_payload jsonb default '{}'::jsonb,
    p_occurred_at timestamptz default null
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
    if p_workspace_id is null then
        raise exception 'WORKSPACE_ID_REQUIRED';
    end if;

    if p_actor_id is null then
        raise exception 'ACTOR_ID_REQUIRED';
    end if;

    if nullif(btrim(coalesce(p_source_system, '')), '') is null then
        raise exception 'SOURCE_SYSTEM_REQUIRED';
    end if;

    if nullif(btrim(coalesce(p_source_event_key, '')), '') is null then
        raise exception 'SOURCE_EVENT_KEY_REQUIRED';
    end if;

    if nullif(btrim(coalesce(p_source_event_type, '')), '') is null then
        raise exception 'SOURCE_EVENT_TYPE_REQUIRED';
    end if;

    perform core.assert_member(p_workspace_id, p_actor_id);

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
            occurred_at,
            received_at,
            created_by
        )
        values (
            p_workspace_id,
            p_source_system,
            p_source_event_key,
            p_source_event_type,
            coalesce(p_payload, '{}'::jsonb),
            coalesce(p_occurred_at, now()),
            now(),
            p_actor_id
        )
        on conflict (workspace_id, source_system, source_event_key) do nothing
        returning id into v_source_event_id;

        if v_source_event_id is null then
            select se.id
              into v_source_event_id
              from ingest.source_events se
             where se.workspace_id = p_workspace_id
               and se.source_system = p_source_system
               and se.source_event_key = p_source_event_key;
        end if;
    else
        v_source_event_id := v_existing_source_event_id;
    end if;

    if v_source_event_id is null then
        raise exception 'SOURCE_EVENT_PERSIST_FAILED';
    end if;

    v_result := kernel.open_obligation_internal(
        p_workspace_id => p_workspace_id,
        p_source_event_id => v_source_event_id,
        p_source_system => p_source_system,
        p_source_event_key => p_source_event_key,
        p_source_event_type => p_source_event_type
    );

    return jsonb_build_object(
        'ok', true,
        'source_event_id', v_source_event_id,
        'obligation', v_result
    );
end;
$$;
