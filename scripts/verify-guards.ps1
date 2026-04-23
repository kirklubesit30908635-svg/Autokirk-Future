$ErrorActionPreference = "Stop"

function Invoke-ExpectedFailure {
    param(
        [string]$File,
        [string]$ExpectedText
    )

    Write-Host ""
    Write-Host "Running negative proof: $File"

    $output = cmd /c "supabase db query --file ""$File"" 2>&1"
    $exitCode = $LASTEXITCODE
    $joined = ($output | Out-String)

    if ($exitCode -eq 0) {
        throw "Expected failure but command succeeded for $File"
    }

    if ($joined -notmatch [regex]::Escape($ExpectedText)) {
        throw "Wrong failure for $File. Expected: $ExpectedText`nActual output:`n$joined"
    }

    Write-Host "PASS -> $ExpectedText"
}

Invoke-ExpectedFailure ".\sql\verify\20_fail_invalid_resolution_type.sql" "UNSUPPORTED_RESOLUTION_TYPE"
Invoke-ExpectedFailure ".\sql\verify\21_fail_missing_proof.sql" "PROOF_REQUIRED"
Invoke-ExpectedFailure ".\sql\verify\24_fail_invalid_kernel_resolution_type.sql" "UNSUPPORTED_RESOLUTION_TYPE"
Invoke-ExpectedFailure ".\sql\verify\25_fail_invalid_kernel_proof_status.sql" "INVALID_PROOF_STATUS"

Write-Host ""
Write-Host "GUARD_VERIFICATION_OK"
