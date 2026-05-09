# AutoKirk Receipt Verification Protocol

**Status:** Canonical, evergreen
**Authority:** Founder-sealed
**Citation:** Referenced by `AUTOKIRK_KERNEL_ARCHITECTURE_PRINCIPLES.md` Principle 3. All hash chain implementations, audit procedures, and Receipt API tier work cite this file.

This file specifies the cryptographic and procedural contract for AutoKirk receipt and ledger event verification. It defines exactly how hashes are computed, how chains are anchored, how integrity is verified, and how external auditors confirm a chain has not been tampered with. The protocol is what makes the hash chain a verifiable artifact rather than a database column.

The protocol is audit-grade, not customer-grade. Operators' customers do not walk hash chains. Insurance carriers, regulators, franchise HQs, and third-party auditors do. The protocol exists to give those external parties a deterministic procedure they can implement in any language.

---

## I. Scope

This protocol covers:

- Canonical serialization for hash inputs.
- Hash computation for ledger events and receipts.
- Genesis convention.
- Chain integrity invariants.
- Internal verification function specification.
- Offline audit procedure.
- Versioning and forward compatibility.

This protocol does **not** cover:

- Application-layer access control.
- Real-time receipt verification by operator customers (out of scope; not a use case).
- Payment proof or downstream financial reconciliation.

---

## II. Canonical Serialization

All hash inputs that include structured data (event payload, receipt payload) are serialized using **RFC 8785 — JSON Canonicalization Scheme (JCS)**.

JCS specifies:

- Object property keys sorted lexicographically by UTF-16 code unit values.
- Insignificant whitespace removed.
- Number serialization per ECMA-262 9.8.1 (`Number.prototype.toString`): no leading zeros, no trailing zeros after decimal, scientific notation when required, no `+` sign on exponents.
- String escaping per ECMA-262 24.5.2.2: minimal escaping, `\uXXXX` for non-ASCII characters.
- ASCII-only output.

JCS is chosen because it has reference implementations in JavaScript, Python, Go, Rust, Java, and C#, and because RFC 8785 is the IETF standard for cryptographic JSON canonicalization. External auditors can implement verification in any of these languages and produce identical hashes.

**Forbids:** Non-canonical JSON, language-specific serializers, locale-dependent number formatting, any serialization that depends on insertion order or runtime state.

---

## III. Hash Computation

### Inputs

For each event or receipt, the hash inputs are concatenated as raw bytes in this order:

```
hash_input := JCS(canonical_payload) ++ prev_hash_bytes ++ seq_bytes ++ workspace_id_bytes ++ chain_key_bytes
```

Where:

- `JCS(canonical_payload)` is the UTF-8 byte encoding of the JCS-canonicalized payload.
- `prev_hash_bytes` is the raw 32 bytes of the previous hash. (The hash column stores hex; verifiers hex-decode before concatenation.)
- `seq_bytes` is the ASCII decimal representation of the sequence number, no padding (e.g., `seq=42` → bytes `[0x34, 0x32]`).
- `workspace_id_bytes` is the ASCII representation of the workspace UUID, lowercase, hyphenated (canonical UUID format, 36 bytes).
- `chain_key_bytes` is the UTF-8 byte encoding of the chain key string.

Concatenation order is fixed. No separators. No length prefixes. The hash function defines its own boundaries through the fixed 32-byte width of `prev_hash` and the deterministic widths of the other components.

### Hash Function

`sha256(hash_input)` → 32 bytes → stored as hex string in `ledger.events.hash` and `ledger.receipts.hash` (or `receipts.receipts.hash` per the chosen schema location).

### Canonical Payload Definition

#### For `ledger.events`

```json
{
  "event_type": "<string>",
  "obligation_id": "<uuid string>",
  "actor_id": "<uuid string or null>",
  "evidence_present": <jsonb object>,
  "failed_checks": <jsonb object>,
  "rule_version": "<string>",
  "emitted_at": "<ISO-8601 UTC, microsecond precision>"
}
```

#### For receipts

```json
{
  "obligation_id": "<uuid string>",
  "actor_id": "<uuid string or null>",
  "resolution_type": "<string>",
  "reason": "<string or null>",
  "evidence_present": <jsonb object>,
  "failed_checks": <jsonb object>,
  "proof_status": "<string>",
  "rule_version": "<string>",
  "emitted_at": "<ISO-8601 UTC, microsecond precision>"
}
```

### Explicitly Excluded From Payload

The following fields are **not** part of the canonical payload and are not included in hash computation:

