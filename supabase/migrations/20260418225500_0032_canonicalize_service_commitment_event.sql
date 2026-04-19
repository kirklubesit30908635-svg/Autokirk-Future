begin;

update ingest.source_events
set source_event_type = 'service_commitment_created'
where source_event_type = 'payment_operationalization_required';

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
as $function$
declare
    v_existing_obligation_id uuid;
    v_obligation_id uuid;
    v_truth_burden text;
    v_obligation_code text;
begin
    if p_workspace_id is null then
        raise exception 'WORKSPACE_ID_REQUIRED';
    end if;

    if p_source_event_id is null then
        raise exception 'SOURCE_EVENT_ID_REQUIRED';
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

    select os.obligation_id
      into v_existing_obligation_id
      from core.obligation_sources os
     where os.source_event_id = p_source_event_id;

    if v_existing_obligation_id is not null then
        return jsonb_build_object(
            'ok', true,
            'replayed', true,
            'obligation_id', v_existing_obligation_id,
            'source_event_id', p_source_event_id
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
        end;

    insert into core.obligations (
        workspace_id,
        status,
        proof_status,
        obligation_code,
        truth_burden
    )
    values (
        p_workspace_id,
        'open',
        'pending',
        v_obligation_code,
        v_truth_burden
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
    )
    on conflict (source_event_id) do nothing;

    select os.obligation_id
      into v_existing_obligation_id
      from core.obligation_sources os
     where os.source_event_id = p_source_event_id;

    if v_existing_obligation_id <> v_obligation_id then
        delete from core.obligations
         where id = v_obligation_id;

        return jsonb_build_object(
            'ok', true,
            'replayed', true,
            'obligation_id', v_existing_obligation_id,
            'source_event_id', p_source_event_id
        );
    end if;

    return jsonb_build_object(
        'ok', true,
        'replayed', false,
        'obligation_id', v_obligation_id,
        'source_event_id', p_source_event_id,
        'obligation_code', v_obligation_code,
        'truth_burden', v_truth_burden
    );
end;
$function$;

commit;
