# AutoKirk Governed Release Receipt Archive

Status: ACTIVE
Path: `proofs/releases/`

## Purpose

This directory is the canonical archive for governed software release receipts.

A release receipt is a durable operational truth artifact proving:

- what advanced,
- who advanced it,
- what proof validated advancement,
- what deployment became authoritative,
- and whether the governed release chain passed.

## Doctrine

No proof -> no closure.
No proof -> no deploy.
No advancement without durable evidence.

## Canonical release chain

```txt
commit
→ replay
→ invariant proof
→ security verification
→ deployment verification
→ governed release receipt
→ production authority
```

## Canonical receipt artifact

The GitHub Actions proof gate emits:

```txt
autokirk-release-receipt.json
```

This receipt is the machine-generated authority artifact for the release.

## Required receipt fields

Every receipt should include:

- schema version
- doctrine version
- receipt ID
- receipt kind
- receipt status
- generated timestamp
- repository
- branch
- commit SHA
- GitHub run ID
- actor
- proof markers
- Supabase verification state
- Vercel deployment verification state
- deployment ID
- receipt hash

## Receipt kinds

### pull_request_proof

Non-production governed proof verification.

Purpose:
- replay validation,
- invariant validation,
- proof validation,
- pre-merge governance.

Does not carry production deployment authority.

### production_release

Production-authoritative governed release receipt.

Requires:
- live Supabase verification,
- live Vercel deployment verification,
- matching production SHA,
- full governed proof chain.

## Archive doctrine

Receipts in this archive are operational truth artifacts.

Do not:
- rewrite receipts,
- silently replace receipts,
- delete failed receipts,
- remove evidence artifacts.

Governance failure evidence is still governed evidence.

## Future evolution

Planned evolution:

- append-only release archive,
- release hash chain,
- signed receipts,
- externally verifiable release lineage,
- release-to-obligation linkage,
- release-to-receipt lineage proofs.

## Emergency release doctrine

Emergency advancement requires:

1. manual emergency receipt,
2. actor attribution,
3. rollback path,
4. remediation plan,
5. post-emergency governed replay.

Emergency deployment without receipt is governance failure.
