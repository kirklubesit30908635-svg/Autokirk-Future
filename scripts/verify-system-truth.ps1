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

$terminalScript = Join-Path $PSScriptRoot "verify-terminal-states.ps1"
$overdueScript  = Join-Path $PSScriptRoot "verify-overdue-failure.ps1"
$integritySql   = Join-Path $repoRoot "sql\verify\19_entity_integrity_score.sql"
$classificationSql = Join-Path $repoRoot "sql\verify\20_entity_integrity_classification.sql"

if (-not (Test-Path $terminalScript)) {
    throw "SCRIPT_NOT_FOUND: $terminalScript"
}

if (-not (Test-Path $overdueScript)) {
    throw "SCRIPT_NOT_FOUND: $overdueScript"
}

if (-not (Test-Path $integritySql)) {
    throw "SQL_FILE_NOT_FOUND: $integritySql"
}

if (-not (Test-Path $classificationSql)) {
    throw "SQL_FILE_NOT_FOUND: $classificationSql"
}

Write-Host ""
Write-Host "==> Running terminal state verification" -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File $terminalScript

if ($LASTEXITCODE -ne 0) {
    throw "TERMINAL_STATE_VERIFICATION_FAILED"
}

Write-Host ""
Write-Host "==> Running overdue failure verification" -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File $overdueScript

if ($LASTEXITCODE -ne 0) {
    throw "OVERDUE_FAILURE_VERIFICATION_FAILED"
}

Write-Host ""
Write-Host "==> Running entity integrity score verification" -ForegroundColor Cyan
$integrityJson = supabase db query --file $integritySql --output json

if ($LASTEXITCODE -ne 0 -or -not $integrityJson) {
    throw "ENTITY_INTEGRITY_SCORE_VERIFICATION_FAILED"
}

$integrityRows = Get-SupabaseRows -JsonText $integrityJson

if (-not $integrityRows) {
    throw "ENTITY_INTEGRITY_SCORE_EMPTY"
}

foreach ($row in $integrityRows) {
    if ([string]::IsNullOrWhiteSpace([string]$row.entity_id)) {
        throw "ENTITY_INTEGRITY_SCORE_ENTITY_ID_NULL"
    }

    if ([decimal]$row.resolution_rate -lt 0 -or [decimal]$row.resolution_rate -gt 100) {
        throw "ENTITY_INTEGRITY_SCORE_RESOLUTION_RATE_OUT_OF_RANGE"
    }

    if ([decimal]$row.integrity_score -lt -100 -or [decimal]$row.integrity_score -gt 100) {
        throw "ENTITY_INTEGRITY_SCORE_OUT_OF_RANGE"
    }

    if ([int64]$row.total_obligations -lt ([int64]$row.resolved_count + [int64]$row.failed_count)) {
        throw "ENTITY_INTEGRITY_SCORE_INVALID_COUNTS"
    }

    if ([int64]$row.weak_proof_count -gt [int64]$row.failed_count) {
        throw "ENTITY_INTEGRITY_SCORE_INVALID_COUNTS"
    }
}

$integrityRows | Format-Table entity_id, total_obligations, resolved_count, failed_count, weak_proof_count, resolution_rate, integrity_score -AutoSize

Write-Host ""
Write-Host "==> Running entity integrity classification verification" -ForegroundColor Cyan
$classificationJson = supabase db query --file $classificationSql --output json

if ($LASTEXITCODE -ne 0 -or -not $classificationJson) {
    throw "ENTITY_INTEGRITY_CLASSIFICATION_VERIFICATION_FAILED"
}

$classificationRows = Get-SupabaseRows -JsonText $classificationJson

if (-not $classificationRows) {
    throw "ENTITY_INTEGRITY_CLASSIFICATION_EMPTY"
}

$expectedLabels = @('healthy', 'warning', 'critical', 'failed')
$hasFailedClassification = $false

foreach ($row in $classificationRows) {
    if ([string]::IsNullOrWhiteSpace([string]$row.entity_id)) {
        throw "ENTITY_INTEGRITY_CLASSIFICATION_ENTITY_ID_NULL"
    }

    if ($expectedLabels -notcontains [string]$row.integrity_label_key) {
        throw "ENTITY_INTEGRITY_CLASSIFICATION_LABEL_INVALID"
    }

    if ([string]::IsNullOrWhiteSpace([string]$row.integrity_label)) {
        throw "ENTITY_INTEGRITY_CLASSIFICATION_LABEL_NULL"
    }

    if ([string]::IsNullOrWhiteSpace([string]$row.action_mode)) {
        throw "ENTITY_INTEGRITY_CLASSIFICATION_ACTION_MODE_NULL"
    }

    if ([string]::IsNullOrWhiteSpace([string]$row.classification_basis)) {
        throw "ENTITY_INTEGRITY_CLASSIFICATION_BASIS_NULL"
    }

    if ([string]$row.entity_id -eq 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' -and
        [string]$row.integrity_label_key -eq 'failed' -and
        [string]$row.action_mode -eq 'contractual') {
        $hasFailedClassification = $true
    }
}

$classificationRows | Format-Table entity_id, integrity_label_key, integrity_label, action_mode, classification_basis, resolution_rate, integrity_score -AutoSize

if (-not $hasFailedClassification) {
    throw "ENTITY_INTEGRITY_CLASSIFICATION_EXPECTED_FAILED_FIXTURE_MISSING"
}

Write-Host ""
Write-Host "SYSTEM_TRUTH_VERIFICATION_OK" -ForegroundColor Green
