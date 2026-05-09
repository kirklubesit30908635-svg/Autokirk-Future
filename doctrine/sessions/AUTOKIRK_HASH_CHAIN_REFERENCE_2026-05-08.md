# AutoKirk Hash Chain Reference — Operator OS Extract

**Date:** 2026-05-08
**Source:** `udwzexjwhkvsyeihcwfw` (AutoKirk Operator OS, design reference, ACTIVE_HEALTHY)
**Target:** `aiuicbyufelqdeiwhmyi` (AutoKirk Future, canonical, NOT yet hash-chained)
**Status:** Reference for adaptation. NOT for direct application.
**Authority:** Reference material; doctrine remains in `AUTOKIRK_KERNEL_ARCHITECTURE_PRINCIPLES.md` and `AUTOKIRK_RECEIPT_VERIFICATION_PROTOCOL.md`.

This file contains the complete SQL of the hash chain implementation as it currently exists on Operator OS, extracted via direct query of `supabase_migrations.schema_migrations` on 2026-05-08. It is the **starting point** for tomorrow's adaptation work, not the migration to apply.

The Operator OS implementation pre-dates the Verification Protocol. Three structural changes are required before any adapted version is applied to AutoKirk Future. Section II of this document enumerates them.

---

## I. Source Inventory

Five migrations together form the hash chain on Operator OS. Apply order matches Supabase's lexicographic sort.

| Order | Migration | Size | Purpose |
|---|---|---|---|
| 1 | `0002_schemas` | ~1 KB | sha256_hex helper, _deny_mutation trigger, schema declarations |
| 2 | `0005_ledger` | ~7.5 KB | chain_heads, events, receipt_heads, receipts; before-insert triggers; _deny_mutation triggers |
| 3 | `0006_api` | ~4.5 KB | api.append_event, api.emit_receipt SECURITY DEFINER write surface |
| 4 | `20260404120000_restore_kernel_resolver` | ~14 KB | api.resolve_obligation canonical body + receipt backfill |
| 5 | `20260404130000_fix_resolver_receipt_ordering` | ~11 KB | resolver fix: emit event/receipt BEFORE state update |

The last two migrations are most recent; they re-establish the resolver after a stripped version was overwritten by a later-timestamped migration. The current canonical resolver is the body in migration 5.

---

## II. Required Adaptations vs Verification Protocol

These changes MUST be made before any adapted migration runs on `aiuicbyufelqdeiwhmyi`. Each is a Kernel Interrogation gate item; merging without addressing them weakens Principle 3.

### Adaptation 1 — Genesis convention

**Operator OS:**
```sql
head_hash text NOT NULL DEFAULT 'GENESIS'
```
Literal constant string. Same anchor for every chain in every workspace.

**Required:** workspace-and-chain-scoped genesis per `AUTOKIRK_RECEIPT_VERIFICATION_PROTOCOL.md` Section IV:
```
genesis_hash(workspace_id, chain_key) := sha256("AUTOKIRK-GENESIS-" + workspace_id_bytes + ":" + chain_key_bytes)
```

**Implementation sketch:**
```sql
CREATE OR REPLACE FUNCTION ledger.genesis_hash(p_workspace_id uuid, p_chain_key text)
RETURNS text LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT encode(
    digest('AUTOKIRK-GENESIS-' || p_workspace_id::text || ':' || p_chain_key, 'sha256'),
    'hex'
  );
$$;
```

Then replace every `'GENESIS'` literal in chain_heads inserts with `ledger.genesis_hash(NEW.workspace_id, NEW.chain_key)`.

### Adaptation 2 — Canonical payload serialization

**Operator OS:**
```sql
NEW.hash := ledger.sha256_hex(
  NEW.prev_hash || '|' || NEW.seq::text || '|' || ... || NEW.payload::text
);
```
Uses `payload::text` — PostgreSQL's default JSON serialization. Non-deterministic across PostgreSQL versions and clients.

**Required:** RFC 8785 (JCS) canonical serialization per Verification Protocol Section II.

**Implementation options:**
- **Option A (preferred for kernel):** Add a PostgreSQL extension like `pgjsonschema` or write a PL/pgSQL JCS canonicalizer. Hash uses canonicalized output.
- **Option B (fallback):** Define a strict canonical form at the application layer. The application calls `api.append_event` with a pre-canonicalized payload string, and the trigger hashes the input as-is. Less safe — moves canonicalization out of the kernel.

The decision affects the verifier reference implementations (Section XI of the Verification Protocol). Both JS and Python have JCS libraries — `canonicalize` and `jcs` respectively.

### Adaptation 3 — Hash input — event_type vs event_type_id

**Operator OS:** uses `NEW.event_type_id::text` (integer FK to `registry.event_types`).
**Verification Protocol canonical payload spec:** uses `event_type` (string).

**Decision needed:** keep the integer FK pattern (matches Operator OS, locks AutoKirk Future to event_types table by ID), or switch to string event_type (more portable, more verifiable, but requires registry lookup at hash time).

Recommendation: switch to string. Auditors verifying the chain offline shouldn't need access to `registry.event_types` to recompute the hash.

---

## III. Backfill Strategy Decision (15 Events, 14 Receipts)

`aiuicbyufelqdeiwhmyi` has 15 ledger events and 14 receipts that predate the chain. Three options:

### Option A — Fresh start (simplest)

