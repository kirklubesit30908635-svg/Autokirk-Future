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
select api.record_watchdog_attempt(
  '$watchdogEmissionId'::uuid,
  'failed',
  now() - interval '1 minute'
);
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
select api.record_watchdog_attempt(
  '$watchdogEmissionId'::uuid,
  'delivered',
  null
);
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
