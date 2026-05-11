export type ProofScenarioId = "universal_obligation";
export type ProofScenarioRecordValue = string | null;
export type ProofScenarioRecord = Record<string, ProofScenarioRecordValue>;
export type ProofScenarioDraft = Record<string, string>;

export type ProofScenarioFieldConfig = {
  draftKey: string;
  recordKey: string;
  label: string;
  placeholder: string;
  required: boolean;
  requiredError?: string;
  multiline?: boolean;
  fullWidth?: boolean;
  defaultValue?: string;
  resultLabel: string;
  emptyResultValue?: string;
};

export type ProofScenarioConfig = {
  id: ProofScenarioId;
  enabled: boolean;
  run: {
    resultStorageKey: string;
    sourceSystem: string;
    operatorSurface: string;
    serviceType: string;
    eventType: string;
    obligationCode: string;
    proofType: string;
    resolutionReason: string;
    ruleVersion: string;
    runIdPrefix: string;
    requiredProofRecordKeys: readonly string[];
  };
  ui: {
    selectorLabel: string;
    sectionLabel: string;
    sectionDescription: string;
    lifecycleStartLabel: string;
    lifecycleOpenLabel: string;
    operatorDescription: string;
    signInRequiredMessage: string;
    signInSendingMessage: string;
    signInCheckEmailMessage: string;
    recordEyebrow: string;
    recordTitle: string;
    recordDescription: string;
    proofDescription: string;
    idleMessage: string;
    runningMessage: string;
    successMessage: string;
    restoredMessage: string;
    submitLabel: string;
    submittingLabel: string;
    resultTitle: string;
    operatorEmailPlaceholder: string;
  };
  fields: readonly ProofScenarioFieldConfig[];
};

const universalObligationFields = [
  {
    draftKey: "obligationLabel",
    recordKey: "obligation_label",
    label: "Obligation",
    placeholder: "Send monthly proof packet",
    required: true,
    requiredError: "OBLIGATION_LABEL_REQUIRED",
    resultLabel: "OBLIGATION",
  },
  {
    draftKey: "responsibleParty",
    recordKey: "responsible_party",
    label: "Responsible Party",
    placeholder: "Operations team",
    required: true,
    requiredError: "RESPONSIBLE_PARTY_REQUIRED",
    resultLabel: "RESPONSIBLE PARTY",
  },
  {
    draftKey: "proofReference",
    recordKey: "proof_reference",
    label: "Proof Reference",
    placeholder: "Customer-visible delivery link or receipt reference",
    required: true,
    requiredError: "PROOF_REFERENCE_REQUIRED",
    resultLabel: "PROOF REFERENCE",
  },
  {
    draftKey: "proofPhotoUrl",
    recordKey: "proof_photo_url",
    label: "Proof URL (Optional)",
    placeholder: "https://example.com/proof-artifact",
    required: false,
    resultLabel: "PROOF URL",
    emptyResultValue: "NOTE ONLY",
  },
  {
    draftKey: "proofNote",
    recordKey: "proof_note",
    label: "Proof Note",
    placeholder: "Obligation completed and evidence is attached to the receipt.",
    required: true,
    requiredError: "PROOF_NOTE_REQUIRED",
    multiline: true,
    fullWidth: true,
    defaultValue: "Obligation completed and evidence is attached to the receipt.",
    resultLabel: "PROOF NOTE",
  },
] as const satisfies readonly ProofScenarioFieldConfig[];

export const proofScenarios = {
  universal_obligation: {
    id: "universal_obligation",
    enabled: true,
    run: {
      resultStorageKey: "autokirk-universal-proof-result",
      sourceSystem: "universal-obligation-board",
      operatorSurface: "universal-board",
      serviceType: "universal_obligation",
      eventType: "obligation.intake_defined",
      obligationCode: "resolve_obligation_with_proof",
      proofType: "operator_attestation",
      resolutionReason: "obligation proof submitted",
      ruleVersion: "universal-obligation-proof-v1",
      runIdPrefix: "universal-obligation",
      requiredProofRecordKeys: ["proof_note", "proof_reference"],
    },
    ui: {
      selectorLabel: "Universal Obligation",
      sectionLabel: "Obligation Resolution",
      sectionDescription:
        "An obligation stays unresolved until proof or failure is explicitly recorded by the kernel.",
      lifecycleStartLabel: "OBLIGATION INTAKE",
      lifecycleOpenLabel: "GOVERNED OBLIGATION OPENED",
      operatorDescription:
        "Proof can only be submitted by an authenticated workspace operator.",
      signInRequiredMessage:
        "Sign in as a workspace operator to submit proof.",
      signInSendingMessage: "Sending operator sign-in link...",
      signInCheckEmailMessage: "Check your email for the operator sign-in link.",
      recordEyebrow: "Obligation Record",
      recordTitle: "Submit Proof To Resolve Obligation",
      recordDescription:
        "Capture one governed obligation: what is owed, who is responsible, the proof reference, proof note, and optional proof URL, then emit the receipt-backed resolution.",
      proofDescription:
        "The proof note and reference are attached to the receipt. A URL can be added when the evidence lives outside AutoKirk.",
      idleMessage:
        "Record the obligation and proof to resolve it through the governed kernel path.",
      runningMessage:
        "Submitting the obligation record through the kernel...",
      successMessage:
        "Obligation resolved. Reloading projection truth from the live read model...",
      restoredMessage:
        "Obligation record resolved through kernel authority. Projection truth has been reloaded.",
      submitLabel: "SUBMIT OBLIGATION PROOF",
      submittingLabel: "SUBMITTING PROOF...",
      resultTitle: "Latest Obligation Result",
      operatorEmailPlaceholder: "operator@autokirk.com",
    },
    fields: universalObligationFields,
  },
} as const satisfies Record<ProofScenarioId, ProofScenarioConfig>;

