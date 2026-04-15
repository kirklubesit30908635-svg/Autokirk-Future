Write-Host '== AutoKirk reset and prove =='

Set-Location 'C:\Users\chase kirk\autokirk-future'

Write-Host '== Git status =='
git status

Write-Host '== Supabase status =='
supabase status

Write-Host '== Reset local database =='
supabase db reset

Write-Host '== Resolve proof obligation through kernel =='
supabase db query --file .\sql\execute\resolve_with_proof.sql --output table

Write-Host '== Resolve insufficient proof obligation through kernel =='
supabase db query --file .\sql\execute\resolve_with_insufficient_proof.sql --output table

Write-Host '== Basic flow counts =='
supabase db query --file .\sql\verify\01_basic_flow.sql --output table

Write-Host '== Lifecycle trace =='
supabase db query --file .\sql\verify\02_trace_lifecycle.sql --output table

Write-Host '== Idempotency check =='
supabase db query --file .\sql\verify\03_idempotency_check.sql --output table