Apply hash chain migration. Existing rows get `chain_key`, `seq`, `prev_hash`, `hash` filled in via a one-time backfill that processes existing rows in `created_at` order, generating chain entries as if they were inserted live.

**Pro:** No data loss. All historical events become part of the chain.
**Con:** Existing rows' hashes don't reflect their original write order if there are timestamp ties. If `created_at` precision is microsecond, this is unlikely to matter.

### Option B — Pre-chain marker (cleanest)

Existing rows get `chain_key = 'pre-hash-chain'`, `seq = NULL`, `prev_hash = NULL`, `hash = NULL`. New events post-migration go into proper chains starting at `seq = 1`.

**Pro:** Explicit boundary. No fictional retroactive hashes.
**Con:** Existing 14 receipts are not cryptographically verifiable. Acceptable because they were issued before chain integrity was a structural commitment.

### Option C — Skip backfill (rejected)

Don't attempt to chain existing rows. New rows go into chains; old rows remain as-is.

**Why rejected:** Breaks the `(workspace_id, chain_key, seq)` UNIQUE constraint if old rows have NULL seq. Either Option A or B has to pick a strategy.

**Recommendation:** **Option B.** Marks existing data as pre-chain explicitly. Honest. Doesn't pretend to retroactive cryptographic guarantees that didn't exist when the rows were written.

---

## IV. Source Migration SQL

All five migrations below are exact extracts from `udwzexjwhkvsyeihcwfw`. They are reference, not for direct application.

### IV.1 — 0002_schemas.sql

```sql
-- =============================================================
-- 0002_schemas.sql
-- Schema declarations and foundational ledger utilities.
-- =============================================================

CREATE SCHEMA IF NOT EXISTS core;

CREATE SCHEMA IF NOT EXISTS registry;

CREATE SCHEMA IF NOT EXISTS ledger;

CREATE SCHEMA IF NOT EXISTS ingest;

CREATE SCHEMA IF NOT EXISTS api;

-- ---------------------------------------------------------------
-- ledger._deny_mutation
-- Raise on UPDATE/DELETE; attached as BEFORE trigger on all
-- append-only tables (ledger.events, ledger.receipts,
-- ingest.raw_events, ingest.trusted_events).
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION ledger._deny_mutation()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'table "%" is append-only: % is not permitted',
    TG_TABLE_NAME, TG_OP;
END;
$$;

-- ---------------------------------------------------------------
-- ledger.sha256_hex
-- SHA-256 hex digest of any text input.
-- Called exclusively from ledger trigger functions, which run as
-- postgres (superuser) and therefore bypass EXECUTE ACL.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION ledger.sha256_hex(input text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT encode(digest(input, 'sha256'), 'hex');
$$;
```

### IV.2 — 0005_ledger.sql

```sql
-- (See full SQL in chat history — ~7.5 KB of CREATE TABLE/CREATE TRIGGER statements)
-- Re-extract tomorrow with:
-- SELECT array_to_string(statements, E'\n\n-- ---- statement break ----\n\n') as sql
-- FROM supabase_migrations.schema_migrations WHERE version = '0005';
```

### IV.3 — 0006_api.sql

```sql
-- (See full SQL in chat history — ~4.5 KB of SECURITY DEFINER functions)
-- Re-extract tomorrow with:
-- SELECT array_to_string(statements, E'\n\n-- ---- statement break ----\n\n') as sql
-- FROM supabase_migrations.schema_migrations WHERE version = '0006';
```

### IV.4 — 20260404120000_restore_kernel_resolver.sql

This is the canonical resolver body. Migration 5 (below) supersedes it with a fixed ordering.

Re-extract:
```sql
SELECT array_to_string(statements, E'\n\n-- ---- statement break ----\n\n') as sql
FROM supabase_migrations.schema_migrations WHERE version = '20260404120000';
```

### IV.5 — 20260404130000_fix_resolver_receipt_ordering.sql

Active canonical resolver. Same body as IV.4 but emit event/receipt BEFORE state update.

Re-extract:
```sql
SELECT array_to_string(statements, E'\n\n-- ---- statement break ----\n\n') as sql
FROM supabase_migrations.schema_migrations WHERE version = '20260404130000';
```

---

## V. Live State Reference (Operator OS, 2026-05-08)

- `ledger.events`: 393 rows, RLS enabled, all chained.
- `ledger.chain_heads`: 243 rows, one per `(workspace_id, chain_key)` pair.
- `ledger.receipts`: 265 rows, all chained.
- `ledger.receipt_heads`: 233 rows.
- `event_type_id` is integer FK to `registry.event_types`.
- Genesis literal: `'GENESIS'` everywhere.
- Hash function: `ledger.sha256_hex(text)` — single text input.
- Hash format: pipe-delimited concatenation of (prev_hash, seq, workspace_id, chain_key, type_id, payload::text).

---

## VI. Recommended Tomorrow Sequence

1. Read `AUTOKIRK_RECEIPT_VERIFICATION_PROTOCOL.md` Sections II, III, IV in full.
2. Read this reference file's Section II (required adaptations).
3. Decide the three adaptation questions explicitly.
4. Author the AutoKirk Future migration.
5. Test locally.

---

## VII. What This File Is NOT

- Not doctrine.
- Not the migration to apply.
- Not a complete extract — full SQL is in chat history and re-extractable via Supabase query.
- Not authorization to skip the Kernel Interrogation gate.

---

SEALED 2026-05-08
EXTRACTION COMPLETE — REFERENCE ONLY
