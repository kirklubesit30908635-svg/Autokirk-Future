select api.resolve_obligation(
  p_obligation_id := 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  p_actor_id := '11111111-1111-1111-1111-111111111111'::uuid,
  p_resolution_type := 'resolve_with_insufficient_proof',
  p_reason := 'seed insufficient proof',
  p_evidence_present := '{}'::jsonb,
  p_failed_checks := '["missing_documentation"]'::jsonb,
  p_rule_version := 'v1',
  p_idempotency_key := 'seed-insufficient-proof-1'
);
