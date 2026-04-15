Write-Host '== Verify Full Lifecycle =='

Write-Host '== Reset =='
supabase db reset

Write-Host '== Ingest event =='
supabase db query --file .\sql\execute\ingest_event_to_obligation.sql --output table

Write-Host '== Resolve obligation from ingest =='
supabase db query --file .\sql\execute\resolve_ingested_event_obligation_with_proof.sql --output table

Write-Host '== Verify full lifecycle =='
supabase db query --file .\sql\verify\05_full_lifecycle_from_ingest.sql --output table

Write-Host '== Replay resolve =='
supabase db query --file .\sql\execute\resolve_ingested_event_obligation_with_proof.sql --output table

Write-Host '== Verify after replay =='
supabase db query --file .\sql\verify\05_full_lifecycle_from_ingest.sql --output table
