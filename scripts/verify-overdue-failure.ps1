$ErrorActionPreference = "Stop"

function Get-SupabaseRows {
    param(
        [Parameter(Mandatory = $true)]
        [object]$JsonText
    )

    if ($JsonText -is [array]) {
        $JsonText = ($JsonText -join [Environment]::NewLine)
    }

    $parsed = $JsonText | ConvertFrom-Json

    if ($null -ne $parsed.rows) {
        return $parsed.rows
    }

    return $parsed
}

function Get-SupabaseDbContainerName {
    $containerName = docker ps --format "{{.Names}}" |
        Where-Object { $_ -like "supabase_db_*" } |
        Select-Object -First 1

    if ([string]::IsNullOrWhiteSpace($containerName)) {
        throw "SUPABASE_DB_CONTAINER_NOT_FOUND"
    }

    return $containerName.Trim()
}

function Invoke-PsqlText {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [Parameter(Mandatory = $true)]
        [string]$Sql
    )

    $output = & docker exec $ContainerName psql -U postgres -d postgres -qAt -c $Sql 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "PSQL_COMMAND_FAILED`n$($output | Out-String)"
    }

    return @($output)
}

function Get-PsqlScalar {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [Parameter(Mandatory = $true)]
        [string]$Sql
    )

    $lines = Invoke-PsqlText -ContainerName $ContainerName -Sql $Sql
    $scalar = $lines |
        ForEach-Object { [string]$_ } |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        Select-Object -First 1

    return [string]$scalar
}

function Get-ClaimedEmissionId {
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Output
    )

    $match = $Output |
        ForEach-Object { [string]$_ } |
        Where-Object { $_ -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' } |
        Select-Object -First 1

    return [string]$match
}

$repoRoot = Split-Path -Parent $PSScriptRoot

$proveOverduePath = Join-Path $repoRoot "sql\verify\16_prove_overdue_failure.sql"
$alignOverduePath = Join-Path $repoRoot "sql\verify\17_overdue_failure_truth_alignment.sql"

Write-Host ""
Write-Host "==> Creating unresolved obligation" -ForegroundColor Cyan

supabase db query "
select api.ingest_event_to_obligation(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'service_commitment',
  'overdue-proof-script-' || gen_random_uuid()::text,
  'service_commitment_created',
  '{}'::jsonb,
  now() - interval '2 days'
);
" --output table

Write-Host ""
Write-Host "==> Running overdue mutation (16)" -ForegroundColor Cyan
supabase db query --file $proveOverduePath --output table

Write-Host ""
Write-Host "==> Materializing overdue failure through kernel authority" -ForegroundColor Cyan
supabase db query "select * from api.resolve_overdue_obligations();" --output table

Write-Host ""
Write-Host "==> Running overdue truth check (17)" -ForegroundColor Cyan
supabase db query --file $alignOverduePath --output table

Write-Host ""
Write-Host "==> Running watchdog delivery alignment check (23)" -ForegroundColor Cyan
$watchdogTargetJson = supabase db query "
select
  obligation_id::text as obligation_id
from public.overdue_failure_emission_candidates
where resolution_type = 'resolve_overdue'
order by receipt_emitted_at desc, obligation_created_at desc, obligation_id desc
limit 1;
" --output json

if ($LASTEXITCODE -ne 0 -or -not $watchdogTargetJson) {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_VERIFICATION_FAILED"
}

$watchdogTargetRows = Get-SupabaseRows -JsonText $watchdogTargetJson

if (-not $watchdogTargetRows) {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_EMPTY"
}

$watchdogObligationId = [string]$watchdogTargetRows[0].obligation_id

if ([string]::IsNullOrWhiteSpace($watchdogObligationId)) {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_OBLIGATION_ID_NULL"
}

$initialCandidateJson = supabase db query "
select count(*)::integer as initial_candidate_count
from public.watchdog_delivery_candidates
where obligation_id = '$watchdogObligationId'::uuid
  and delivery_target = 'outbound-webhook';
" --output json

