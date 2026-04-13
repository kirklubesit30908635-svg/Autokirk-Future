select api.resolve_with_proof(
  '58c61a03-8535-412f-994f-33a0c96fdaae'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'verified test resolution',
  '{"proof":"present"}'::jsonb,
  '[]'::jsonb,
  'rule_v1',
  'resolve-proof-evt-001'
);
