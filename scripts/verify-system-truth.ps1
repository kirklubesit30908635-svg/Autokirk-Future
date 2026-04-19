$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

$terminalScript = Join-Path $PSScriptRoot "verify-terminal-states.ps1"
$overdueScript  = Join-Path $PSScriptRoot "verify-overdue-failure.ps1"

if (-not (Test-Path $terminalScript)) {
    throw "SCRIPT_NOT_FOUND: $terminalScript"
}

if (-not (Test-Path $overdueScript)) {
    throw "SCRIPT_NOT_FOUND: $overdueScript"
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
Write-Host "SYSTEM_TRUTH_VERIFICATION_OK" -ForegroundColor Green
