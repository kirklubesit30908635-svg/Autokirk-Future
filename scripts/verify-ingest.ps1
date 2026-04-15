Write-Host '== Verify Ingest Slice =='

Write-Host '== Reset local database =='
supabase db reset

Write-Host '== Execute ingest event to obligation =='
supabase db query --file .\sql\execute\ingest_event_to_obligation.sql --output table

Write-Host '== Verify event to obligation counts =='
supabase db query --file .\sql\verify\04_event_to_obligation.sql --output table

Write-Host '== Replay ingest event to obligation =='
supabase db query --file .\sql\execute\ingest_event_to_obligation.sql --output table

Write-Host '== Verify counts after replay =='
supabase db query --file .\sql\verify\04_event_to_obligation.sql --output table
