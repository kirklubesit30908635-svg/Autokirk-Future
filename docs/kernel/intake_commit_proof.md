# Intake Commit Proof

## Proven Behavior

The Visual Intake Face commit path has been executed and verified.

## Canonical Flow

candidate
→ api.commit_intake_candidate
→ api.ingest_event_to_obligation
→ ingest.source_events
→ kernel.open_obligation_internal
→ core.obligations

## Observed Results

- source_system = 'intake'
- source_event_type = 'intake_commit'
- deterministic source_event_key enforced
- obligation created through canonical kernel path
- truth_burden correctly assigned
- status = open
- proof_status = pending

## Replay Behavior

Replaying the same candidate_ref:

- returns ok = true
- returns replayed = true
- returns same source_event_id
- returns same obligation_id

No duplicate truth is created.

## System Guarantee Established

The system now guarantees:

1. Intake-origin work enters through canonical event ingestion
2. Every intake commit is replay-safe
3. No duplicate obligations are created for the same candidate_ref
4. Kernel authority is preserved (no direct obligation writes)
5. Intake face is now a valid mutation surface

## First Slice Complete

The following is now real and enforced:

candidate → event → obligation

Object layer is intentionally excluded in this slice.