$initialCandidateRows = Get-SupabaseRows -JsonText $initialCandidateJson

supabase db query "
insert into control.watchdog_emissions (
  obligation_id,
  delivery_target,
  delivery_status
)
values (
  '$watchdogObligationId'::uuid,
  'outbound-webhook',
  'pending'
)
on conflict (obligation_id, delivery_target) do nothing;
" --output table | Out-Null

supabase db query "
insert into control.watchdog_emissions (
  obligation_id,
  delivery_target,
  delivery_status
)
values (
  '$watchdogObligationId'::uuid,
  'outbound-webhook',
  'pending'
)
on conflict (obligation_id, delivery_target) do nothing;
" --output table | Out-Null

$pendingStateJson = supabase db query "
select
  (select count(*)::integer
   from control.watchdog_emissions
   where obligation_id = '$watchdogObligationId'::uuid
     and delivery_target = 'outbound-webhook') as logical_emission_count,
  (select count(*)::integer
   from public.watchdog_delivery_candidates
   where obligation_id = '$watchdogObligationId'::uuid
     and delivery_target = 'outbound-webhook') as pending_candidate_count,
  (select id::text
   from control.watchdog_emissions
   where obligation_id = '$watchdogObligationId'::uuid
     and delivery_target = 'outbound-webhook'
   limit 1) as emission_id;
" --output json

$pendingStateRows = Get-SupabaseRows -JsonText $pendingStateJson
$pendingStateRow = $pendingStateRows[0]
$watchdogEmissionId = [string]$pendingStateRow.emission_id

if ([string]::IsNullOrWhiteSpace($watchdogEmissionId)) {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_EMISSION_ID_NULL"
}

supabase db query "
select (api.record_watchdog_attempt(
  '$watchdogEmissionId'::uuid,
  'failed',
  now() - interval '1 minute'
)).id::text as emission_id;
" --output table | Out-Null

$retryStateJson = supabase db query "
select
  count(*)::integer as retry_candidate_count,
  max(delivery_status) as retry_delivery_status
from public.watchdog_delivery_candidates
where obligation_id = '$watchdogObligationId'::uuid
  and delivery_target = 'outbound-webhook';
" --output json

$retryStateRows = Get-SupabaseRows -JsonText $retryStateJson
$retryStateRow = $retryStateRows[0]

supabase db query "
select (api.record_watchdog_attempt(
  '$watchdogEmissionId'::uuid,
  'delivered',
  null
)).id::text as emission_id;
" --output table | Out-Null

$finalStateJson = supabase db query "
select
  (select count(*)::integer
   from public.watchdog_delivery_candidates
   where obligation_id = '$watchdogObligationId'::uuid
     and delivery_target = 'outbound-webhook') as delivered_candidate_count,
  (select delivery_status
   from control.watchdog_emissions
   where obligation_id = '$watchdogObligationId'::uuid
     and delivery_target = 'outbound-webhook'
   limit 1) as final_delivery_status;
" --output json

$finalStateRows = Get-SupabaseRows -JsonText $finalStateJson
$finalStateRow = $finalStateRows[0]

if ([int]$initialCandidateRows[0].initial_candidate_count -ne 1) {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_INITIAL_CANDIDATE_INVALID"
}

if ([int]$pendingStateRow.logical_emission_count -ne 1) {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_DEDUPE_FAILED"
}

if ([int]$pendingStateRow.pending_candidate_count -ne 1) {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_PENDING_SURFACE_INVALID"
}

if ([int]$retryStateRow.retry_candidate_count -ne 1) {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_RETRY_SURFACE_INVALID"
}

if ([string]$retryStateRow.retry_delivery_status -ne 'failed') {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_RETRY_STATUS_INVALID"
}

if ([int]$finalStateRow.delivered_candidate_count -ne 0) {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_DELIVERED_SURFACE_INVALID"
}

if ([string]$finalStateRow.final_delivery_status -ne 'delivered') {
    throw "WATCHDOG_DELIVERY_ALIGNMENT_FINAL_STATUS_INVALID"
}

