export type MarineServiceRecord = {
  boat_name: string;
  customer_name: string;
  service_event: string;
  proof_note: string;
  proof_photo_url: string | null;
};

export type MarineServiceDraft = {
  boatName: string;
  customerName: string;
  serviceEvent: string;
  proofNote: string;
  proofPhotoUrl: string;
};

export type MarineServiceDraftKey = keyof MarineServiceDraft;
export type MarineServiceRecordKey = keyof MarineServiceRecord;
type RequiredMarineServiceRecordKey = Exclude<
  MarineServiceRecordKey,
  "proof_photo_url"
>;

export type MarineServiceFieldConfig = {
  draftKey: MarineServiceDraftKey;
  recordKey: MarineServiceRecordKey;
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
  id: "marine_service";
  enabled: true;
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
  };
  ui: {
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
  fields: readonly MarineServiceFieldConfig[];
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
] as const satisfies readonly MarineServiceFieldConfig[];

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
    },
    ui: {
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
} as const satisfies Record<string, ProofScenarioConfig>;

export type ProofScenarioId = keyof typeof proofScenarios;

export const activeProofScenario = proofScenarios.marine_service;

export function createMarineServiceDraft(
  scenario: ProofScenarioConfig = activeProofScenario
): MarineServiceDraft {
  const draft = {} as MarineServiceDraft;

  for (const field of scenario.fields) {
    draft[field.draftKey] = field.defaultValue ?? "";
  }

  return draft;
}

export function toMarineServiceDraft(
  record?: MarineServiceRecord,
  scenario: ProofScenarioConfig = activeProofScenario
): MarineServiceDraft {
  if (!record) {
    return createMarineServiceDraft(scenario);
  }

  const draft = {} as MarineServiceDraft;

  for (const field of scenario.fields) {
    const value = record[field.recordKey];
    draft[field.draftKey] = typeof value === "string" ? value : value ?? "";
  }

  return draft;
}

export function toMarineServicePayload(
  draft: MarineServiceDraft,
  scenario: ProofScenarioConfig = activeProofScenario
): MarineServiceRecord {
  const payload = {} as MarineServiceRecord;

  for (const field of scenario.fields) {
    const value = draft[field.draftKey].trim();

    if (field.recordKey === "proof_photo_url") {
      payload.proof_photo_url = value || null;
      continue;
    }

    payload[field.recordKey as RequiredMarineServiceRecordKey] = value;
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

export function getMarineServiceDraftError(
  draft: MarineServiceDraft,
  scenario: ProofScenarioConfig = activeProofScenario
): string | null {
  for (const field of scenario.fields) {
    const value = draft[field.draftKey].trim();

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

  const proofPhotoUrl = draft[proofPhotoField.draftKey].trim();

  if (proofPhotoUrl && !isValidHttpUrl(proofPhotoUrl)) {
    return "PROOF_PHOTO_URL_INVALID";
  }

  return null;
}

export function getMarineServiceResultValue(
  field: MarineServiceFieldConfig,
  record?: MarineServiceRecord
): string {
  const value = record?.[field.recordKey];

  if (typeof value === "string" && value) {
    return value;
  }

  return field.emptyResultValue ?? "—";
}
