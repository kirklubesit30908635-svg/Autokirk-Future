# AutoKirk Strict Branch Protection Contract

Status: REQUIRED MANUAL PLATFORM SETTING
Scope: GitHub repository `kirklubesit30908635-svg/Autokirk-Future`
Branch: `main`

## Doctrine

No proof -> no merge.
No proof -> no production authority.

`main` is a governed advancement surface. Changes to `main` must be treated like obligation resolution: advancement requires proof and must preserve evidence.

## Required GitHub branch protection

Configure GitHub branch protection or rulesets for `main` with these requirements:

1. Require a pull request before merging.
2. Require status checks to pass before merging.
3. Required status check:
   - `AUTOKIRK_PROOF_GATE_OK`
4. Require branches to be up to date before merging.
5. Do not allow bypass for administrators unless an emergency bypass event is documented in `proofs/releases/`.
6. Restrict direct pushes to `main`.
7. Do not allow force pushes.
8. Do not allow deletions.
9. Require conversation resolution before merging.
10. Require signed commits when available for the repository/account.

## Required secrets for the proof gate

The proof gate requires these repository secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `VERCEL_TOKEN`
- `VERCEL_TEAM_ID`
- `VERCEL_PROJECT_ID`

Canonical values that are not secrets:

- `SUPABASE_PROJECT_REF=aiuicbyufelqdeiwhmyi`
- `VERCEL_TEAM_ID=team_OV8eAQoyzC70YMyjsAsc2MC6`
- `VERCEL_PROJECT_ID=prj_lJhyFrdcF6qOokBzf2cNVuMyhWoh`

## Required proof artifact

Every governed run must produce:

- `autokirk-proof-gate-summary.txt`
- `autokirk-release-receipt.json`
- `autokirk-receipt-status.txt`

The required workflow job name is:

```txt
AUTOKIRK_PROOF_GATE_OK
```

## Rejection criteria

Reject or block any merge if:

- `AUTOKIRK_PROOF_GATE_OK` did not pass.
- The proof receipt is missing.
- The receipt status is not `PASS`.
- The run lacks proof output for sealed markers.
- A production release receipt lacks live Supabase advisor verification.
- A production release receipt lacks Vercel READY verification for the matching commit SHA.

## Emergency bypass doctrine

Emergency bypass is not normal advancement.

If a bypass is unavoidable:

1. Create a receipt under `proofs/releases/` documenting:
   - reason,
   - actor,
   - commit,
   - impacted invariant,
   - rollback path,
   - follow-up proof requirement.
2. Restore `AUTOKIRK_PROOF_GATE_OK` as the required gate before any subsequent non-emergency merge.

Bypass without a receipt is governance failure.
