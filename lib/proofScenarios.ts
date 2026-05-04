export type ProofScenarioId = "marine_service" | "construction_task";
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

const marineServiceFields = [
  {
    draftKey: "boatName",
    recordKey: "boat_name",
    label: "Boat",
    placeholder: "Sea Ray 260 Sundancer",
    required: true,
    requiredError: "BOAT_NAME_REQUIRED",
    resultLabel: "BOAT",
  },
  {
    draftKey: "customerName",
    recordKey: "customer_name",
    label: "Customer",
    placeholder: "Jordan Ellis",
    required: true,
    requiredError: "CUSTOMER_NAME_REQUIRED",
    resultLabel: "CUSTOMER",
  },
  {
    draftKey: "serviceEvent",
    recordKey: "service_event",
    label: "Service Event",
    placeholder: "Hull wash and condition check",
    required: true,
    requiredError: "SERVICE_EVENT_REQUIRED",
    resultLabel: "SERVICE",
  },
  {
    draftKey: "proofPhotoUrl",
    recordKey: "proof_photo_url",
    label: "Proof Photo URL (Optional)",
    placeholder: "https://example.com/proof-photo.jpg",
    required: false,
    resultLabel: "PROOF PHOTO",
    emptyResultValue: "NOTE ONLY",
  },
  {
    draftKey: "proofNote",
    recordKey: "proof_note",
    label: "Proof Note",
    placeholder: "Hull washed, no visible damage",
    required: true,
    requiredError: "PROOF_NOTE_REQUIRED",
    multiline: true,
    fullWidth: true,
    defaultValue: "Hull washed, no visible damage",
    resultLabel: "PROOF NOTE",
  },
] as const satisfies readonly ProofScenarioFieldConfig[];

const constructionTaskFields = [
  {
    draftKey: "taskName",
    recordKey: "task_name",
    label: "Task Name",
    placeholder: "Punch list framing repair",
    required: true,
    requiredError: "TASK_NAME_REQUIRED",
    resultLabel: "TASK",
  },
  {
    draftKey: "location",
    recordKey: "location",
    label: "Location",
    placeholder: "Lot 12, north elevation",
    required: true,
    requiredError: "LOCATION_REQUIRED",
    resultLabel: "LOCATION",
  },
  {
    draftKey: "proofPhotoUrl",
    recordKey: "proof_photo_url",
    label: "Proof Photo URL",
    placeholder: "https://example.com/task-photo.jpg",
    required: true,
    requiredError: "PROOF_PHOTO_REQUIRED",
    resultLabel: "PROOF PHOTO",
  },
  {
    draftKey: "proofNote",
    recordKey: "proof_note",
    label: "Proof Note",
    placeholder: "Task completed, area cleaned, no defects observed",
    required: true,
    requiredError: "PROOF_NOTE_REQUIRED",
    multiline: true,
    fullWidth: true,
    defaultValue: "Task completed, area cleaned, no defects observed",
    resultLabel: "PROOF NOTE",
  },
] as const satisfies readonly ProofScenarioFieldConfig[];

export const proofScenarios = {
  marine_service: {
    id: "marine_service",
    enabled: true,
    run: {
      resultStorageKey: "autokirk-service-proof-result",
      sourceSystem: "marine-service-board",
      operatorSurface: "homepage",
      serviceType: "marine_service",
      eventType: "marine.service_started",
      obligationCode: "fulfill_service_with_proof",
      proofType: "operator_attestation",
      resolutionReason: "service proof submitted",
      ruleVersion: "marine-service-proof-v1",
      runIdPrefix: "marine-service",
      requiredProofRecordKeys: ["proof_note"],
    },
    ui: {
      selectorLabel: "Marine Service",
      sectionLabel: "Service Resolution",
      sectionDescription:
        "A service stays unresolved until operator proof or failure is explicitly recorded by the kernel.",
      lifecycleStartLabel: "SERVICE STARTED",
      lifecycleOpenLabel: "SERVICE OBLIGATION OPENED",
      operatorDescription:
        "Service proof can only be submitted by an authenticated workspace operator.",
      signInRequiredMessage:
        "Sign in as a workspace operator to submit service proof.",
      signInSendingMessage: "Sending operator sign-in link...",
      signInCheckEmailMessage: "Check your email for the operator sign-in link.",
      recordEyebrow: "Marine Record",
      recordTitle: "Submit Proof To Resolve Service",
      recordDescription:
        "Capture one real marine job record: boat, customer, service event, proof note, optional photo URL, then emit the receipt-backed resolution.",
      proofDescription:
        "Photo URL is optional; the note is always attached to the receipt.",
      idleMessage:
        "Record the boat, customer, service event, and proof to resolve the obligation.",
      runningMessage:
        "Submitting the marine service record through the kernel...",
      successMessage:
        "Marine service resolved. Reloading projection truth from the live read model...",
      restoredMessage:
        "Marine service record resolved through kernel authority. Projection truth has been reloaded.",
      submitLabel: "SUBMIT SERVICE PROOF",
      submittingLabel: "SUBMITTING PROOF...",
      resultTitle: "Latest Service Result",
      operatorEmailPlaceholder: "operator@autokirk.com",
    },
    fields: marineServiceFields,
  },
  construction_task: {
    id: "construction_task",
    enabled: true,
    run: {
      resultStorageKey: "autokirk-construction-proof-result",
      sourceSystem: "construction-task-board",
      operatorSurface: "homepage",
      serviceType: "construction_task",
      eventType: "construction.task_started",
      obligationCode: "complete_task_with_proof",
      proofType: "photo_attestation",
      resolutionReason: "construction task proof submitted",
      ruleVersion: "construction-task-proof-v1",
      runIdPrefix: "construction-task",
      requiredProofRecordKeys: ["proof_note", "proof_photo_url"],
    },
    ui: {
      selectorLabel: "Construction Task",
      sectionLabel: "Task Completion",
      sectionDescription:
        "A task stays unresolved until operator proof or failure is explicitly recorded by the kernel.",
      lifecycleStartLabel: "TASK STARTED",
      lifecycleOpenLabel: "TASK OBLIGATION OPENED",
      operatorDescription:
        "Task proof can only be submitted by an authenticated workspace operator.",
      signInRequiredMessage:
        "Sign in as a workspace operator to submit task proof.",
      signInSendingMessage: "Sending operator sign-in link...",
      signInCheckEmailMessage: "Check your email for the operator sign-in link.",
      recordEyebrow: "Construction Record",
      recordTitle: "Submit Proof To Complete Task",
      recordDescription:
        "Capture one construction task record: task name, location, proof note, and required photo URL, then emit the receipt-backed resolution.",
      proofDescription:
        "Photo URL is required for this proof contract and attached to the receipt.",
      idleMessage:
        "Record the task, location, and proof to resolve the obligation.",
      runningMessage:
        "Submitting the construction task record through the kernel...",
      successMessage:
        "Construction task resolved. Reloading projection truth from the live read model...",
      restoredMessage:
        "Construction task record resolved through kernel authority. Projection truth has been reloaded.",
      submitLabel: "SUBMIT TASK PROOF",
      submittingLabel: "SUBMITTING PROOF...",
      resultTitle: "Latest Task Result",
      operatorEmailPlaceholder: "operator@autokirk.com",
    },
    fields: constructionTaskFields,
  },
} as const satisfies Record<ProofScenarioId, ProofScenarioConfig>;

export const activeProofScenario = proofScenarios.marine_service;
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
      evidence.photo_url = value;
      continue;
    }

    evidence[key] = value;
  }

  return evidence;
}
