create or replace function kernel.open_obligation_internal(
    p_workspace_id uuid,
    p_source_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_existing_obligation_id uuid;
    v_obligation_id uuid;
begin
    select os.obligation_id
      into v_existing_obligation_id
      from core.obligation_sources os
     where os.source_event_id = p_source_event_id;

    if v_existing_obligation_id is not null then
        return jsonb_build_object(
            'replayed', true,
            'obligation_id', v_existing_obligation_id,
            'source_event_id', p_source_event_id
        );
    end if;

    insert into core.obligations (
        workspace_id,
        status,
        proof_status
    )
    values (
        p_workspace_id,
        'open',
        'pending'
    )
    returning id into v_obligation_id;

    insert into core.obligation_sources (
        obligation_id,
        source_event_id
    )
    values (
        v_obligation_id,
        p_source_event_id
    );

    return jsonb_build_object(
        'replayed', false,
        'obligation_id', v_obligation_id,
        'source_event_id', p_source_event_id
    );
end;
$$;
