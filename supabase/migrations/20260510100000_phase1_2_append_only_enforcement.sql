begin;

-- ============================================================================
-- AutoKirk Phase 1.2 - Append-Only Enforcement
-- ----------------------------------------------------------------------------
-- Goal:
--   Seal historical immutability for governed truth surfaces by blocking
--   retroactive mutation and destructive deletion at the database layer.
--
-- Scope:
--   - Freeze historical ledger/event/receipt rows
--   - Block destructive deletion on governed obligations
--   - Restrict obligation rewrites to governed state advancement
--   - Keep migration-time bypass explicit through app.kernel_mode='migration'
-- ============================================================================

create schema if not exists kernel;

create or replace function kernel.block_mutation()
returns trigger
language plpgsql
as $$
begin
    if current_setting('app.kernel_mode', true) = 'migration' then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    raise exception
        'APPEND_ONLY_VIOLATION: %.% does not allow %',
        tg_table_schema,
        tg_table_name,
        tg_op;
end;
$$;

create or replace function kernel.block_delete()
returns trigger
language plpgsql
as $$
begin
    if current_setting('app.kernel_mode', true) = 'migration' then
        return old;
    end if;

    raise exception
        'DELETE_FORBIDDEN: %.% is append-only',
        tg_table_schema,
        tg_table_name;
end;
$$;

create or replace function kernel.enforce_obligation_immutability()
returns trigger
language plpgsql
as $$
begin
    if current_setting('app.kernel_mode', true) = 'migration' then
        return new;
    end if;

    if new.workspace_id is distinct from old.workspace_id then
        raise exception 'OBLIGATION_IMMUTABLE_FIELD: workspace_id';
    end if;

    if new.entity_id is distinct from old.entity_id then
        raise exception 'OBLIGATION_IMMUTABLE_FIELD: entity_id';
    end if;

    if new.created_at is distinct from old.created_at then
        raise exception 'OBLIGATION_IMMUTABLE_FIELD: created_at';
    end if;

    if new.obligation_code is distinct from old.obligation_code then
        raise exception 'OBLIGATION_IMMUTABLE_FIELD: obligation_code';
    end if;

    if new.truth_burden is distinct from old.truth_burden then
        raise exception 'OBLIGATION_IMMUTABLE_FIELD: truth_burden';
    end if;

    -- resolved lifecycle is terminal and cannot be rewritten.
    if old.status = 'resolved' then
        if new.status is distinct from old.status
           or new.resolution_type is distinct from old.resolution_type
           or new.resolution_reason is distinct from old.resolution_reason
           or new.proof_status is distinct from old.proof_status
           or new.resolved_at is distinct from old.resolved_at
           or new.due_at is distinct from old.due_at then
            raise exception 'OBLIGATION_TERMINAL_STATE_IMMUTABLE';
        end if;
    end if;

    if old.status is distinct from new.status then
        if old.status <> 'open' then
            raise exception 'OBLIGATION_STATUS_REWRITE_FORBIDDEN: % -> %', old.status, new.status;
        end if;

        if new.status <> 'resolved' then
            raise exception 'OBLIGATION_STATUS_ADVANCEMENT_FORBIDDEN: % -> %', old.status, new.status;
        end if;
    end if;

    if old.resolved_at is not null and new.resolved_at is distinct from old.resolved_at then
        raise exception 'OBLIGATION_RESOLVED_AT_REWRITE_FORBIDDEN';
    end if;

    if new.status = 'resolved' and new.resolved_at is null then
        raise exception 'OBLIGATION_RESOLVED_AT_REQUIRED_FOR_RESOLVED_STATUS';
    end if;

    if new.resolved_at is not null and new.status <> 'resolved' then
        raise exception 'OBLIGATION_RESOLVED_AT_ONLY_FOR_RESOLVED_STATUS';
    end if;

    return new;
end;
$$;

create or replace function kernel.enforce_chain_head_advancement()
returns trigger
language plpgsql
as $$
begin
    if current_setting('app.kernel_mode', true) = 'migration' then
        return new;
    end if;

    if new.workspace_id is distinct from old.workspace_id then
        raise exception 'CHAIN_HEAD_IMMUTABLE_FIELD: workspace_id';
    end if;

    if new.chain_key is distinct from old.chain_key then
        raise exception 'CHAIN_HEAD_IMMUTABLE_FIELD: chain_key';
    end if;

    if new.seq <> old.seq + 1 then
        raise exception 'CHAIN_HEAD_NON_MONOTONIC_ADVANCE_FORBIDDEN: % -> %', old.seq, new.seq;
    end if;

    if new.head_hash = old.head_hash then
        raise exception 'CHAIN_HEAD_HASH_REWRITE_FORBIDDEN';
    end if;

    if not ledger._is_sha256_hex(new.head_hash) then
        raise exception 'CHAIN_HEAD_HASH_INVALID';
    end if;

    if new.updated_at < old.updated_at then
        raise exception 'CHAIN_HEAD_UPDATED_AT_REWRITE_FORBIDDEN';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_block_mutation_events on ledger.events;
create trigger trg_block_mutation_events
before update or delete on ledger.events
for each row execute function kernel.block_mutation();

drop trigger if exists trg_block_mutation_receipts on receipts.receipts;
create trigger trg_block_mutation_receipts
before update or delete on receipts.receipts
for each row execute function kernel.block_mutation();

drop trigger if exists trg_enforce_chain_head_advancement on ledger.chain_heads;
create trigger trg_enforce_chain_head_advancement
before update on ledger.chain_heads
for each row execute function kernel.enforce_chain_head_advancement();

drop trigger if exists trg_block_delete_chain_heads on ledger.chain_heads;
create trigger trg_block_delete_chain_heads
before delete on ledger.chain_heads
for each row execute function kernel.block_delete();

drop trigger if exists trg_enforce_obligation_immutability on core.obligations;
create trigger trg_enforce_obligation_immutability
before update on core.obligations
for each row execute function kernel.enforce_obligation_immutability();

drop trigger if exists trg_block_delete_obligations on core.obligations;
create trigger trg_block_delete_obligations
before delete on core.obligations
for each row execute function kernel.block_delete();

revoke update, delete on table ledger.events from anon, authenticated, service_role;
revoke update, delete on table receipts.receipts from anon, authenticated, service_role;
revoke update, delete on table ledger.chain_heads from anon, authenticated, service_role;
revoke update, delete on table core.obligations from anon, authenticated, service_role;

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

    -- Serialize source-event to obligation linking so replay never needs cleanup
    -- deletes and remains deterministic under concurrency.
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
    );

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

commit;
