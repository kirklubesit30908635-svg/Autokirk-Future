Write-Host '== AutoKirk System Verification =='

Write-Host '== Kernel Slice =='
.\scripts\verify-kernel.ps1

Write-Host '== Ingest Slice =='
.\scripts\verify-ingest.ps1

Write-Host '== Full Lifecycle Slice =='
.\scripts\verify-full-lifecycle.ps1

Write-Host '== System Verified =='
