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

function Invoke-SqlFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw "SQL_FILE_NOT_FOUND: $Path"
    }

    Write-Host ""
    Write-Host "==> Running $Path" -ForegroundColor Cyan
    supabase db query --file $Path --output table
}

function Invoke-SqlText {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Sql
    )

    Write-Host ""
    Write-Host "==> Running projection terminal-state check" -ForegroundColor Cyan
    supabase db query $Sql --output json
}

$repoRoot = Split-Path -Parent $PSScriptRoot

$proveSufficientPath   = Join-Path $repoRoot "sql\verify\08_prove_full_loop.sql"
$proveInsufficientPath = Join-Path $repoRoot "sql\verify\11_prove_insufficient_proof.sql"
$proveRejectedPath     = Join-Path $repoRoot "sql\verify\14_prove_rejected_path.sql"

Invoke-SqlFile -Path $proveSufficientPath
Invoke-SqlFile -Path $proveInsufficientPath
Invoke-SqlFile -Path $proveRejectedPath

$projectionSql = @"
select
  count(*) filter (
    where resolution_type in (
      'resolve_with_proof',
      'resolve_with_insufficient_proof',
      'resolve_rejected'
    )
  ) as terminal_row_count,
  count(*) filter (
    where resolution_type in (
      'resolve_with_proof',
      'resolve_with_insufficient_proof',
      'resolve_rejected'
    )
    and entity_id is null
  ) as missing_entity_count,
  count(*) filter (
    where resolution_type in (
      'resolve_with_proof',
      'resolve_with_insufficient_proof',
      'resolve_rejected'
    )
    and receipt_id is not null
    and receipt_entity_id is distinct from entity_id
  ) as receipt_entity_mismatch_count,
  count(*) filter (
    where resolution_type = 'resolve_with_proof'
      and proof_status = 'sufficient'
      and lifecycle_state = 'resolved'
  ) as sufficient_resolved_count,
  count(*) filter (
    where resolution_type = 'resolve_with_insufficient_proof'
      and proof_status = 'insufficient'
      and lifecycle_state = 'failed'
  ) as insufficient_failed_count,
  count(*) filter (
    where resolution_type = 'resolve_rejected'
      and proof_status = 'rejected'
      and lifecycle_state = 'failed'
  ) as rejected_failed_count
from projection.obligation_lifecycle;
"@

$json = supabase db query $projectionSql --output json
if (-not $json) {
    throw "PROJECTION_QUERY_RETURNED_NO_OUTPUT"
}

$rows = Get-SupabaseRows -JsonText $json

if (-not $rows) {
    throw "PROJECTION_QUERY_RETURNED_NO_ROWS"
}

$summary = @($rows | Where-Object { $null -ne $_ })[0]

if ($null -eq $summary) {
    throw "PROJECTION_QUERY_RETURNED_NO_ROWS"
}

Write-Host ""
Write-Host "==> Terminal state summary" -ForegroundColor Cyan
$summary | Format-Table terminal_row_count, missing_entity_count, receipt_entity_mismatch_count, sufficient_resolved_count, insufficient_failed_count, rejected_failed_count -AutoSize

if ([int]$summary.terminal_row_count -lt 3) {
    throw "MISSING_TERMINAL_STATE_ROWS"
}

if ([int]$summary.missing_entity_count -gt 0) {
    throw "MISSING_ENTITY_ID_IN_LIFECYCLE_PROJECTION"
}

if ([int]$summary.receipt_entity_mismatch_count -gt 0) {
    throw "RECEIPT_ENTITY_MISMATCH"
}

if ([int]$summary.sufficient_resolved_count -lt 1) {
    throw "MISSING_TERMINAL_STATE: resolve_with_proof / sufficient / resolved"
}

if ([int]$summary.insufficient_failed_count -lt 1) {
    throw "MISSING_TERMINAL_STATE: resolve_with_insufficient_proof / insufficient / failed"
}

if ([int]$summary.rejected_failed_count -lt 1) {
    throw "MISSING_TERMINAL_STATE: resolve_rejected / rejected / failed"
}

Write-Host ""
Write-Host "TERMINAL_STATE_VERIFICATION_OK" -ForegroundColor Green
