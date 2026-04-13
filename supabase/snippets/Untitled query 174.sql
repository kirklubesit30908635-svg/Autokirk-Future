select api.resolve_obligation(
    p_obligation_id    => '08f5b1b8-1c10-44d1-bd44-5fac0d13d8b9'::uuid,
    p_actor_id         => '22222222-2222-2222-2222-222222222222'::uuid,
    p_resolution_type  => 'resolve_with_proof',
    p_reason           => 'first real kernel execution',
    p_evidence_present => '{"source":"manual_test","proof":"present"}'::jsonb,
    p_failed_checks    => '[]'::jsonb,
    p_rule_version     => 'v1',
    p_idempotency_key  => 'first-live-run-001'
);