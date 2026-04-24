create or replace function api.resolve_obligation(
    p_obligation_id uuid,
    p_actor_id uuid,
    p_resolution_type text,
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
    v_proof_status text;
begin
    if p_resolution_type is null or length(trim(p_resolution_type)) = 0 then
        raise exception 'RESOLUTION_TYPE_REQUIRED';
    end if;

    case p_resolution_type
        when 'resolve_with_proof' then
            v_proof_status := 'sufficient';
        when 'resolve_with_insufficient_proof' then
            v_proof_status := 'insufficient';
        when 'resolve_rejected' then
            v_proof_status := 'rejected';
        else
            raise exception 'UNSUPPORTED_RESOLUTION_TYPE';
    end case;

    return kernel.resolve_obligation_internal(
        p_obligation_id     => p_obligation_id,
        p_actor_id          => p_actor_id,
        p_resolution_type   => p_resolution_type,
        p_reason            => p_reason,
        p_evidence_present  => p_evidence_present,
        p_failed_checks     => p_failed_checks,
        p_rule_version      => p_rule_version,
        p_proof_status      => v_proof_status,
        p_idempotency_key   => p_idempotency_key
    );
end;
$$;