export const activeProofScenario = proofScenarios.universal_obligation;
export const enabledProofScenarios = Object.values(proofScenarios).filter(
  (scenario) => scenario.enabled
);

export function getProofScenario(id?: string | null): ProofScenarioConfig {
  if (!id) {
    return activeProofScenario;
  }

  const scenario = proofScenarios[id as ProofScenarioId];

  if (!scenario || !scenario.enabled) {
    throw new Error("SCENARIO_ID_INVALID");
  }

  return scenario;
}

export function createProofScenarioDraft(
  scenario: ProofScenarioConfig = activeProofScenario
): ProofScenarioDraft {
  const draft: ProofScenarioDraft = {};

  for (const field of scenario.fields) {
    draft[field.draftKey] = field.defaultValue ?? "";
  }

  return draft;
}

export function toProofScenarioDraft(
  record?: ProofScenarioRecord,
  scenario: ProofScenarioConfig = activeProofScenario
): ProofScenarioDraft {
  if (!record) {
    return createProofScenarioDraft(scenario);
  }

  const draft: ProofScenarioDraft = {};

  for (const field of scenario.fields) {
    const value = record[field.recordKey];
    draft[field.draftKey] = typeof value === "string" ? value : value ?? "";
  }

  return draft;
}

export function toProofScenarioPayload(
  draft: ProofScenarioDraft,
  scenario: ProofScenarioConfig = activeProofScenario
): ProofScenarioRecord {
  const payload: ProofScenarioRecord = {};

  for (const field of scenario.fields) {
    const value = draft[field.draftKey].trim();
    payload[field.recordKey] = field.recordKey === "proof_photo_url" ? value || null : value;
  }

  return payload;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getProofScenarioDraftError(
  draft: ProofScenarioDraft,
  scenario: ProofScenarioConfig = activeProofScenario
): string | null {
  for (const field of scenario.fields) {
    const value = draft[field.draftKey]?.trim() ?? "";

    if (field.required && !value) {
      return field.requiredError ?? `${field.recordKey.toUpperCase()}_REQUIRED`;
    }
  }

  const proofPhotoField = scenario.fields.find(
    (field) => field.recordKey === "proof_photo_url"
  );

  if (!proofPhotoField) {
    return null;
  }

  const proofPhotoUrl = draft[proofPhotoField.draftKey]?.trim() ?? "";

  if (proofPhotoUrl && !isValidHttpUrl(proofPhotoUrl)) {
    return "PROOF_PHOTO_URL_INVALID";
  }

  for (const requiredRecordKey of scenario.run.requiredProofRecordKeys) {
    const field = scenario.fields.find((entry) => entry.recordKey === requiredRecordKey);

    if (!field) {
      continue;
    }

    const value = draft[field.draftKey]?.trim() ?? "";

    if (!value) {
      return "Resolution blocked: proof required.";
    }
  }

  return null;
}

export function getProofScenarioResultValue(
  field: ProofScenarioFieldConfig,
  record?: ProofScenarioRecord
): string {
  const value = record?.[field.recordKey];

  if (typeof value === "string" && value) {
    return value;
  }

  return field.emptyResultValue ?? "—";
}

export function buildProofScenarioEvidence(
  record: ProofScenarioRecord
): Record<string, string | null> {
  const evidence: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(record)) {
    if (key === "proof_note") {
      evidence.note = value;
      continue;
    }

    if (key === "proof_photo_url") {
      evidence.artifact_url = value;
      continue;
    }

    evidence[key] = value;
  }

  return evidence;
}
