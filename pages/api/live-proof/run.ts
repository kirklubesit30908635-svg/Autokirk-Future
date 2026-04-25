import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { serialize } from "cookie";
import { createClient } from "@supabase/supabase-js";

const WORKSPACE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

type JsonRecord = Record<string, unknown>;

type IngestResult = {
  source_event_id: string;
  entity_id: string;
  obligation: {
    obligation_id: string;
  };
};

type ResolveResult = {
  event_id: string;
  receipt_id: string;
};

type LifecycleRow = {
  lifecycle_state: string;
  entity_id: string | null;
  receipt_entity_id: string | null;
};

type MarineServiceRecord = {
  boat_name: string;
  customer_name: string;
  service_event: string;
  proof_note: string;
  proof_photo_url: string | null;
};

type ApiResponse =
  | {
      ok: true;
      event: JsonRecord;
      obligation: JsonRecord;
      resolution: JsonRecord;
      receipt: JsonRecord;
      service_record: MarineServiceRecord;
      lifecycle_state: string;
      entity_id: string | null;
      receipt_entity_id: string | null;
    }
  | {
      ok: false;
      error: string;
    };

class RequestValidationError extends Error {}

function assertEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`${name}_REQUIRED`);
  }

  return value;
}

function asRecord(value: unknown, name: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name}_INVALID`);
  }

  return value as JsonRecord;
}

function requireTrimmedString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new RequestValidationError(`${name}_REQUIRED`);
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

function parseMarineServiceRecord(body: unknown): MarineServiceRecord {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestValidationError("REQUEST_BODY_INVALID");
  }

  const payload = body as Record<string, unknown>;
  const proofPhotoUrl = optionalTrimmedString(payload.proof_photo_url);

  if (proofPhotoUrl) {
    try {
      const parsedUrl = new URL(proofPhotoUrl);

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("INVALID_PROTOCOL");
      }
    } catch {
      throw new RequestValidationError("PROOF_PHOTO_URL_INVALID");
    }
  }

  return {
    boat_name: requireTrimmedString(payload.boat_name, "BOAT_NAME"),
    customer_name: requireTrimmedString(payload.customer_name, "CUSTOMER_NAME"),
    service_event: requireTrimmedString(payload.service_event, "SERVICE_EVENT"),
    proof_note: requireTrimmedString(payload.proof_note, "PROOF_NOTE"),
    proof_photo_url: proofPhotoUrl,
  };
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
    const authHeader = req.headers.authorization;
    const accessToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;

    const {
      data: { user },
      error: userError,
    } = accessToken
      ? await serviceSupabase.auth.getUser(accessToken)
      : await userSupabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ ok: false, error: "NOT_AUTHENTICATED" });
    }

    const { data: membership, error: membershipError } = await serviceSupabase
      .schema("core")
      .from("workspace_members")
      .select("workspace_id,user_id")
      .eq("workspace_id", WORKSPACE_ID)
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

    const serviceRecord = parseMarineServiceRecord(req.body);
    const runId = `marine-service-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const { data: ingestRaw, error: ingestError } = await serviceSupabase
      .schema("api")
      .rpc("ingest_event_to_obligation", {
        p_workspace_id: WORKSPACE_ID,
        p_actor_id: user.id,
        p_source_system: "marine-service-board",
        p_source_event_key: runId,
        p_source_event_type: "marine.service_started",
        p_payload: {
          operator_surface: "homepage",
          run_id: runId,
          service_type: "marine_service",
          boat_name: serviceRecord.boat_name,
          customer_name: serviceRecord.customer_name,
          service_event: serviceRecord.service_event,
          proof_note: serviceRecord.proof_note,
          proof_photo_url: serviceRecord.proof_photo_url,
        },
        p_obligation_code: "fulfill_service_with_proof",
      });

    if (ingestError) {
      throw new Error(ingestError.message);
    }

    const ingest = asRecord(ingestRaw, "INGEST_RESULT") as unknown as IngestResult;
    const obligationId = ingest.obligation?.obligation_id;
    const sourceEventId = ingest.source_event_id;

    if (!obligationId || !sourceEventId) {
      throw new Error("INGEST_RESULT_INCOMPLETE");
    }

    const { data: resolveRaw, error: resolveError } = await serviceSupabase
      .schema("api")
      .rpc("resolve_with_proof", {
        p_obligation_id: obligationId,
        p_actor_id: user.id,
        p_reason: "service proof submitted",
        p_evidence_present: {
          source: "marine-service-board",
          run_id: runId,
          proof_type: "operator_attestation",
          boat_name: serviceRecord.boat_name,
          customer_name: serviceRecord.customer_name,
          service_event: serviceRecord.service_event,
          note: serviceRecord.proof_note,
          photo_url: serviceRecord.proof_photo_url,
        },
        p_failed_checks: [],
        p_rule_version: "marine-service-proof-v1",
        p_idempotency_key: `${runId}-resolve`,
      });

    if (resolveError) {
      throw new Error(resolveError.message);
    }

    const resolve = asRecord(
      resolveRaw,
      "RESOLVE_RESULT"
    ) as unknown as ResolveResult;

    const [eventResult, obligationResult, resolutionResult, receiptResult, lifecycleResult] =
      await Promise.all([
        serviceSupabase
          .schema("ingest")
          .from("source_events")
          .select("*")
          .eq("id", sourceEventId)
          .single(),
        serviceSupabase
          .schema("core")
          .from("obligations")
          .select("*")
          .eq("id", obligationId)
          .single(),
        serviceSupabase
          .schema("ledger")
          .from("events")
          .select("*")
          .eq("id", resolve.event_id)
          .single(),
        serviceSupabase
          .schema("receipts")
          .from("receipts")
          .select("*")
          .eq("id", resolve.receipt_id)
          .single(),
        serviceSupabase
          .schema("projection")
          .from("obligation_lifecycle")
          .select("lifecycle_state, entity_id, receipt_entity_id")
          .eq("obligation_id", obligationId)
          .single(),
      ]);

    const queryError =
      eventResult.error ||
      obligationResult.error ||
      resolutionResult.error ||
      receiptResult.error ||
      lifecycleResult.error;

    if (queryError) {
      throw new Error(queryError.message);
    }

    const lifecycle = lifecycleResult.data as LifecycleRow;

    return res.status(200).json({
      ok: true,
      event: asRecord(eventResult.data, "EVENT"),
      obligation: asRecord(obligationResult.data, "OBLIGATION"),
      resolution: asRecord(resolutionResult.data, "RESOLUTION"),
      receipt: asRecord(receiptResult.data, "RECEIPT"),
      service_record: serviceRecord,
      lifecycle_state: lifecycle.lifecycle_state,
      entity_id: lifecycle.entity_id,
      receipt_entity_id: lifecycle.receipt_entity_id,
    });
  } catch (err) {
    const statusCode = err instanceof RequestValidationError ? 400 : 500;

    return res.status(statusCode).json({
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : "UNKNOWN_ERROR",
    });
  }
}
