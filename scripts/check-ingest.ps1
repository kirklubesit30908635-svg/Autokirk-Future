$ErrorActionPreference = "Stop"

function Step($label) {
    Write-Host ""
    Write-Host "== $label ==" -ForegroundColor Cyan
}

function Run-SupabaseQuery($sql) {
    supabase db query $sql --output table
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase query failed."
    }
}

function Get-ScalarCount($sql) {
    $result = supabase db query $sql --output json | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) {
        throw "Scalar count query failed."
    }
    return [int]$result[0].count
}

$WorkspaceId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
$ActorId = '11111111-1111-1111-1111-111111111111'
$SourceSystem = 'manual_test'
$SourceEventKey = 'check-ingest-event-1'
$SourceEventType = 'payment_intent.succeeded'

Step "Supabase status"
supabase status
if ($LASTEXITCODE -ne 0) {
    throw "Supabase status failed."
}

Step "Reset local database"
supabase db reset
if ($LASTEXITCODE -ne 0) {
    throw "Database reset failed."
}

Step "Verify zero state after reset"
$sourceEvents = Get-ScalarCount "select count(*) as count from ingest.source_events;"
$obligationSources = Get-ScalarCount "select count(*) as count from core.obligation_sources;"
$obligations = Get-ScalarCount "select count(*) as count from core.obligations;"
$receipts = Get-ScalarCount "select count(*) as count from receipts.receipts;"

Write-Host "source_events=$sourceEvents"
Write-Host "obligation_sources=$obligationSources"
Write-Host "obligations=$obligations"
Write-Host "receipts=$receipts"

if ($sourceEvents -ne 0) { throw "Expected source_events = 0 after reset, got $sourceEvents" }
if ($obligationSources -ne 0) { throw "Expected obligation_sources = 0 after reset, got $obligationSources" }
if ($obligations -ne 0) { throw "Expected obligations = 0 after reset, got $obligations" }
if ($receipts -ne 0) { throw "Expected receipts = 0 after reset, got $receipts" }

Step "Ingest event to obligation"
Run-SupabaseQuery @"
select api.ingest_event_to_obligation(
  p_workspace_id := '$WorkspaceId'::uuid,
  p_actor_id := '$ActorId'::uuid,
  p_source_system := '$SourceSystem',
  p_source_event_key := '$SourceEventKey',
  p_source_event_type := '$SourceEventType',
  p_payload := jsonb_build_object(
    'event_type', '$SourceEventType',
    'customer_id', 'cus_check_ingest_001',
    'workspace_id', '$WorkspaceId',
    'amount', 1000,
    'currency', 'usd'
  )
);
"@

Step "Verify event to obligation counts"
$sourceEvents = Get-ScalarCount "select count(*) as count from ingest.source_events;"
$obligationSources = Get-ScalarCount "select count(*) as count from core.obligation_sources;"
$obligations = Get-ScalarCount "select count(*) as count from core.obligations;"

Write-Host "source_events=$sourceEvents"
Write-Host "obligation_sources=$obligationSources"
Write-Host "obligations=$obligations"

if ($sourceEvents -ne 1) { throw "Expected source_events = 1 after ingest, got $sourceEvents" }
if ($obligationSources -ne 1) { throw "Expected obligation_sources = 1 after ingest, got $obligationSources" }
if ($obligations -ne 1) { throw "Expected obligations = 1 after ingest, got $obligations" }

Step "Inspect obligation birth semantics"
Run-SupabaseQuery @"
select
  id,
  obligation_code,
  truth_burden,
  status,
  created_at
from core.obligations
order by created_at desc
limit 5;
"@

Step "Replay ingest with same source event key"
Run-SupabaseQuery @"
select api.ingest_event_to_obligation(
  p_workspace_id := '$WorkspaceId'::uuid,
  p_actor_id := '$ActorId'::uuid,
  p_source_system := '$SourceSystem',
  p_source_event_key := '$SourceEventKey',
  p_source_event_type := '$SourceEventType',
  p_payload := jsonb_build_object(
    'event_type', '$SourceEventType',
    'customer_id', 'cus_check_ingest_001',
    'workspace_id', '$WorkspaceId',
    'amount', 1000,
    'currency', 'usd'
  )
);
"@

Step "Verify replay-safe event to obligation counts"
$sourceEvents = Get-ScalarCount "select count(*) as count from ingest.source_events;"
$obligationSources = Get-ScalarCount "select count(*) as count from core.obligation_sources;"
$obligations = Get-ScalarCount "select count(*) as count from core.obligations;"

Write-Host "source_events=$sourceEvents"
Write-Host "obligation_sources=$obligationSources"
Write-Host "obligations=$obligations"

if ($sourceEvents -ne 1) { throw "Expected source_events = 1 after replay, got $sourceEvents" }
if ($obligationSources -ne 1) { throw "Expected obligation_sources = 1 after replay, got $obligationSources" }
if ($obligations -ne 1) { throw "Expected obligations = 1 after replay, got $obligations" }

Write-Host ""
Write-Host "INGEST CHECK PASSED" -ForegroundColor Green
