# Resolve With Insufficient Proof — Hardening Plan

## Purpose

Defines the next hardening work for the first complete kernel slice after the initial loop is present.

Current implemented loop:

event ? obligation ? resolution ? receipt

This plan covers what must be added before the slice can be considered durable.

---

## Current strengths

- authority substrate exists
- workspace membership guards exist
- obligation table exists
- event table exists
- receipt table exists
- governed RPC exists
- contracts exist
- verification file exists

---

## Current gaps

### 1. Idempotency
The RPC can currently be executed more than once for the same intent and produce duplicate event/receipt truth.

### 2. Transaction integrity
The RPC should guarantee all-or-nothing mutation behavior across:
- event insert
- obligation update
- receipt insert

### 3. Actor validation tightening
Current implementation checks membership, but does not yet prove stronger actor-level intent boundaries.

### 4. Real execution testing
The slice has not yet been verified through a full database reset/apply/test cycle.

---

## Hardening order

1. add idempotency contract
2. add idempotency storage surface
3. update RPC to enforce idempotency
4. define transaction expectations
5. execute real reset/apply verification

---

## Rule

No UI work, no second RPC, and no broader feature expansion before this slice is hardened.

## Status

ACTIVE NEXT STEP
