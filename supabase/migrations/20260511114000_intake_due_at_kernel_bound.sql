begin;

-- AutoKirk intake due-date binding
--
-- Doctrine boundary:
-- - UI/API may describe the due date.
-- - Durable obligation truth is still created only by the canonical ingest -> kernel open path.
-- - No route, component, or helper directly writes core.obligations.

create or replace function kernel.open_obligation_internal(
    p_workspace_id uuid,
    p_source_event_id uuid,
    p_source_system text,
    p_source_event_key text,
    p_source_event_type text,
    p_entity_id uuid,
    p_obligation_code text default null,
    p_due_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
    v_existing_obligation_id uuid;
    v_obligation_id uuid;
    v_truth_burden text;
    v_explicit_obligation_code text;
    v_obligation_code text;
begin
    if p_workspace_id is null then
        raise exception 'WORKSPACE_ID_REQUIRED';
    end if;

    if p_source_event_id is null then
        raise exception 'SOURCE_EVENT_ID_REQUIRED';
    end if;

    if p_entity_id is null then
        raise exception 'ENTITY_ID_REQUIRED';
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

    v_explicit_obligation_code :=
        nullif(btrim(coalesce(p_obligation_code, '')), '');

    if p_source_system = 'intake'
       and v_explicit_obligation_code is null then
        raise exception 'OBLIGATION_CODE_REQUIRED';
    end if;

    if v_explicit_obligation_code = 'unclassified' then
        raise exception 'OBLIGATION_CODE_UNCLASSIFIED_NOT_ALLOWED';
    end if;

    if exists (
        select 1
        from ingest.source_events se
        where se.id = p_source_event_id
          and se.entity_id is distinct from p_entity_id
    ) then
        raise exception 'SOURCE_EVENT_ENTITY_ID_MISMATCH';
    end if;

    perform pg_advisory_xact_lock(
        hashtextextended('core.obligation_sources:' || p_source_event_id::text, 0)
    );

    select os.obligation_id
      into v_existing_obligation_id
      from core.obligation_sources os
     where os.source_event_id = p_source_event_id;

    if v_existing_obligation_id is not null then
        return jsonb_build_object(
            'ok', true,
            'replayed', true,
            'obligation_id', v_existing_obligation_id,
            'source_event_id', p_source_event_id,
            'entity_id', p_entity_id
        );
    end if;

    v_truth_burden :=
        case
            when p_source_system = 'stripe'
             and p_source_event_type in (
                'invoice.paid',
                'charge.succeeded',
                'payment_intent.succeeded'
             )
                then 'performance'
            else 'promise'
        end;

    v_obligation_code :=
        coalesce(
            v_explicit_obligation_code,
            case
                when p_source_event_type = 'service_commitment_created'
                    then 'fulfill_promised_service'
                when p_source_system = 'stripe'
                 and p_source_event_type = 'invoice.upcoming'
                    then 'subscription_upcoming'
                when p_source_system = 'stripe'
                 and p_source_event_type = 'payment_intent.succeeded'
                    then 'payment_succeeded'
                else 'unclassified'
            end
        );

    insert into core.obligations (
        workspace_id,
        entity_id,
        status,
        proof_status,
        obligation_code,
        truth_burden,
        due_at
    )
    values (
        p_workspace_id,
        p_entity_id,
        'open',
        'pending',
        v_obligation_code,
        v_truth_burden,
        p_due_at
    )
    returning id into v_obligation_id;

    insert into core.obligation_sources (
        obligation_id,
        source_event_id,
        workspace_id,
        source_system,
        source_event_key
    )
    values (
        v_obligation_id,
        p_source_event_id,
        p_workspace_id,
        p_source_system,
        p_source_event_key
    );

    return jsonb_build_object(
        'ok', true,
        'replayed', false,
        'obligation_id', v_obligation_id,
        'source_event_id', p_source_event_id,
        'obligation_code', v_obligation_code,
        'truth_burden', v_truth_burden,
        'entity_id', p_entity_id,
        'due_at', p_due_at
    );
end;
$function$;

create or replace function api.ingest_event_to_obligation(
    p_workspace_id uuid,
    p_actor_id uuid,
    p_source_system text,
    p_source_event_key text,
    p_source_event_type text,
    p_payload jsonb default '{}'::jsonb,
    p_occurred_at timestamptz default null,
    p_obligation_code text default null,
    p_due_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
    v_source_event_id uuid;
    v_existing_source_event_id uuid;
    v_entity_id uuid;
    v_explicit_obligation_code text;
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

    v_explicit_obligation_code :=
        nullif(btrim(coalesce(p_obligation_code, '')), '');

    perform core.assert_member(p_workspace_id, p_actor_id);

    select w.entity_id
      into v_entity_id
      from core.workspaces w
     where w.id = p_workspace_id;

    if v_entity_id is null then
        raise exception 'WORKSPACE_ENTITY_ID_REQUIRED';
    end if;

    select se.id
      into v_existing_source_event_id
      from ingest.source_events se
     where se.workspace_id = p_workspace_id
       and se.source_system = p_source_system
       and se.source_event_key = p_source_event_key;

    if v_existing_source_event_id is null then
        insert into ingest.source_events (
            workspace_id,
            entity_id,
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
            v_entity_id,
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

    if exists (
        select 1
        from ingest.source_events se
        where se.id = v_source_event_id
          and se.entity_id is distinct from v_entity_id
    ) then
        raise exception 'ENTITY_ID_CONFLICT_FOR_SOURCE_EVENT';
    end if;

    update ingest.source_events
       set entity_id = v_entity_id
     where id = v_source_event_id
       and entity_id is distinct from v_entity_id;

    v_result := kernel.open_obligation_internal(
        p_workspace_id => p_workspace_id,
        p_source_event_id => v_source_event_id,
        p_source_system => p_source_system,
        p_source_event_key => p_source_event_key,
        p_source_event_type => p_source_event_type,
        p_entity_id => v_entity_id,
        p_obligation_code => v_explicit_obligation_code,
        p_due_at => p_due_at
    );

    return jsonb_build_object(
        'ok', true,
        'source_event_id', v_source_event_id,
        'entity_id', v_entity_id,
        'obligation', v_result
    );
end;
$function$;

commit;
