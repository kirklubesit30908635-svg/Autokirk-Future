create or replace function api.resolve_with_insufficient_proof(
    p_obligation_id uuid,
    p_actor_id uuid,
    p_reason text,
    p_evidence_present jsonb,
    p_failed_checks jsonb,
    p_rule_version text,
    p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_workspace_id uuid;
    v_status text;

    v_receipt_id uuid := gen_random_uuid();
    v_event_id uuid := gen_random_uuid();

    v_existing record;
begin
    -- =========================================================
    -- IDEMPOTENCY PRE-CHECK
    -- =========================================================
    select *
      into v_existing
      from ledger.idempotency_keys
     where idempotency_key = p_idempotency_key;

    if found then
        return jsonb_build_object(
            'ok', true,
            'event_id', v_existing.event_id,
            'obligation_id', v_existing.obligation_id,
            'receipt_id', v_existing.receipt_id,
            'replayed', true
        );
    end if;

    -- =========================================================
    -- LOAD OBLIGATION
    -- =========================================================
    select o.workspace_id, o.status
      into v_workspace_id, v_status
      from core.obligations o
     where o.id = p_obligation_id;

    if v_workspace_id is null then
        raise exception 'OBLIGATION_NOT_FOUND';
    end if;

    perform core.assert_member(v_workspace_id);

    -- =========================================================
    -- VALIDATION
    -- =========================================================
    if p_idempotency_key is null then
        raise exception 'IDEMPOTENCY_KEY_REQUIRED';
    end if;

    if p_reason is null or length(trim(p_reason)) = 0 then
        raise exception 'REASON_REQUIRED';
    end if;

    if p_evidence_present is null then
        raise exception 'EVIDENCE_REQUIRED';
    end if;

    if p_failed_checks is null then
        raise exception 'FAILED_CHECKS_REQUIRED';
    end if;

    if p_rule_version is null or length(trim(p_rule_version)) = 0 then
        raise exception 'RULE_VERSION_REQUIRED';
    end if;

    if v_status <> 'open' then
        raise exception 'OBLIGATION_NOT_OPEN';
    end if;

    -- =========================================================
    -- EVENT
    -- =========================================================
    insert into ledger.events (
        id,
        obligation_id,
        workspace_id,
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
        p_obligation_id,
        v_workspace_id,
        p_actor_id,
        'resolve_with_insufficient_proof',
        p_reason,
        p_evidence_present,
        p_failed_checks,
        p_rule_version,
        now()
    );

    -- =========================================================
    -- OBLIGATION UPDATE
    -- =========================================================
    update core.obligations
       set status = 'resolved',
           resolution_type = 'resolve_with_insufficient_proof',
           resolution_reason = p_reason,
           proof_status = 'insufficient',
           resolved_at = now()
     where id = p_obligation_id;

    -- =========================================================
    -- RECEIPT
    -- =========================================================
    insert into receipts.receipts (
        id,
        obligation_id,
        workspace_id,
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
        v_workspace_id,
        p_actor_id,
        'resolve_with_insufficient_proof',
        p_reason,
        p_evidence_present,
        p_failed_checks,
        'insufficient',
        p_rule_version,
        now()
    );

    -- =========================================================
    -- IDEMPOTENCY SEAL (CRITICAL)
    -- =========================================================
    insert into ledger.idempotency_keys (
        idempotency_key,
        obligation_id,
        resolution_type,
        event_id,
        receipt_id
    )
    values (
        p_idempotency_key,
        p_obligation_id,
        'resolve_with_insufficient_proof',
        v_event_id,
        v_receipt_id
    );

    -- =========================================================
    -- RETURN
    -- =========================================================
    return jsonb_build_object(
        'ok', true,
        'event_id', v_event_id,
        'obligation_id', p_obligation_id,
        'resolution_type', 'resolve_with_insufficient_proof',
        'proof_status', 'insufficient',
        'receipt_id', v_receipt_id,
        'rule_version', p_rule_version
    );
end;
$$;