Write-Host ""
Write-Host "==> Running watchdog claim concurrency proof" -ForegroundColor Cyan

$dbContainerName = Get-SupabaseDbContainerName
$claimProofEmissionId = Get-PsqlScalar -ContainerName $dbContainerName -Sql "
insert into control.watchdog_emissions (
  obligation_id,
  delivery_target,
  delivery_status
)
values (
  gen_random_uuid(),
  'claim-concurrency-proof',
  'pending'
)
returning id::text;
"

if ([string]::IsNullOrWhiteSpace($claimProofEmissionId)) {
    throw "WATCHDOG_CLAIM_PROOF_EMISSION_ID_NULL"
}

$claimJobScript = {
    param(
        [string]$ContainerName,
        [string]$Sql
    )

    $output = & docker exec $ContainerName psql -U postgres -d postgres -qAt -c $Sql 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw ($output | Out-String)
    }

    return @($output)
}

$lockingClaimSql = "
begin;
select coalesce((api.claim_watchdog_emission('$claimProofEmissionId'::uuid, 120)).id::text, '');
select pg_sleep(2);
commit;
"

$racingClaimSql = "
select coalesce((api.claim_watchdog_emission('$claimProofEmissionId'::uuid, 120)).id::text, '');
"

$firstClaimJob = Start-Job -ScriptBlock $claimJobScript -ArgumentList $dbContainerName, $lockingClaimSql
Start-Sleep -Milliseconds 250
$secondClaimJob = Start-Job -ScriptBlock $claimJobScript -ArgumentList $dbContainerName, $racingClaimSql

Wait-Job -Job $firstClaimJob, $secondClaimJob | Out-Null

if ($firstClaimJob.State -ne 'Completed' -or $secondClaimJob.State -ne 'Completed') {
    $firstClaimError = Receive-Job -Job $firstClaimJob -Keep | Out-String
    $secondClaimError = Receive-Job -Job $secondClaimJob -Keep | Out-String
    Remove-Job -Job $firstClaimJob, $secondClaimJob -Force
    throw "WATCHDOG_CLAIM_CONCURRENCY_JOB_FAILED`nFIRST:`n$firstClaimError`nSECOND:`n$secondClaimError"
}

$firstClaimOutput = Receive-Job -Job $firstClaimJob
$secondClaimOutput = Receive-Job -Job $secondClaimJob
Remove-Job -Job $firstClaimJob, $secondClaimJob -Force

$firstClaimId = Get-ClaimedEmissionId -Output $firstClaimOutput
$secondClaimId = Get-ClaimedEmissionId -Output $secondClaimOutput
$successfulClaims = @($firstClaimId, $secondClaimId) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

if ($successfulClaims.Count -ne 1) {
    throw "WATCHDOG_CLAIM_CONCURRENCY_WINNER_COUNT_INVALID"
}

if ($successfulClaims[0] -ne $claimProofEmissionId) {
    throw "WATCHDOG_CLAIM_WINNER_ID_INVALID"
}

if (-not (
    [string]::IsNullOrWhiteSpace($firstClaimId) -xor
    [string]::IsNullOrWhiteSpace($secondClaimId)
)) {
    throw "WATCHDOG_CLAIM_CONCURRENCY_LOSER_COUNT_INVALID"
}

$leaseStateAfterClaim = Get-PsqlScalar -ContainerName $dbContainerName -Sql "
select case
  when lease_expires_at is null then 'null'
  else 'set'
end
from control.watchdog_emissions
where id = '$claimProofEmissionId'::uuid;
"

if ($leaseStateAfterClaim -ne 'set') {
    throw "WATCHDOG_CLAIM_LEASE_NOT_SET"
}

$failedRetryEmissionId = Get-PsqlScalar -ContainerName $dbContainerName -Sql "
select (api.record_watchdog_attempt(
  '$claimProofEmissionId'::uuid,
  'failed',
  now() - interval '1 minute'
)).id::text;
"