- `id` — auto-generated UUID, not deterministic on replay.
- `chain_key`, `seq`, `prev_hash`, `hash` — chain metadata, contributed to the hash separately as inputs.
- `workspace_id` — contributed separately.
- `created_at` (database row creation timestamp) — distinct from `emitted_at`; row metadata, not event content.
- `idempotency_key` — replay control, not event content.

### Timestamp Normalization

`emitted_at` must be normalized to ISO-8601 UTC with microsecond precision before serialization:

- Format: `YYYY-MM-DDTHH:MM:SS.ffffffZ`
- Always UTC (`Z` suffix, never offset notation).
- Always microsecond precision (six fractional digits, padded with zeros if needed).

This is the only timestamp normalization that produces deterministic hashes across PostgreSQL clients with different default timestamp formatting.

---

## IV. Genesis Convention

Genesis is scoped per `(workspace_id, chain_key)`:

```
genesis_hash(workspace_id, chain_key) := sha256("AUTOKIRK-GENESIS-" ++ workspace_id_bytes ++ ":" ++ chain_key_bytes)
```

Where:

- The literal prefix `AUTOKIRK-GENESIS-` is encoded as UTF-8 bytes.
- `workspace_id_bytes` is the canonical UUID string.
- The colon separator is the literal byte `0x3A`.
- `chain_key_bytes` is the UTF-8 byte encoding of the chain key.

Stored as hex in `ledger.chain_heads.head_hash` and `ledger.receipt_heads.head_hash` at chain creation, with `seq = 0`.

### Why Workspace-and-Chain-Scoped Genesis

If genesis were a literal constant string (as the prior Operator OS instance used: `'GENESIS'`), every chain in every workspace would start from the same anchor. Cross-workspace contamination — a row from one workspace inserted into another's chain — would be undetectable at chain-walk time, because the genesis would match.

Workspace-and-chain-scoped genesis means each chain has a unique anchor. A chain walk that produces a final genesis hash mismatching the expected workspace-and-chain-derived anchor immediately exposes contamination, wrong-chain insertion, or schema corruption.

---

## V. Chain Integrity Invariants

A chain is valid if and only if all of the following hold:

1. **Monotonic sequence.** For every row in `(workspace_id, chain_key)`, `seq[n] = seq[n-1] + 1`. The first row has `seq = 1`. No gaps. No duplicates.
2. **Prev-hash linkage.** For every row, `row[n].prev_hash = row[n-1].hash`. The first row's `prev_hash` equals `genesis_hash(workspace_id, chain_key)`.
3. **Hash recomputation.** For every row, recomputing `sha256(hash_input)` per Section III matches the stored `hash` byte-for-byte.
4. **Head consistency.** `chain_heads.head_hash` for `(workspace_id, chain_key)` equals the `hash` of the row with the maximum `seq` for that chain. `chain_heads.seq` equals that maximum `seq`.

A chain that violates any of these invariants is **broken**. The verifier reports the violation type and the specific row at which it was detected. There is no recovery procedure other than restore-from-backup followed by re-verification; broken chains do not self-heal.

---

## VI. Internal Verification Function

```
api.verify_chain_integrity(
  p_workspace_id uuid,
  p_chain_key text
) RETURNS TABLE (
  is_valid boolean,
  total_events bigint,
  expected_genesis text,
  actual_first_prev_hash text,
  gaps_detected boolean,
  hash_mismatches boolean,
  prev_hash_mismatches boolean,
  head_mismatch boolean,
  last_verified_seq bigint,
  error_at_seq bigint,
  error_type text
)
```

Behavior:

- Walks the chain from `seq = 1` to `chain_heads.seq` for the given `(workspace_id, chain_key)`.
- Recomputes hash for each row per Section III.
- Verifies prev-hash linkage and sequence monotonicity at each step.
- Verifies head consistency at the end.
- Returns first failure encountered, or success.
- Read-only. No state mutation. No idempotency key required.

This function is the kernel's own integrity check. It is callable by any role with `EXECUTE` privilege on the function. The function reads kernel tables under SECURITY DEFINER privilege but does not modify them.

---

## VII. Offline Audit Procedure

For external auditors performing periodic compliance review:

### Step 1 — Export

Auditor receives `SELECT` privilege on a tenant-scoped read role. Auditor exports:

```sql
SELECT id, chain_key, seq, prev_hash, hash, event_type, obligation_id, actor_id,
       evidence_present, failed_checks, rule_version, emitted_at
  FROM ledger.events
 WHERE workspace_id = $1
 ORDER BY chain_key, seq;
```

Plus the chain head:

```sql
SELECT chain_key, head_hash, seq AS head_seq
  FROM ledger.chain_heads
 WHERE workspace_id = $1;
```

