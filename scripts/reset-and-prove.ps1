Write-Host '== AutoKirk reset and prove =='

Set-Location 'C:\Users\chase kirk\autokirk-future'

Write-Host '== Git status =='
git status

Write-Host '== Supabase status =='
supabase status

Write-Host '== Reset local database =='
supabase db reset

Write-Host '== Run verification query file =='
Get-Content .\sql\verify\01_basic_flow.sql
Write-Host 'Run this SQL in Supabase local query tool or wire this script to db query next.'
