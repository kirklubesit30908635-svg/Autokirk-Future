# AutoKirk Strict Vercel Production Protection Contract

Status: REQUIRED MANUAL PLATFORM SETTING
Target: Vercel production environment for `autokirk.com`

## Doctrine

Production deployment is governed advancement.

No proof -> no production authority.

Vercel production must not advance unless the GitHub proof gate produced a valid governed release receipt.

## Required Vercel production settings

Configure the production environment with the following requirements:

1. Require GitHub checks before production deployment.
2. Require successful completion of:

```txt
AUTOKIRK_PROOF_GATE_OK
```

3. Production deployments must correspond to the exact GitHub SHA validated by the proof gate.
4. Do not manually promote preview deployments to production without a governed release receipt.
5. Protect production environment variables.
6. Restrict production deployment authority.
7. Preserve deployment history.
8. Preserve failed deployment evidence.

## Required production proof chain

Production advancement requires:

```txt
commit
→ local replay
→ invariant proof
→ live Supabase advisor verification
→ matching Vercel deployment READY
→ governed release receipt
```

## Required receipt artifacts

Every production release must emit:

- `autokirk-proof-gate-summary.txt`
- `autokirk-release-receipt.json`
- `autokirk-receipt-status.txt`

## Required release receipt fields

The production receipt must include:

- commit SHA
- repository
- branch
- receipt kind
- receipt status
- receipt hash
- proof marker results
- Supabase verification result
- Vercel deployment verification result
- deployment ID
- timestamp

## Rejection criteria

Reject or block production deployment if:

- the proof gate failed,
- the receipt status is not `PASS`,
- the release receipt is missing,
- the deployment SHA does not match the verified SHA,
- the Supabase security advisor is not clean,
- the Vercel deployment is not `READY`.

## Emergency doctrine

Emergency deployment without proof receipt is governance failure.

If emergency deployment occurs:

1. Emit a manual emergency release receipt under `proofs/releases/`.
2. Record:
   - actor,
   - reason,
   - affected deployment,
   - rollback plan,
   - missing proof surface,
   - remediation plan.
3. Re-run the governed proof chain immediately after stabilization.
