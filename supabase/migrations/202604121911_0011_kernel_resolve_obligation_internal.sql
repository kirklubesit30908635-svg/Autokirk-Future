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
as $$
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

    select *
    into v_obligation
    from core.obligations
    where id = p_obligation_id
    for update;

    if not found then
        raise exception 'OBLIGATION_NOT_FOUND';
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
            'input_hash', v_existing_key.input_hash
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
        payload,
        emitted_at
    )
    values (
        v_event_id,
        v_obligation.workspace_id,
        p_obligation_id,
        p_actor_id,
        'obligation_resolved',
        jsonb_build_object(
            'resolution_type', p_resolution_type,
            'reason', p_reason,
            'evidence_present', coalesce(p_evidence_present, '{}'::jsonb),
            'failed_checks', coalesce(p_failed_checks, '[]'::jsonb),
            'rule_version', p_rule_version,
            'proof_status', p_proof_status
        ),
        v_now
    );

    update core.obligations
    set
        status = 'resolved',
        resolution_type = p_resolution_type,
        resolution_reason = p_reason,
        proof_status = p_proof_status,
        resolved_at = v_now,
        updated_at = v_now
    where id = p_obligation_id;

    insert into receipts.receipts (
        id,
        workspace_id,
        obligation_id,
        event_id,
        receipt_type,
        payload,
        emitted_at
    )
    values (
        v_receipt_id,
        v_obligation.workspace_id,
        p_obligation_id,
        v_event_id,
        'obligation_resolution_receipt',
        jsonb_build_object(
            'obligation_id', p_obligation_id,
            'actor_id', p_actor_id,
            'resolution_type', p_resolution_type,
            'reason', p_reason,
            'evidence_present', coalesce(p_evidence_present, '{}'::jsonb),
            'failed_checks', coalesce(p_failed_checks, '[]'::jsonb),
            'rule_version', p_rule_version,
            'proof_status', p_proof_status,
            'resolved_at', v_now
        ),
        v_now
    );

    insert into ledger.idempotency_keys (
        idempotency_key,
        workspace_id,
        obligation_id,
        event_id,
        receipt_id,
        input_hash,
        created_at
    )
    values (
        p_idempotency_key,
        v_obligation.workspace_id,
        p_obligation_id,
        v_event_id,
        v_receipt_id,
        v_input_hash,
        v_now
    );

    return jsonb_build_object(
        'ok', true,
        'replayed', false,
        'obligation_id', p_obligation_id,
        'event_id', v_event_id,
        'receipt_id', v_receipt_id,
        'input_hash', v_input_hash
    );
end;
$$;
