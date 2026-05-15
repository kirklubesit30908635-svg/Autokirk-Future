type JsonRecord = Record<string, unknown>;

export type GovernedCompletionProofInput = {
  sourceEvent: JsonRecord | null | undefined;
  obligation: JsonRecord | null | undefined;
  resolutionEvent: JsonRecord | null | undefined;
  receipt: JsonRecord | null | undefined;
  lifecycleState: string | null | undefined;
  lifecycleEntityId: string | null | undefined;
  lifecycleReceiptEntityId: string | null | undefined;
};

export type GovernedCompletionProof = {
  execution_happened: boolean;
  was_governed: boolean;
  completed_without_drift: boolean;
  receipt_produced: boolean;
  claim: "governed_completion_proven" | "governed_completion_not_proven";
  checks: {
    source_event_recorded: boolean;
    obligation_recorded: boolean;
    obligation_resolved: boolean;
    proof_accepted: boolean;
    resolution_event_recorded: boolean;
    receipt_recorded: boolean;
    receipt_targets_obligation: boolean;
    ledger_targets_obligation: boolean;
    lifecycle_resolved: boolean;
    entity_consistent: boolean;
  };
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function recordId(record: JsonRecord | null | undefined): string | null {
  return asString(record?.id);
}

function recordField(record: JsonRecord | null | undefined, field: string): string | null {
  return asString(record?.[field]);
}

export function deriveGovernedCompletionProof(
  input: GovernedCompletionProofInput
): GovernedCompletionProof {
  const sourceEventId = recordId(input.sourceEvent);
  const obligationId = recordId(input.obligation);
  const resolutionEventId = recordId(input.resolutionEvent);
  const receiptId = recordId(input.receipt);

  const obligationStatus = recordField(input.obligation, "status");
  const obligationProofStatus = recordField(input.obligation, "proof_status");
  const obligationEntityId = recordField(input.obligation, "entity_id");
  const sourceEntityId = recordField(input.sourceEvent, "entity_id");
  const receiptEntityId = recordField(input.receipt, "entity_id");

  const receiptObligationId = recordField(input.receipt, "obligation_id");
  const resolutionObligationId = recordField(input.resolutionEvent, "obligation_id");

  const checks = {
    source_event_recorded: Boolean(sourceEventId),
    obligation_recorded: Boolean(obligationId),
    obligation_resolved: obligationStatus === "resolved",
    proof_accepted: obligationProofStatus === "sufficient",
    resolution_event_recorded: Boolean(resolutionEventId),
    receipt_recorded: Boolean(receiptId),
    receipt_targets_obligation: Boolean(
      obligationId && receiptObligationId && obligationId === receiptObligationId
    ),
    ledger_targets_obligation: Boolean(
      obligationId && resolutionObligationId && obligationId === resolutionObligationId
    ),
    lifecycle_resolved: input.lifecycleState === "resolved",
    entity_consistent: Boolean(
      obligationEntityId &&
        sourceEntityId &&
        receiptEntityId &&
        input.lifecycleEntityId &&
        input.lifecycleReceiptEntityId &&
        obligationEntityId === sourceEntityId &&
        obligationEntityId === receiptEntityId &&
        obligationEntityId === input.lifecycleEntityId &&
        obligationEntityId === input.lifecycleReceiptEntityId
    ),
  };

  const execution_happened = checks.source_event_recorded && checks.resolution_event_recorded;
  const was_governed =
    checks.obligation_recorded && checks.obligation_resolved && checks.proof_accepted;
  const completed_without_drift =
    checks.receipt_targets_obligation &&
    checks.ledger_targets_obligation &&
    checks.lifecycle_resolved &&
    checks.entity_consistent;
  const receipt_produced = checks.receipt_recorded && checks.receipt_targets_obligation;
  const proven =
    execution_happened && was_governed && completed_without_drift && receipt_produced;

  return {
    execution_happened,
    was_governed,
    completed_without_drift,
    receipt_produced,
    claim: proven ? "governed_completion_proven" : "governed_completion_not_proven",
    checks,
  };
}
