$ErrorActionPreference = "Stop"

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
  resolution_type,
  proof_status,
  lifecycle_state
from projection.obligation_lifecycle
where resolution_type in (
  'resolve_with_proof',
  'resolve_with_insufficient_proof',
  'resolve_rejected'
)
order by obligation_created_at desc;
"@

$json = supabase db query $projectionSql --output json
if (-not $json) {
    throw "PROJECTION_QUERY_RETURNED_NO_OUTPUT"
}

$rows = $json | ConvertFrom-Json

if (-not $rows) {
    throw "PROJECTION_QUERY_RETURNED_NO_ROWS"
}

$hasSufficient = $false
$hasInsufficient = $false
$hasRejected = $false

foreach ($row in $rows) {
    if ($row.resolution_type -eq "resolve_with_proof" -and
        $row.proof_status -eq "sufficient" -and
        $row.lifecycle_state -eq "resolved") {
        $hasSufficient = $true
    }

    if ($row.resolution_type -eq "resolve_with_insufficient_proof" -and
        $row.proof_status -eq "insufficient" -and
        $row.lifecycle_state -eq "failed") {
        $hasInsufficient = $true
    }

    if ($row.resolution_type -eq "resolve_rejected" -and
        $row.proof_status -eq "rejected" -and
        $row.lifecycle_state -eq "failed") {
        $hasRejected = $true
    }
}

Write-Host ""
Write-Host "==> Terminal state summary" -ForegroundColor Cyan
$rows | Format-Table resolution_type, proof_status, lifecycle_state -AutoSize

if (-not $hasSufficient) {
    throw "MISSING_TERMINAL_STATE: resolve_with_proof / sufficient / resolved"
}

if (-not $hasInsufficient) {
    throw "MISSING_TERMINAL_STATE: resolve_with_insufficient_proof / insufficient / failed"
}

if (-not $hasRejected) {
    throw "MISSING_TERMINAL_STATE: resolve_rejected / rejected / failed"
}

Write-Host ""
Write-Host "TERMINAL_STATE_VERIFICATION_OK" -ForegroundColor Green
