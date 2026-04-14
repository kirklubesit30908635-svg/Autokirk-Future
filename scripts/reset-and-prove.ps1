Write-Host '== AutoKirk reset and prove =='

Set-Location 'C:\Users\chase kirk\autokirk-future'

Write-Host '== Git status =='
git status

Write-Host '== Supabase status =='
supabase status

Write-Host '== Reset local database =='
supabase db reset

Write-Host '== Resolve seeded obligation through kernel =='
supabase db query "
select api.resolve_obligation(
  p_obligation_id := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  p_actor_id := '11111111-1111-1111-1111-111111111111'::uuid,
  p_resolution_type := 'resolve_with_proof',
  p_reason := 'seed proof',
  p_evidence_present := '{}'::jsonb,
  p_failed_checks := '[]'::jsonb,
  p_rule_version := 'v1',
  p_idempotency_key := 'seed-proof-1'
);
" --output table

Write-Host '== Basic flow counts =='
supabase db query --file .\sql\verify\01_basic_flow.sql --output table

Write-Host '== Lifecycle trace =='
supabase db query --file .\sql\verify\02_trace_lifecycle.sql --output table

Write-Host '== Idempotency check =='
supabase db query --file .\sql\verify\03_idempotency_check.sql --output table
