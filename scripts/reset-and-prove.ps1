Write-Host '== AutoKirk reset and prove =='

Set-Location 'C:\Users\chase kirk\autokirk-future'

Write-Host '== Git status =='
git status

Write-Host '== Supabase status =='
supabase status

Write-Host '== Reset local database =='
supabase db reset

Write-Host '== Run canonical system truth proof =='
powershell -ExecutionPolicy Bypass -File .\scripts\verify-system-truth.ps1