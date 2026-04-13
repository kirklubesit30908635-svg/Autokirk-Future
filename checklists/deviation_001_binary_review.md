# Binary Review Checklist — Deviation Class #001

## Review object

A proposed implementation of the first permanent kernel slice for:

`resolve_with_insufficient_proof`

## Review rule

`resolve_with_insufficient_proof_v1`

## Binary standard

This checklist is pass/fail.
A single **No** means the slice is not constitutionally ready.

---

## A. Kernel semantics

1. **Permanent fact only**
   - Yes / No
   - Does the slice record only permanent kernel truth rather than temporary workflow state?

2. **No semantic drift dependency**
   - Yes / No
   - Could this receipt still mean the same thing if the UI and face vocabulary changed completely?

3. **No silent resolution**
   - Yes / No
   - Does the deviation path avoid treating the obligation as validly resolved?

---

## B. Authority boundary

4. **Single governed mutation path**
   - Yes / No
   - Is there exactly one governed RPC for this deviation path?

5. **No helper bypasses**
   - Yes / No
   - Are there no direct table-write helpers or route-level shortcuts creating the same truth?

6. **Watchdog is read-only**
   - Yes / No
   - Are watchdog derivations projection-only with zero mutation authority?

7. **Learning is advisory-only**
   - Yes / No
   - Is there no advisory-layer write path into kernel truth?

---

## C. Receipt contract

8. **Receipt meaning is permanent**
   - Yes / No
   - Is the receipt contract documented in a way that will not require reinterpretation later?

9. **Proof insufficiency is explicit**
   - Yes / No
   - Does the receipt permanently show that proof was insufficient and which checks failed?

10. **Rule version is captured**
    - Yes / No
    - Does the receipt identify which binary review rule was used?

---

## D. Surface freedom

11. **Projection freedom preserved**
    - Yes / No
    - Can UI labels, grouping, urgency copy, and face wording change without mutating kernel truth?

12. **No UI-governed truth**
    - Yes / No
    - Is no constitutional truth dependent on front-end state or UI-specific workflow logic?

---

## E. Anti-rebuild test

13. **Old truth never needs reinterpretation**
    - Yes / No
    - Can this be added without changing old kernel truth later?

14. **Future growth is additive**
    - Yes / No
    - Will later watchdog, reporting, and workflow layers grow as projection rather than correction?

15. **Small enough to finish deeply**
   - Yes / No
   - Is the slice narrow enough to finish fully before the next kernel slice is introduced?

---

## Binary outcome

- **PASS:** all answers are Yes.
- **FAIL:** any answer is No.

A failed review blocks the slice. No “ship now, fix later” override is constitutional.
