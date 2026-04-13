create or replace function api.resolve_rejected(
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
begin
    return kernel.resolve_obligation_internal(
        p_obligation_id     => p_obligation_id,
        p_actor_id          => p_actor_id,
        p_resolution_type   => 'resolve_rejected',
        p_reason            => p_reason,
        p_evidence_present  => p_evidence_present,
        p_failed_checks     => p_failed_checks,
        p_rule_version      => p_rule_version,
        p_proof_status      => 'rejected',
        p_idempotency_key   => p_idempotency_key
    );
end;
$$;