Same pattern for receipts.

### Step 2 — Recompute

For each row in sequence order, the auditor:

1. Constructs the canonical payload per Section III.
2. JCS-canonicalizes the payload.
3. Concatenates with `prev_hash`, `seq`, `workspace_id`, `chain_key` per Section III.
4. Computes sha256.
5. Compares to the stored `hash`.

### Step 3 — Walk

The auditor verifies, in order:

- First row's `prev_hash` equals `genesis_hash(workspace_id, chain_key)`.
- Each subsequent row's `prev_hash` equals the previous row's recomputed (and verified) `hash`.
- Sequences are monotonic with no gaps starting at `seq = 1`.
- Final row's `hash` equals `chain_heads.head_hash`.

### Step 4 — Report

Auditor produces a report stating:

- Workspace and chain audited.
- Count of events and receipts verified.
- Result: pass / fail.
- If fail: row at which integrity broke and break type.
- Auditor signature, date, software version used.

The audit can be performed entirely offline once the export is in hand. No live database connection required during verification.

---

## VIII. Rollback Detection (Known Limitation)

A backup-and-restore that rolls the kernel back to an earlier point in time produces a chain that is internally consistent (passes Section V invariants) but represents an earlier truth than what was previously committed. The hash chain alone cannot detect this.

Mitigation paths, in order of strength:

1. **Periodic external attestation.** The current `chain_heads.head_hash` for each `(workspace_id, chain_key)` is published periodically (daily, hourly) to an external append-only log (a public ledger, a notarization service, or a separate AutoKirk-controlled instance). A rollback that produces a head hash older than the latest external attestation is detectable.
2. **Audit log of restore operations.** Restore events are themselves recorded as kernel events in a special `chain_key = 'control'` chain, making rollback explicit rather than silent.
3. **Customer-side receipt copies.** Operators' customers retain receipt artifacts independently. A customer's stored receipt with a higher `seq` than the current chain head exposes rollback.

These mitigations are out of scope for this protocol but are documented as the path to externally verifiable rollback resistance. Until they are implemented, hash chain integrity demonstrates **no in-place tampering** but does not demonstrate **no rollback**.

---

## IX. Versioning

This protocol is **version 1**. All events and receipts produced under version 1 carry `rule_version` values prefixed with `v1.` (e.g., `v1.resolve_with_proof`, `v1.payment_performance`).

Future protocol changes (version 2 or later) require:

1. A doctrine amendment artifact authorizing the change.
2. A new `rule_version` namespace (`v2.*`).
3. Either:
   - A migration that rewrites existing chains under the new protocol (with a fresh genesis), or
   - A continuation that begins new chains under the new protocol while leaving v1 chains intact and verifiable under v1 rules.
4. Updated reference implementations in JavaScript, Python, and one other language for external auditors.

A protocol change is a structural commitment change. It requires the same authorization process as any other principle amendment.

---

## X. Forbidden Patterns

The following patterns are forbidden under this protocol. Any code path that exhibits them does not merge:

- Hash computation outside the `api.*` SECURITY DEFINER functions (recomputation by application code is permitted for verification only, never for insertion).
- Hash recomputation on existing rows after insertion.
- Out-of-order writes within a chain (a write with `seq < chain_heads.seq + 1` is rejected).
- Chain forks (two rows with the same `(workspace_id, chain_key, seq)`).
- Modifying canonical payload fields after the row is written.
- Storing `emitted_at` with timezone offset other than UTC, or with sub-microsecond or super-microsecond precision.
- Genesis values that differ from the workspace-and-chain-scoped formula.
- Chain head updates that are not transactionally bound to the corresponding event or receipt write.
- Verification logic that trusts `hash` without recomputing it.

---

## XI. Reference Implementations

To be authored alongside Phase 1 Step 1.1 (hash chain port):

- **PostgreSQL kernel implementation.** SQL functions in the `api.*` schema implementing hash computation per Section III, integrated into existing resolver functions.
- **JavaScript verifier reference.** Node.js library implementing offline audit per Section VII. Uses `@stablelib/sha256` and a JCS implementation (`canonicalize` npm package or equivalent).
- **Python verifier reference.** Library implementing offline audit per Section VII. Uses `hashlib.sha256` and the `jcs` PyPI package.

Both verifier references must produce byte-identical hashes for the same input as the PostgreSQL implementation. A test suite of canonical fixtures (sample events with expected hashes) is maintained in the repo.

---

SEALED, EVERGREEN
RECEIPT VERIFICATION PROTOCOL — VERSION 1
