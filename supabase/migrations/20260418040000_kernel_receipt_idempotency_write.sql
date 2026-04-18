-- re-create kernel resolve function with idempotency_key in receipt insert

create or replace function kernel.resolve_obligation_internal (
    -- keep exact existing signature
)
returns ...
language plpgsql
as 
begin

    -- existing logic stays unchanged

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
        emitted_at,
        idempotency_key
    )
    values (
        v_receipt_id,
        p_obligation_id,
        v_obligation.workspace_id,
        p_actor_id,
        p_resolution_type,
        p_reason,
        coalesce(p_evidence_present, '{}'::jsonb),
        p_failed_checks,
        v_proof_status,
        p_rule_version,
        now(),
        p_idempotency_key
    );

    -- rest of function unchanged

end;
;
