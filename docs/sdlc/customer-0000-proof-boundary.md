# AutoKirk Customer #0000 SDLC Proof Boundary

Status: scaffold / proposing layer until receipts exist in AutoKirk kernel.
Owner: Kirk Digital Holdings internal SDLC.
Purpose: attach AutoKirk to the systems already used to build AutoKirk.

## Axiom

AutoKirk exists because trust cannot come from the same place as the claim.

For the SDLC, GitHub, GitHub Actions, Supabase, Vercel, AI, and the founder may produce claims. AutoKirk governs whether those claims count.

## Boundary

This is not a new workflow app.

Existing systems stay in place:

- GitHub remains the source of code and branch events.
- GitHub Actions remains the proof execution surface.
- Supabase remains the kernel and live state surface.
- Vercel remains the production deployment surface.

AutoKirk attaches to those systems and governs closure claims from them.

## First governed claims

### 1. branch_protection_main

Claim: `main` is protected.

Source system: GitHub.

Required proof:

- default branch is `main`
- branch protection or ruleset enforcement exists for `main`
- force pushes are blocked
- deletions are blocked
- pull request flow is required or equivalent ruleset enforcement exists
- required status check includes `AUTOKIRK_PROOF_GATE_OK`

Closure rule:

This obligation may close only when GitHub evidence proves the branch cannot be changed in a way that bypasses the proof gate.

### 2. ci_proof_gate_green

Claim: the AutoKirk proof gate is healthy on current `main`.

Source system: GitHub Actions.

Required proof:

- current `origin/main` SHA is known
- latest `AutoKirk Future Proof Gate` run for `main` matches that SHA
- required job/context `AUTOKIRK_PROOF_GATE_OK` succeeded

Closure rule:

This obligation may close only when the latest current-main proof gate succeeds on the same SHA as main.

### 3. phase_seal_current

Claim: doctrine/state memory is current enough to support a phase seal.

Source system: Supabase production project.

Required proof:

- migration count queried from live database
- obligation count queried from live database
- resolved obligation receipt invariant holds at current scale
- protected-table RLS state is queried
- snapshot is timestamped and tied to source project ref

Closure rule:

This obligation may close only when the live kernel state supports the seal claim being made.

## Emitter contract

Each emitter writes a JSON source event artifact with this shape:

```json
{
  "schema": "autokirk.sdlc_source_event.v1",
  "workspace_code": "kdh_internal_sdlc",
  "obligation_code": "branch_protection_main",
  "source_system": "github",
  "source_claim": "main branch is protected",
  "observed_at": "ISO-8601 timestamp",
  "status": "proof_ready | awaiting_proof | failed_proof",
  "proof": {},
  "rationale": []
}
```

If `AUTOKIRK_SDLC_INGEST_URL` is configured, the workflow may POST the source event to AutoKirk. If not configured, the artifact remains evidence but not kernel-governed truth.

## Receipt boundary

A workflow artifact is not a receipt.
A markdown file is not a receipt.
A green GitHub check is not a receipt.

Only a receipt emitted through the governed AutoKirk kernel closes the SDLC obligation.

Until receipt rows exist for these obligation codes, this directory is scaffolding and evidence, not proof.
