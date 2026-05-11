import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient } from "@supabase/ssr";
import { serialize } from "cookie";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

type IntakeSuccess = {
  ok: true;
  source_event_id: string | null;
  obligation_id: string | null;
  obligation: JsonRecord;
};

type IntakeFailure = {
  ok: false;
  error: string;
};

type ApiResponse = IntakeSuccess | IntakeFailure;

class RequestValidationError extends Error {}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function assertEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`${name}_REQUIRED`);
  }

  return value;
}

function appendSetCookie(res: NextApiResponse, cookie: string) {
  const existing = res.getHeader("Set-Cookie");
  const cookies = existing
    ? Array.isArray(existing)
      ? existing
      : [String(existing)]
    : [];

  res.setHeader("Set-Cookie", [...cookies, cookie]);
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

function requireUuid(value: unknown, errorCode: string): string {
  const trimmed = requireTrimmedString(value, errorCode);

  if (!UUID_PATTERN.test(trimmed)) {
    throw new RequestValidationError(errorCode);
  }

  return trimmed;
}

function asRecord(value: unknown, name: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name}_INVALID`);
  }

  return value as JsonRecord;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function sanitizeObligationCode(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  const collapsed = normalized.replace(/_+/g, "_").replace(/^_+|_+$/g, "");

  if (!collapsed) {
    throw new RequestValidationError("OBLIGATION_CODE_REQUIRED");
  }

  if (collapsed === "unclassified") {
    throw new RequestValidationError("OBLIGATION_CODE_UNCLASSIFIED_NOT_ALLOWED");
  }

  return collapsed.slice(0, 80);
}

function buildSourceEventKey(payload: {
  workspaceId: string;
  obligationCode: string;
  promise: string;
}): string {
  return `intake:${payload.workspaceId}:${payload.obligationCode}:${randomUUID()}`;
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
    const url = assertEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    const anonKey = assertEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const key = assertEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const requestBody =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : null;

    if (!requestBody) {
      throw new RequestValidationError("REQUEST_BODY_INVALID");
    }

    const workspaceId = requireUuid(requestBody.workspace_id, "WORKSPACE_ID_INVALID");
    const obligationCode = sanitizeObligationCode(
      requireTrimmedString(requestBody.obligation_code, "OBLIGATION_CODE_REQUIRED")
    );
    const promise = requireTrimmedString(requestBody.promise, "PROMISE_REQUIRED");
    const proofRequired = requireTrimmedString(
      requestBody.proof_required,
      "PROOF_REQUIRED_DESCRIPTION_REQUIRED"
    );
    const dueAt = optionalTrimmedString(requestBody.due_at);

    if (dueAt && Number.isNaN(new Date(dueAt).getTime())) {
      throw new RequestValidationError("DUE_AT_INVALID");
    }

    const userSupabase = createServerClient(url, anonKey, {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          appendSetCookie(
            res,
            serialize(name, value, { path: "/", ...options })
          );
        },
        remove(name, options) {
          appendSetCookie(
            res,
            serialize(name, "", { path: "/", maxAge: 0, ...options })
          );
        },
      },
    });
    const serviceSupabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ ok: false, error: "NOT_AUTHENTICATED" });
    }

    const { data: membership, error: membershipError } = await serviceSupabase
      .schema("core")
      .from("workspace_members")
      .select("workspace_id,user_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      return res.status(500).json({
        ok: false,
        error: `MEMBERSHIP_LOOKUP_FAILED: ${membershipError.message}`,
      });
    }

    if (!membership) {
      return res.status(403).json({ ok: false, error: "INVALID_WORKSPACE_ACCESS" });
    }

    const sourceEventKey = buildSourceEventKey({
      workspaceId,
      obligationCode,
      promise,
    });

    const { data: intakeRaw, error: intakeError } = await serviceSupabase
      .schema("api")
      .rpc("ingest_event_to_obligation", {
        p_workspace_id: workspaceId,
        p_actor_id: user.id,
        p_source_system: "intake",
        p_source_event_key: sourceEventKey,
        p_source_event_type: "customer_obligation_defined",
        p_payload: {
          source: "customer-board-intake",
          promise,
          proof_required: proofRequired,
          due_at: dueAt,
        },
        p_occurred_at: new Date().toISOString(),
        p_obligation_code: obligationCode,
      });

    if (intakeError) {
      throw new Error(intakeError.message);
    }

    const intake = asRecord(intakeRaw, "INTAKE_RESULT");
    const obligation = asRecord(intake.obligation, "OBLIGATION_RESULT");

    return res.status(200).json({
      ok: true,
      source_event_id: asNullableString(intake.source_event_id),
      obligation_id: asNullableString(obligation.obligation_id),
      obligation,
    });
  } catch (err) {
    const statusCode = err instanceof RequestValidationError ? 400 : 500;

    return res.status(statusCode).json({
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : "UNKNOWN_ERROR",
    });
  }
}
