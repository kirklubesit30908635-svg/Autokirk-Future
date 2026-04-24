begin;

create table if not exists core.legal_entities (
    id uuid primary key default gen_random_uuid(),
    entity_name text not null unique,
    entity_type text not null,
    created_at timestamptz not null default now()
);

alter table core.workspaces
add column if not exists entity_id uuid;

alter table ingest.source_events
add column if not exists entity_id uuid;

alter table core.obligations
add column if not exists entity_id uuid;

alter table receipts.receipts
add column if not exists entity_id uuid;

insert into core.legal_entities (id, entity_name, entity_type)
select
    w.id,
    'workspace:' || w.id::text,
    'workspace'
from core.workspaces w
left join core.legal_entities le
  on le.id = w.id
where le.id is null;

update core.workspaces
set entity_id = id
where entity_id is null;

update ingest.source_events se
set entity_id = w.entity_id
from core.workspaces w
where w.id = se.workspace_id
  and se.entity_id is distinct from w.entity_id;

update core.obligations o
set entity_id = x.entity_id
from (
    select
        o2.id as obligation_id,
        coalesce(se.entity_id, w.entity_id) as entity_id
    from core.obligations o2
    left join core.obligation_sources os
      on os.obligation_id = o2.id
    left join ingest.source_events se
      on se.id = os.source_event_id
    left join core.workspaces w
      on w.id = o2.workspace_id
) x
where x.obligation_id = o.id
  and o.entity_id is distinct from x.entity_id;

update receipts.receipts r
set entity_id = o.entity_id
from core.obligations o
where o.id = r.obligation_id
  and r.entity_id is distinct from o.entity_id;

do $$
begin
    if exists (select 1 from core.workspaces where entity_id is null) then
        raise exception 'WORKSPACE_ENTITY_BACKFILL_FAILED';
    end if;

    if exists (select 1 from ingest.source_events where entity_id is null) then
        raise exception 'SOURCE_EVENT_ENTITY_BACKFILL_FAILED';
    end if;

    if exists (select 1 from core.obligations where entity_id is null) then
        raise exception 'OBLIGATION_ENTITY_BACKFILL_FAILED';
    end if;

    if exists (select 1 from receipts.receipts where entity_id is null) then
        raise exception 'RECEIPT_ENTITY_BACKFILL_FAILED';
    end if;
end
$$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'workspaces_entity_fk'
          and conrelid = 'core.workspaces'::regclass
    ) then
        alter table core.workspaces
            add constraint workspaces_entity_fk
            foreign key (entity_id) references core.legal_entities(id);
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'source_events_entity_fk'
          and conrelid = 'ingest.source_events'::regclass
    ) then
        alter table ingest.source_events
            add constraint source_events_entity_fk
            foreign key (entity_id) references core.legal_entities(id);
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'obligations_entity_fk'
          and conrelid = 'core.obligations'::regclass
    ) then
        alter table core.obligations
            add constraint obligations_entity_fk
            foreign key (entity_id) references core.legal_entities(id);
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'receipts_entity_fk'
          and conrelid = 'receipts.receipts'::regclass
    ) then
        alter table receipts.receipts
            add constraint receipts_entity_fk
            foreign key (entity_id) references core.legal_entities(id);
    end if;
end
$$;

alter table core.workspaces
alter column entity_id set not null;

alter table ingest.source_events
alter column entity_id set not null;

alter table core.obligations
alter column entity_id set not null;

alter table receipts.receipts
alter column entity_id set not null;

create index if not exists idx_workspaces_entity_id
    on core.workspaces(entity_id);

create index if not exists idx_source_events_entity_id
    on ingest.source_events(entity_id);

create index if not exists idx_obligations_entity_id
    on core.obligations(entity_id);

create index if not exists idx_receipts_entity_id
    on receipts.receipts(entity_id);

drop function if exists kernel.open_obligation_internal(uuid, uuid, text, text, text);
drop function if exists kernel.open_obligation_internal(uuid, uuid, text, text, text, uuid);
drop function if exists api.ingest_event_to_obligation(uuid, uuid, text, text, text, jsonb, timestamptz);

create or replace function kernel.open_obligation_internal(
    p_workspace_id uuid,
    p_source_event_id uuid,
    p_source_system text,
    p_source_event_key text,
    p_source_event_type text,
    p_entity_id uuid,
    p_obligation_code text default null
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
        truth_burden
    )
    values (
        p_workspace_id,
        p_entity_id,
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
            'source_event_id', p_source_event_id,
            'entity_id', p_entity_id
        );
    end if;

    return jsonb_build_object(
        'ok', true,
        'replayed', false,
        'obligation_id', v_obligation_id,
        'source_event_id', p_source_event_id,
        'obligation_code', v_obligation_code,
        'truth_burden', v_truth_burden,
        'entity_id', p_entity_id
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
    p_obligation_code text default null
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
        p_obligation_code => v_explicit_obligation_code
    );

    return jsonb_build_object(
        'ok', true,
        'source_event_id', v_source_event_id,
        'entity_id', v_entity_id,
        'obligation', v_result
    );
