# Resolve With Insufficient Proof — Verification

## Purpose

This file verifies that the first governed kernel slice is present and structurally aligned.

It checks the implemented lifecycle:

event ? obligation ? resolution ? receipt

---

## Required files

- spine\migrations\0006_resolve_with_insufficient_proof.sql
- spine\migrations\0007_obligations.sql
- spine\migrations\0008_receipts.sql
- spine\migrations\0009_events.sql
- control\RESOLVE_WITH_INSUFFICIENT_PROOF_CONTRACT.md
- control\RESOLVE_WITH_INSUFFICIENT_PROOF_EVENT_CONTRACT.md
- control\RESOLVE_WITH_INSUFFICIENT_PROOF_RPC_CONTRACT.md
- receipts\RESOLVE_WITH_INSUFFICIENT_PROOF_RECEIPT_CONTRACT.md
- checklists\deviation_001_binary_review.md

---

## Structural checks

- [ ] RPC exists
- [ ] obligations table exists
- [ ] receipts table exists
- [ ] events table exists
- [ ] authority guard exists
- [ ] workspace membership substrate exists

---

## Behavior checks

- [ ] RPC loads obligation
- [ ] RPC asserts workspace membership
- [ ] RPC rejects missing reason
- [ ] RPC rejects missing evidence
- [ ] RPC rejects missing failed_checks
- [ ] RPC rejects missing rule_version
- [ ] RPC rejects non-open obligations
- [ ] RPC emits event
- [ ] RPC updates obligation
- [ ] RPC emits receipt
- [ ] RPC returns stable payload

---

## Binary review checks

- [ ] mutation authority preserved
- [ ] construction constraints preserved
- [ ] proof guarantees preserved
- [ ] no UI-governed truth
- [ ] no helper bypasses
- [ ] receipt meaning remains permanent

---

## Current status

FIRST COMPLETE LOOP PRESENT

## Next hardening targets

- idempotency
- transaction integrity
- actor validation tightening
- execution test against real reset/apply flow
