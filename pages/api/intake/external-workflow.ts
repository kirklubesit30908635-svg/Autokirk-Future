import { createHash, timingSafeEqual } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

type ExternalWorkflowIntakeSuccess = {
  ok: true;
  source_event_id: string;
  entity_id: string | null;
  obligation_id: string;
  replayed: boolean;
  board_hint: string;
};

type ExternalWorkflowIntakeFailure = {
  ok: false;
  error: string;
};

type ApiResponse = ExternalWorkflowIntakeSuccess | ExternalWorkflowIntakeFailure;

class RequestValidationError extends Error {}

function assertEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`${name}_REQUIRED`);
  }

  return value;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function authorize(req: NextApiRequest): void {
  const configuredSecret = assertEnv(
    "AUTOKIRK_EXTERNAL_INTAKE_SECRET",
    process.env.AUTOKIRK_EXTERNAL_INTAKE_SECRET
  );
  const provided = req.headers["x-autokirk-intake-secret"];
  const providedSecret = Array.isArray(provided) ? provided[0] : provided;

  if (!providedSecret || !safeEqual(providedSecret, configuredSecret)) {
    throw new RequestValidationError("INTAKE_SECRET_INVALID");
  }
}

function asRequestBody(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("REQUEST_BODY_INVALID");
  }

  return value as JsonRecord;
}

function requireTrimmedString(value: unknown, errorCode: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new RequestValidationError(errorCode);
  }

  return value.trim();
}

function optionalTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalRecord(value: unknown): JsonRecord {
  if (typeof value === "undefined" || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("PAYLOAD_INVALID");
  }

  return value as JsonRecord;
}

function buildSourceEventKey(input: {
  sourceSystem: string;
  sourceEventType: string;
  subject: string | null;
  payload: JsonRecord;
}): string {
  const digest = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");

  return `external-${input.sourceSystem}-${digest}`;
}

function extractObligationId(result: JsonRecord): string {
  const obligation = result.obligation;
  if (!obligation || typeof obligation !== "object" || Array.isArray(obligation)) {
    throw new Error("INGEST_RESULT_OBLIGATION_INVALID");
  }

  const obligationId = (obligation as JsonRecord).obligation_id;
  if (typeof obligationId !== "string" || !obligationId.trim()) {
    throw new Error("INGEST_RESULT_OBLIGATION_ID_REQUIRED");
  }

  return obligationId;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    authorize(req);

    const url = assertEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    const key = assertEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = asRequestBody(req.body);
    const workspaceId = requireTrimmedString(body.workspace_id, "WORKSPACE_ID_REQUIRED");
    const actorId = requireTrimmedString(body.actor_id, "ACTOR_ID_REQUIRED");
    const sourceSystem = requireTrimmedString(body.source_system, "SOURCE_SYSTEM_REQUIRED");
    const sourceEventType = requireTrimmedString(
      body.source_event_type,
      "SOURCE_EVENT_TYPE_REQUIRED"
    );
    const payload = optionalRecord(body.payload);
    const subject = optionalTrimmedString(body.subject);
    const sourceEventKey =
      optionalTrimmedString(body.source_event_key) ??
      buildSourceEventKey({
        sourceSystem,
        sourceEventType,
        subject,
        payload,
      });
    const obligationCode =
      optionalTrimmedString(body.obligation_code) ?? "fulfill_promised_service";

    const serviceSupabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: ingestRaw, error: ingestError } = await serviceSupabase
      .schema("api")
      .rpc("ingest_event_to_obligation", {
        p_workspace_id: workspaceId,
        p_actor_id: actorId,
        p_source_system: sourceSystem,
        p_source_event_key: sourceEventKey,
        p_source_event_type: sourceEventType,
        p_payload: {
          intake_surface: "external-workflow",
          subject,
          ...payload,
        },
        p_occurred_at: new Date().toISOString(),
        p_obligation_code: obligationCode,
      });

    if (ingestError) {
      throw new Error(ingestError.message);
    }

    if (!ingestRaw || typeof ingestRaw !== "object" || Array.isArray(ingestRaw)) {
      throw new Error("INGEST_RESULT_INVALID");
    }

    const ingest = ingestRaw as JsonRecord;
    const sourceEventId = requireTrimmedString(
      ingest.source_event_id,
      "INGEST_SOURCE_EVENT_ID_REQUIRED"
    );
    const obligationId = extractObligationId(ingest);
    const entityId =
      typeof ingest.entity_id === "string" && ingest.entity_id.trim()
        ? ingest.entity_id
        : null;
    const replayed = Boolean((ingest.obligation as JsonRecord | undefined)?.replayed);

    return res.status(200).json({
      ok: true,
      source_event_id: sourceEventId,
      entity_id: entityId,
      obligation_id: obligationId,
      replayed,
      board_hint:
        "This external workflow item is now a governed obligation. It should appear on the tenant board until proof resolves it.",
    });
  } catch (err) {
    const statusCode = err instanceof RequestValidationError ? 400 : 500;

    return res.status(statusCode).json({
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : "UNKNOWN_ERROR",
    });
  }
}
