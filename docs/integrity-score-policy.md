# AutoKirk Future - Integrity Score Policy

## Status

Draft - canonical semantics for integrity score interpretation

## Purpose

This document defines how `projection.entity_integrity_score` is interpreted for operational, contractual, and system-governance use.

The raw score is not sufficient by itself. Classification requires policy thresholds, floor conditions, weighting rules, and recency rules.

## Core Principle

The integrity score is a proof-backed measure of execution reliability across the canonical lifecycle:

`event -> obligation -> resolution -> receipt`

It is not a consumer credit score.
It is not a financial bureau score.
It is a governed execution reliability score for AutoKirk entities and workspaces.

## Raw Score Role

The raw score is a numeric signal derived from lifecycle outcomes:

- resolved obligations
- failed obligations
- weak proof outcomes
- other policy-weighted penalties

The raw score is an input to classification, not the full classification by itself.

## Classification Bands

Initial draft bands:

- 90 to 100: healthy
- 70 to 89: warning
- 40 to 69: critical
- below 40: failed

These bands are provisional until calibrated against real-world distributions.

## Floor Conditions

The following conditions may force a worse classification regardless of raw score:

- any unresolved obligation overdue by more than policy threshold days
- repeated failed performance obligations within rolling policy window
- repeated weak-proof outcomes within rolling policy window
- any policy-defined severe breach category

A floor condition overrides the raw numeric band.

## Weighting By Truth Burden

Truth burden may affect penalty severity.

Initial policy direction:

- failed performance obligation > failed promise obligation
- weak proof on performance-related resolution > weak proof on promise-related resolution

No weighting should be implemented until the burden classes are confirmed stable in repo truth.

## Recency

Recency should matter.

Initial policy direction:

- recent failures weigh more than historical failures
- resolved historical failures should decay in impact over time
- unresolved recent failures should remain high-impact

Recommended implementation model:

- rolling 30-day operational weight
- rolling 90-day reliability weight
- historical lifetime score kept separately if needed

## Contract Meaning

The score may be used in three modes:

1. informational
2. internal enforcement
3. contractual trigger

Default rule:
The score is informational unless an agreement or internal policy explicitly attaches consequences to a threshold.

Possible threshold-triggered actions:

- watchdog escalation
- internal review flag
- customer notice
- enforcement hold
- higher proof burden requirement

## Implementation Doctrine

Policy must be defined in documentation before it is encoded in SQL.
Thresholds and floor conditions should be queryable and changeable without requiring score-logic rewrites.

## Current Rule

Until calibration is complete, raw integrity score should not be represented as a customer-facing trust grade without a policy wrapper.

## Read-Side Consequence Events

Before any enforcement logic is attached, failed contractual classifications may be exposed as read-only consequence events through `projection.integrity_events`.

This projection is observational only:

- it is sourced from `projection.entity_integrity_classification`
- it emits only failed contractual classifications
- it does not mutate obligations, receipts, or policy state
- it exists to make downstream consequence handling observable before enforcement is implemented

## Observational Consumer Surface

`projection.integrity_watchdog_candidates` is the first allowed consumer-facing surface for integrity consequence review.

It is also observational only:

- it is sourced from `projection.integrity_events`
- it is intended for operator/watchdog consumption
- it does not trigger contract behavior by itself
- it must not be treated as mutation authority
