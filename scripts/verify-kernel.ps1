Write-Host '== Verify Kernel Integrity =='

.\scripts\reset-and-prove.ps1

Write-Host '== Replay proof obligation =='
supabase db query --file .\sql\execute\resolve_with_proof.sql --output table

Write-Host '== Replay insufficient proof obligation =='
supabase db query --file .\sql\execute\resolve_with_insufficient_proof.sql --output table

Write-Host '== Verify counts after replay =='
supabase db query --file .\sql\verify\01_basic_flow.sql --output table

Write-Host '== Verify idempotency after replay =='
supabase db query --file .\sql\verify\03_idempotency_check.sql --output table
