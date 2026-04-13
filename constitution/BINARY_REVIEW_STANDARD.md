# Binary Review Standard

## Purpose

Every future migration, function, RPC, and kernel-facing build artifact in AutoKirk Future must pass binary review.

Binary review is pass/fail.

A change either preserves doctrine or it does not.
A failing artifact does not enter the build.

---

## Review axes

Every reviewed artifact must pass all three axes:

1. mutation authority
2. construction constraints
3. proof guarantees

---

## 1. Mutation authority

Pass only if all are true:

- Kernel is the only mutation authority
- No UI path mutates canonical truth
- No watchdog path mutates canonical truth
- No learning path mutates canonical truth
- No helper, route, or direct table-write bypass creates equivalent truth outside the governed kernel path

Fail if any path outside kernel can create, alter, resolve, or seal canonical truth.

---

## 2. Construction constraints

Pass only if all are true:

- Artifact fits the locked build sequence
- Artifact does not introduce parallel truth
- Artifact does not depend on rejected substrate
- Artifact does not outrun the current spine
- Artifact is narrow enough to complete deeply before expansion

Fail if the artifact introduces ambiguity, hidden dependencies, premature expansion, or non-canonical structure.

---

## 3. Proof guarantees

Pass only if all are true:

- Canonical lifecycle remains legible:
  event ? obligation ? resolution ? receipt
- Every claimed resolution can produce permanent proof
- Receipt meaning is permanent
- Proof gaps remain explicit and are never hidden by UI or workflow language
- Old truth never requires reinterpretation later

Fail if proof can be missing, softened, fabricated, or deferred into projection layers.

---

## Binary rule

PASS:
- all three axes pass

FAIL:
- any single axis fails

There is no "ship now, fix later" override.

---

## Enforcement implication

Any future migration, RPC, receipt contract, or projection that fails binary review is constitutionally blocked from entering AutoKirk Future.

## Status

LOCKED
