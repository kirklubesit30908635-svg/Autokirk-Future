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
Write-Host "==> Running overdue truth check (17)" -ForegroundColor Cyan
supabase db query --file $alignOverduePath --output table

$entityCheckJson = supabase db query "
select count(*) as count
from public.overdue_failure_watchdog
where due_at is not null
  and due_at < now()
  and receipt_id is null
  and entity_id is null;
" --output json

$entityCheckRows = Get-SupabaseRows -JsonText $entityCheckJson

if ([int]$entityCheckRows[0].count -ne 0) {
    throw "OVERDUE_FAILURE_ENTITY_BINDING_FAILED"
}

Write-Host ""
Write-Host "OVERDUE_FAILURE_VERIFICATION_MANUAL_OK" -ForegroundColor Green
