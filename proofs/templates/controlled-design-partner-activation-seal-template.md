# AutoKirk Controlled Design-Partner Activation Seal

Date: YYYY-MM-DD

## Scope

This artifact seals one controlled design-partner activation.

Activation shape:

- one controlled design partner;
- one workflow;
- one board;
- one proof rule;
- one receipt-backed closure;
- founder-led onboarding.

## Partner

Partner/workspace label:

```txt
TBD
```

Workspace ID:

```txt
TBD
```

Design-partner contact / owner:

```txt
TBD
```

## Workflow

Workflow name:

```txt
TBD
```

Workflow sentence:

```txt
This work should not be marked complete unless TBD proof exists.
```

## Proof rule

```txt
An obligation may close only when TBD exists and TBD submits it through the governed proof path.
```

## Obligation

Obligation ID:

```txt
TBD
```

Obligation code:

```txt
TBD
```

Source/intake path:

```txt
TBD
```

## Board visibility proof

Board URL shape:

```txt
/board/<workspace-id>?key=REDACTED
```

Verified:

- [ ] obligation appears on correct workspace board;
- [ ] no unrelated workspace obligations appear;
- [ ] public no-key access does not expose workspace data;
- [ ] board is read/projection truth, not optimistic UI state.

Evidence:

```txt
TBD
```

## Proof submission

Proof submitted through:

```txt
TBD
```

Proof note / evidence summary:

```txt
TBD
```

Proof artifact URL or reference, if any:

```txt
TBD
```

Verified:

- [ ] proof was submitted through governed route;
- [ ] proof was not inserted directly into kernel tables;
- [ ] browser/client did not call privileged RPC directly.

## Resolution

Resolution path:

```txt
UI -> server/API route -> governed API/kernel path -> receipt/proof surface
```

Verified:

- [ ] obligation resolved through governed proof path;
- [ ] lifecycle reached terminal state;
- [ ] no direct kernel mutation path was used.

## Receipt

Receipt ID:

```txt
TBD
```

Receipt emitted at:

```txt
TBD
```

Receipt hash / sequence:

```txt
TBD
```

Verified:

- [ ] receipt exists;
- [ ] receipt is attached to the resolved obligation;
- [ ] board shows receipt-backed closure.

## Claim

AutoKirk successfully activated one controlled design-partner workflow by closing one real governed obligation through proof and producing one receipt-backed terminal record.

## Non-claims

This proof does not claim:

- broad self-serve readiness;
- enterprise readiness;
- compliance certification;
- legal-proof status;
- audit-proof status;
- third-party security validation;
- generic workflow-suite replacement;
- CRM replacement;
- vertical-specific product readiness;
- AI-agent orchestration readiness.

## Next allowed move

After this seal, the next allowed move is one of:

1. repeat the same workflow for the same partner;
2. activate one second workflow only if the first receipt-backed closure was stable;
3. activate one second controlled design partner only after tenant visibility remains clean.

Do not expand product surface before receipt evidence compounds.
