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
$SourceEventKey = 'check-lifecycle-event-1'
$SourceEventType = 'payment_intent.succeeded'
$ResolutionIdempotencyKey = 'check-lifecycle-resolve-1'

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

Step "Ingest event"
Run-SupabaseQuery @"
select api.ingest_event_to_obligation(
  p_workspace_id := '$WorkspaceId'::uuid,
  p_actor_id := '$ActorId'::uuid,
  p_source_system := '$SourceSystem',
  p_source_event_key := '$SourceEventKey',
  p_source_event_type := '$SourceEventType',
  p_payload := jsonb_build_object(
    'event_type', '$SourceEventType',
    'customer_id', 'cus_check_lifecycle_001',
    'workspace_id', '$WorkspaceId',
    'amount', 1000,
    'currency', 'usd'
  )
);
"@

Step "Verify event to obligation state"
$sourceEvents = Get-ScalarCount "select count(*) as count from ingest.source_events;"
$obligationSources = Get-ScalarCount "select count(*) as count from core.obligation_sources;"
$obligations = Get-ScalarCount "select count(*) as count from core.obligations;"
$receipts = Get-ScalarCount "select count(*) as count from receipts.receipts;"

Write-Host "source_events=$sourceEvents"
Write-Host "obligation_sources=$obligationSources"
Write-Host "obligations=$obligations"
Write-Host "receipts=$receipts"

if ($sourceEvents -ne 1) { throw "Expected source_events = 1 after ingest, got $sourceEvents" }
if ($obligationSources -ne 1) { throw "Expected obligation_sources = 1 after ingest, got $obligationSources" }
if ($obligations -ne 1) { throw "Expected obligations = 1 after ingest, got $obligations" }
if ($receipts -ne 0) { throw "Expected receipts = 0 before resolution, got $receipts" }

Step "Resolve newest open obligation through kernel"
Run-SupabaseQuery @"
select api.resolve_obligation(
  p_obligation_id := (
    select id
    from core.obligations
    where status = 'open'
    order by created_at desc
    limit 1
  ),
  p_actor_id := '$ActorId'::uuid,
  p_resolution_type := 'resolve_with_proof',
  p_reason := 'check lifecycle proof',
  p_evidence_present := jsonb_build_object(
    'check', 'lifecycle',
    'source', 'powershell'
  ),
  p_failed_checks := '[]'::jsonb,
  p_rule_version := 'v1',
  p_idempotency_key := '$ResolutionIdempotencyKey'
);
"@

Step "Verify full lifecycle invariants"
$sourceEvents = Get-ScalarCount "select count(*) as count from ingest.source_events;"
$obligationSources = Get-ScalarCount "select count(*) as count from core.obligation_sources;"
$obligations = Get-ScalarCount "select count(*) as count from core.obligations;"
$receipts = Get-ScalarCount "select count(*) as count from receipts.receipts;"

Write-Host "source_events=$sourceEvents"
Write-Host "obligation_sources=$obligationSources"
Write-Host "obligations=$obligations"
Write-Host "receipts=$receipts"

if ($sourceEvents -ne 1) { throw "Expected source_events = 1 after resolution, got $sourceEvents" }
if ($obligationSources -ne 1) { throw "Expected obligation_sources = 1 after resolution, got $obligationSources" }
if ($obligations -ne 1) { throw "Expected obligations = 1 after resolution, got $obligations" }
if ($receipts -ne 1) { throw "Expected receipts = 1 after resolution, got $receipts" }

Step "Inspect lifecycle state"
Run-SupabaseQuery @"
select
  (select obligation_code from core.obligations order by created_at desc limit 1) as obligation_code,
  (select truth_burden from core.obligations order by created_at desc limit 1) as truth_burden,
  (select status from core.obligations order by created_at desc limit 1) as obligation_status,
  (select id from receipts.receipts order by emitted_at desc limit 1) as latest_receipt_id;
"@

Step "Replay resolve with same idempotency key"
Run-SupabaseQuery @"
select api.resolve_obligation(
  p_obligation_id := (
    select id
    from core.obligations
    order by created_at desc
    limit 1
  ),
  p_actor_id := '$ActorId'::uuid,
  p_resolution_type := 'resolve_with_proof',
  p_reason := 'check lifecycle proof',
  p_evidence_present := jsonb_build_object(
    'check', 'lifecycle',
    'source', 'powershell'
  ),
  p_failed_checks := '[]'::jsonb,
  p_rule_version := 'v1',
  p_idempotency_key := '$ResolutionIdempotencyKey'
);
"@

Step "Verify replay-safe lifecycle counts"
$sourceEvents = Get-ScalarCount "select count(*) as count from ingest.source_events;"
$obligationSources = Get-ScalarCount "select count(*) as count from core.obligation_sources;"
$obligations = Get-ScalarCount "select count(*) as count from core.obligations;"
$receipts = Get-ScalarCount "select count(*) as count from receipts.receipts;"

Write-Host "source_events=$sourceEvents"
Write-Host "obligation_sources=$obligationSources"
Write-Host "obligations=$obligations"
Write-Host "receipts=$receipts"

if ($sourceEvents -ne 1) { throw "Expected source_events = 1 after replay, got $sourceEvents" }
if ($obligationSources -ne 1) { throw "Expected obligation_sources = 1 after replay, got $obligationSources" }
if ($obligations -ne 1) { throw "Expected obligations = 1 after replay, got $obligations" }
if ($receipts -ne 1) { throw "Expected receipts = 1 after replay, got $receipts" }

Step "Inspect latest lifecycle trace"
Run-SupabaseQuery @"
select
  o.id as obligation_id,
  o.obligation_code,
  o.truth_burden,
  o.status,
  o.resolved_at,
  r.id as receipt_id,
  r.resolution_type,
  r.reason,
  r.proof_status,
  r.emitted_at
from core.obligations o
left join receipts.receipts r
  on r.obligation_id = o.id
order by o.created_at desc
limit 5;
"@

Write-Host ""
Write-Host "LIFECYCLE CHECK PASSED" -ForegroundColor Green
