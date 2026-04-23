-- =========================================================
-- EXECUTION TEST: mismatch protection
-- Reuse same idempotency key with different input
-- Expect hard fail:
-- IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_INPUT
-- =========================================================

select api.resolve_obligation(
    p_obligation_id    => '11111111-1111-1111-1111-111111111111'::uuid,
    p_actor_id         => '22222222-2222-2222-2222-222222222222'::uuid,
    p_resolution_type  => 'resolve_with_proof',
    p_reason           => 'verification execution test CHANGED',
    p_evidence_present => '{"source":"manual_test","documents":["doc-2"],"proof":"changed"}'::jsonb,
    p_failed_checks    => '[]'::jsonb,
    p_rule_version     => 'v1',
    p_idempotency_key  => 'test-resolve-001'
);
