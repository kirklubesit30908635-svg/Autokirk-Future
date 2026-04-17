$ErrorActionPreference = "Stop"

function Step($label) {
    Write-Host ""
    Write-Host "== $label ==" -ForegroundColor Cyan
}

Step "Run canonical ingest check"
powershell -ExecutionPolicy Bypass -File ".\scripts\check-ingest.ps1"
if ($LASTEXITCODE -ne 0) {
    throw "check-ingest.ps1 failed."
}

Step "Run canonical lifecycle check"
powershell -ExecutionPolicy Bypass -File ".\scripts\check-lifecycle.ps1"
if ($LASTEXITCODE -ne 0) {
    throw "check-lifecycle.ps1 failed."
}

Write-Host ""
Write-Host "FULL SYSTEM CHECK PASSED" -ForegroundColor Green