end;
$function$;

create or replace function kernel.resolve_obligation_internal(
    p_obligation_id uuid,
    p_actor_id uuid,
    p_resolution_type text,
    p_reason text,
    p_evidence_present jsonb,
    p_failed_checks jsonb,
    p_rule_version text,
    p_proof_status text,
    p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
    v_obligation core.obligations%rowtype;
    v_existing_key ledger.idempotency_keys%rowtype;
    v_event_id uuid := gen_random_uuid();
    v_receipt_id uuid := gen_random_uuid();
    v_now timestamptz := now();
    v_input_hash text;
begin
    if p_obligation_id is null then
        raise exception 'OBLIGATION_ID_REQUIRED';
    end if;

    if p_actor_id is null then
        raise exception 'ACTOR_ID_REQUIRED';
    end if;

    if nullif(btrim(coalesce(p_resolution_type, '')), '') is null then
        raise exception 'RESOLUTION_TYPE_REQUIRED';
    end if;

    if nullif(btrim(coalesce(p_idempotency_key, '')), '') is null then
        raise exception 'IDEMPOTENCY_KEY_REQUIRED';
    end if;

    if p_resolution_type = 'resolve_with_proof'
       and (
            p_evidence_present is null
            or p_evidence_present = '{}'::jsonb
            or p_evidence_present = '[]'::jsonb
       ) then
        raise exception 'PROOF_REQUIRED';
    end if;

    select *
      into v_obligation
      from core.obligations
     where id = p_obligation_id
     for update;

    if not found then
        raise exception 'OBLIGATION_NOT_FOUND';
    end if;

    if v_obligation.entity_id is null then
        raise exception 'OBLIGATION_ENTITY_ID_REQUIRED';
    end if;

    perform core.assert_member(v_obligation.workspace_id, p_actor_id);

    v_input_hash := encode(
        extensions.digest(
            convert_to(
                coalesce(p_resolution_type, '') ||
                coalesce(p_reason, '') ||
                coalesce(p_evidence_present::text, '') ||
                coalesce(p_failed_checks::text, '') ||
                coalesce(p_rule_version, '') ||
                coalesce(p_proof_status, ''),
                'UTF8'
            ),
            'sha256'
        ),
        'hex'
    );

    select *
      into v_existing_key
      from ledger.idempotency_keys
     where idempotency_key = p_idempotency_key
     for update;

    if found then
        if v_existing_key.obligation_id <> p_obligation_id then
            raise exception 'IDEMPOTENCY_KEY_REUSED_FOR_DIFFERENT_OBLIGATION';
        end if;

        if v_existing_key.input_hash <> v_input_hash then
            raise exception 'IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_INPUT';
        end if;

        return jsonb_build_object(
            'ok', true,
            'replayed', true,
            'obligation_id', v_existing_key.obligation_id,
            'event_id', v_existing_key.event_id,
            'receipt_id', v_existing_key.receipt_id,
            'entity_id', v_obligation.entity_id
        );
    end if;

    if v_obligation.status <> 'open' then
        raise exception 'OBLIGATION_NOT_OPEN';
    end if;

    insert into ledger.events (
        id,
        workspace_id,
        obligation_id,
        actor_id,
        event_type,
        reason,
        evidence_present,
        failed_checks,
        rule_version,
        emitted_at
    )
    values (
        v_event_id,
        v_obligation.workspace_id,
        p_obligation_id,
        p_actor_id,
        'obligation_resolved',
        p_reason,
        coalesce(p_evidence_present, '{}'::jsonb),
        coalesce(p_failed_checks, '[]'::jsonb),
        p_rule_version,
        v_now
    );

    update core.obligations
    set
        status = 'resolved',
        resolution_type = p_resolution_type,
        resolution_reason = p_reason,
        proof_status = p_proof_status,
        resolved_at = v_now
    where id = p_obligation_id;

    insert into receipts.receipts (
        id,
        obligation_id,
        workspace_id,
        entity_id,
        actor_id,
        resolution_type,
        reason,
        evidence_present,
        failed_checks,
        proof_status,
        rule_version,
        emitted_at
    )
    values (
        v_receipt_id,
        p_obligation_id,
        v_obligation.workspace_id,
        v_obligation.entity_id,
        p_actor_id,
        p_resolution_type,
        p_reason,
        coalesce(p_evidence_present, '{}'::jsonb),
        coalesce(p_failed_checks, '[]'::jsonb),
        p_proof_status,
        p_rule_version,
        v_now
    );

    insert into ledger.idempotency_keys (
        id,
        idempotency_key,
        obligation_id,
        resolution_type,
        event_id,
        receipt_id,
        created_at,
        input_hash
    )
    values (
        gen_random_uuid(),
        p_idempotency_key,
        p_obligation_id,
        p_resolution_type,
        v_event_id,
        v_receipt_id,
        v_now,
        v_input_hash
    );

    return jsonb_build_object(
        'ok', true,
        'replayed', false,
        'obligation_id', p_obligation_id,
        'event_id', v_event_id,
        'receipt_id', v_receipt_id,
        'entity_id', v_obligation.entity_id
    );
end;
$function$;

drop view if exists public.overdue_failure_emission_candidates;
drop view if exists public.overdue_failure_watchdog;
drop view if exists projection.payment_operationalization_watchdog;
drop view if exists projection.obligation_lifecycle;

create view projection.obligation_lifecycle as
select
  o.id as obligation_id,
  o.entity_id,
  o.obligation_code,
  o.workspace_id,
  o.created_at as obligation_created_at,
  os.source_event_id,
  se.source_system,
  se.source_event_key,
  se.source_event_type,
  se.created_at as source_event_created_at,
  r.id as receipt_id,
  r.entity_id as receipt_entity_id,
  r.resolution_type,
  r.proof_status,
  r.emitted_at as receipt_emitted_at,
  o.truth_burden,
  o.due_at,
  case
    when r.id is null
      and o.due_at is not null
      and o.due_at < now() then 'failed'
    when r.id is null then 'open'
    when r.proof_status = 'sufficient' then 'resolved'
    when r.proof_status = any (array['insufficient','rejected']) then 'failed'
    else 'unknown'
  end as lifecycle_state
from core.obligation_sources os
join core.obligations o
  on o.id = os.obligation_id
left join ingest.source_events se
  on se.id = os.source_event_id
left join receipts.receipts r
  on r.obligation_id = o.id;

create view projection.payment_operationalization_watchdog as
with lifecycle as (
  select
    pl.obligation_id,
    pl.entity_id,
    pl.workspace_id,
    pl.obligation_code,
    pl.obligation_created_at as opened_at,
    pl.source_event_id,
    pl.source_system,
    pl.source_event_key,
    pl.source_event_type,
    pl.source_event_created_at,
    pl.receipt_id,
    pl.receipt_entity_id,
    pl.resolution_type,
    pl.proof_status
  from projection.obligation_lifecycle pl
  where pl.obligation_code = 'payment_operationalization_required'
     or pl.source_event_type = 'payment_intent.succeeded'
),
normalized as (
  select
    lifecycle.obligation_id,
    lifecycle.entity_id,
    lifecycle.workspace_id,
    case
      when lifecycle.obligation_code = 'payment_operationalization_required'
        then lifecycle.obligation_code
      when lifecycle.source_event_type = 'payment_intent.succeeded'
        then 'payment_operationalization_required'
      else lifecycle.obligation_code
    end as obligation_code,
    lifecycle.opened_at,
    lifecycle.source_event_id,
    lifecycle.source_system,
    lifecycle.source_event_key,
    lifecycle.source_event_type,
    lifecycle.source_event_created_at,
    lifecycle.receipt_id,
    lifecycle.receipt_entity_id,
    lifecycle.resolution_type,
    lifecycle.proof_status,
    lifecycle.opened_at + interval '2 days' as at_risk_at,
    lifecycle.opened_at + interval '5 days' as breached_at
  from lifecycle
)
select
  obligation_id,
  entity_id,
  workspace_id,
  obligation_code,
  opened_at,
  at_risk_at,
  breached_at,
  source_event_id,
  source_system,
  source_event_key,
  source_event_type,
  source_event_created_at,
  receipt_id,
  receipt_entity_id,
  resolution_type,
  proof_status,
  case
    when receipt_id is not null then 'resolved'
    when now() >= breached_at then 'breached'
    when now() >= at_risk_at then 'at_risk'
    else 'open'
  end as watchdog_state
from normalized;

create view public.overdue_failure_watchdog
with (security_invoker = true) as
select
  obligation_id,
  entity_id,
  obligation_code,
  workspace_id,
  obligation_created_at,
  source_event_id,
  source_system,
  source_event_key,
  source_event_type,
  source_event_created_at,
  receipt_id,
  receipt_entity_id,
  resolution_type,
  proof_status,
  receipt_emitted_at,
  truth_burden,
  due_at,
  lifecycle_state
from projection.obligation_lifecycle
where lifecycle_state = 'failed'
  and receipt_id is null;

create view public.overdue_failure_emission_candidates
with (security_invoker = true) as
select
  obligation_id,
  entity_id,
  obligation_code,
  workspace_id,
  obligation_created_at,
  source_event_id,
  source_system,
  source_event_key,
  source_event_type,
  source_event_created_at,
  receipt_id,
  receipt_entity_id,
  resolution_type,
  proof_status,
  receipt_emitted_at,
  truth_burden,
  due_at,
  lifecycle_state
from projection.obligation_lifecycle
where lifecycle_state = 'failed'
  and receipt_id is null;

commit;
