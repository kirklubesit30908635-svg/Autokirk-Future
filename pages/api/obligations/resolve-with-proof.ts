import { createHash } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient } from "@supabase/ssr";
import { serialize } from "cookie";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

type ResolveExistingObligationSuccess = {
  ok: true;
  obligation: JsonRecord;
  resolution: JsonRecord;
  receipt: JsonRecord;
  lifecycle_state: string;
  entity_id: string | null;
  receipt_entity_id: string | null;
  replayed: boolean;
};

type ResolveExistingObligationFailure = {
  ok: false;
  error: string;
};

type LifecycleRow = {
  lifecycle_state: string;
  entity_id: string | null;
  receipt_entity_id: string | null;
};

type ApiResponse =
  | ResolveExistingObligationSuccess
  | ResolveExistingObligationFailure;

class RequestValidationError extends Error {}

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

function asRecord(value: unknown, name: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name}_INVALID`);
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

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildIdempotencyKey(payload: {
  obligationId: string;
  proofNote: string;
  proofPhotoUrl: string | null;
  reason: string;
}): string {
  const digest = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  return `system-proof-board-${digest}`;
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

    const obligationId = requireTrimmedString(
      requestBody.obligation_id,
      "OBLIGATION_ID_REQUIRED"
    );
    const proofNote = requireTrimmedString(
      requestBody.proof_note,
      "PROOF_NOTE_REQUIRED"
    );
    const proofPhotoUrl = optionalTrimmedString(requestBody.proof_photo_url);
    const reason =
      optionalTrimmedString(requestBody.reason) ??
      "operator proof submitted from system proof board";

    if (proofPhotoUrl && !isValidHttpUrl(proofPhotoUrl)) {
      throw new RequestValidationError("PROOF_PHOTO_URL_INVALID");
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

    const { data: obligation, error: obligationError } = await serviceSupabase
      .schema("core")
      .from("obligations")
      .select("id, workspace_id, obligation_code, entity_id")
      .eq("id", obligationId)
      .maybeSingle();

    if (obligationError) {
      throw new Error(obligationError.message);
    }

    if (!obligation) {
      return res.status(404).json({ ok: false, error: "OBLIGATION_NOT_FOUND" });
    }

    const { data: membership, error: membershipError } = await serviceSupabase
      .schema("core")
      .from("workspace_members")
      .select("workspace_id,user_id")
      .eq("workspace_id", obligation.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      return res.status(500).json({
        ok: false,
        error: `MEMBERSHIP_LOOKUP_FAILED: ${membershipError.message}`,
      });
    }

    if (!membership) {
      return res.status(403).json({
        ok: false,
        error: "INVALID_WORKSPACE_ACCESS",
      });
    }

    const idempotencyKey = buildIdempotencyKey({
      obligationId,
      proofNote,
      proofPhotoUrl,
      reason,
    });

    const { data: resolveRaw, error: resolveError } = await serviceSupabase
      .schema("api")
      .rpc("resolve_with_proof", {
        p_obligation_id: obligationId,
        p_actor_id: user.id,
        p_reason: reason,
        p_evidence_present: {
          source: "system-proof-board",
          obligation_code: obligation.obligation_code,
          proof_note: proofNote,
          proof_photo_url: proofPhotoUrl,
        },
        p_failed_checks: [],
        p_rule_version: "system-proof-board-v1",
        p_idempotency_key: idempotencyKey,
      });

    if (resolveError) {
      throw new Error(resolveError.message);
    }

    const resolution = asRecord(resolveRaw, "RESOLUTION_RESULT");
    const receiptId = resolution.receipt_id;

    if (typeof receiptId !== "string" || !receiptId.trim()) {
      throw new Error("RESOLUTION_RESULT_INCOMPLETE");
    }

    const [obligationResult, receiptResult, lifecycleResult] = await Promise.all([
      serviceSupabase
        .schema("core")
        .from("obligations")
        .select("*")
        .eq("id", obligationId)
        .single(),
      serviceSupabase
        .schema("receipts")
        .from("receipts")
        .select("*")
        .eq("id", receiptId)
        .single(),
      serviceSupabase
        .schema("projection")
        .from("obligation_lifecycle")
        .select("lifecycle_state, entity_id, receipt_entity_id")
        .eq("obligation_id", obligationId)
        .single(),
    ]);

    const queryError =
      obligationResult.error || receiptResult.error || lifecycleResult.error;

    if (queryError) {
      throw new Error(queryError.message);
    }

    const lifecycle = lifecycleResult.data as LifecycleRow;

    return res.status(200).json({
      ok: true,
      obligation: asRecord(obligationResult.data, "OBLIGATION"),
      resolution,
      receipt: asRecord(receiptResult.data, "RECEIPT"),
      lifecycle_state: lifecycle.lifecycle_state,
      entity_id: lifecycle.entity_id,
      receipt_entity_id: lifecycle.receipt_entity_id,
      replayed: Boolean(resolution.replayed),
    });
  } catch (err) {
    const statusCode = err instanceof RequestValidationError ? 400 : 500;

    return res.status(statusCode).json({
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : "UNKNOWN_ERROR",
    });
  }
}