if ($failedRetryEmissionId -ne $claimProofEmissionId) {
    throw "WATCHDOG_CLAIM_FAILED_RETRY_RECORD_DID_NOT_REUSE_ROW"
}

$failedRetryState = Get-PsqlScalar -ContainerName $dbContainerName -Sql "
select delivery_status || '|' ||
       attempt_count::text || '|' ||
       case when lease_expires_at is null then 'null' else 'set' end
from control.watchdog_emissions
where id = '$claimProofEmissionId'::uuid;
"

if ($failedRetryState -ne 'failed|1|null') {
    throw "WATCHDOG_CLAIM_FAILED_RETRY_STATE_INVALID"
}

$retryClaimId = Get-PsqlScalar -ContainerName $dbContainerName -Sql "
select coalesce((api.claim_watchdog_emission('$claimProofEmissionId'::uuid, 120)).id::text, '');
"

if ($retryClaimId -ne $claimProofEmissionId) {
    throw "WATCHDOG_CLAIM_RETRY_DID_NOT_REUSE_ROW"
}

$expiredLeaseEmissionId = Get-PsqlScalar -ContainerName $dbContainerName -Sql "
update control.watchdog_emissions
   set lease_expires_at = now() - interval '1 second'
 where id = '$claimProofEmissionId'::uuid
returning id::text;
"

if ($expiredLeaseEmissionId -ne $claimProofEmissionId) {
    throw "WATCHDOG_CLAIM_LEASE_EXPIRY_SETUP_FAILED"
}

$expiredLeaseReclaimId = Get-PsqlScalar -ContainerName $dbContainerName -Sql "
select coalesce((api.claim_watchdog_emission('$claimProofEmissionId'::uuid, 120)).id::text, '');
"

if ($expiredLeaseReclaimId -ne $claimProofEmissionId) {
    throw "WATCHDOG_CLAIM_EXPIRED_LEASE_RECLAIM_FAILED"
}

[pscustomobject]@{
    obligation_id = $watchdogObligationId
    initial_candidate_count = [int]$initialCandidateRows[0].initial_candidate_count
    logical_emission_count = [int]$pendingStateRow.logical_emission_count
    pending_candidate_count = [int]$pendingStateRow.pending_candidate_count
    retry_candidate_count = [int]$retryStateRow.retry_candidate_count
    retry_delivery_status = [string]$retryStateRow.retry_delivery_status
    delivered_candidate_count = [int]$finalStateRow.delivered_candidate_count
    final_delivery_status = [string]$finalStateRow.final_delivery_status
} | Format-Table obligation_id, initial_candidate_count, logical_emission_count, pending_candidate_count, retry_candidate_count, retry_delivery_status, delivered_candidate_count, final_delivery_status -AutoSize

[pscustomobject]@{
    emission_id = $claimProofEmissionId
    first_claim_id = $firstClaimId
    second_claim_id = if ([string]::IsNullOrWhiteSpace($secondClaimId)) { '<none>' } else { $secondClaimId }
    lease_state_after_claim = $leaseStateAfterClaim
    failed_retry_state = $failedRetryState
    retry_claim_id = $retryClaimId
    expired_lease_reclaim_id = $expiredLeaseReclaimId
} | Format-Table emission_id, first_claim_id, second_claim_id, lease_state_after_claim, failed_retry_state, retry_claim_id, expired_lease_reclaim_id -AutoSize

$entityCheckJson = supabase db query "
select count(*) as count
from public.overdue_failure_watchdog
where resolution_type = 'resolve_overdue'
  and (
    entity_id is null
    or receipt_id is null
    or receipt_entity_id is distinct from entity_id
  );
" --output json

$entityCheckRows = Get-SupabaseRows -JsonText $entityCheckJson

if ([int]$entityCheckRows[0].count -ne 0) {
    throw "OVERDUE_FAILURE_ENTITY_BINDING_FAILED"
}

Write-Host ""
Write-Host "OVERDUE_FAILURE_VERIFICATION_MANUAL_OK" -ForegroundColor Green
