$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==> Verifying watchdog_emissions table is queryable" -ForegroundColor Cyan
$emissionsOutput = supabase db query "SELECT COUNT(*) as emission_count FROM control.watchdog_emissions;"
if ($LASTEXITCODE -ne 0) {
    throw "SIGNALS_VERIFICATION_FAILED: watchdog_emissions not queryable"
}
Write-Host "PASS -> watchdog_emissions queryable"

Write-Host ""
Write-Host "==> Verifying watchdog_delivery_candidates view exists" -ForegroundColor Cyan
$candidatesOutput = supabase db query "SELECT COUNT(*) as candidate_count FROM watchdog_delivery_candidates;"
if ($LASTEXITCODE -ne 0) {
    throw "SIGNALS_VERIFICATION_FAILED: watchdog_delivery_candidates not queryable"
}
Write-Host "PASS -> watchdog_delivery_candidates queryable"

Write-Host ""
Write-Host "==> Verifying delivery pipeline columns are intact" -ForegroundColor Cyan
$colOutput = supabase db query "SELECT emission_id, delivery_status, attempt_count, max_attempts FROM watchdog_delivery_candidates LIMIT 1;"
if ($LASTEXITCODE -ne 0) {
    throw "SIGNALS_VERIFICATION_FAILED: delivery pipeline columns missing"
}
Write-Host "PASS -> delivery pipeline columns intact"

Write-Host ""
Write-Host "SIGNALS_VERIFICATION_OK" -ForegroundColor Green
