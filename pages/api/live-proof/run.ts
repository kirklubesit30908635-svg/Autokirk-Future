import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const WORKSPACE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ACTOR_ID = "11111111-1111-1111-1111-111111111111";

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

type ApiResponse =
  | {
      ok: true;
      event: JsonRecord;
      obligation: JsonRecord;
      resolution: JsonRecord;
      receipt: JsonRecord;
      lifecycle_state: string;
      entity_id: string | null;
      receipt_entity_id: string | null;
    }
  | {
      ok: false;
      error: string;
    };

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
    const key = assertEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const runId = `live-proof-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const { data: ingestRaw, error: ingestError } = await supabase
      .schema("api")
      .rpc("ingest_event_to_obligation", {
        p_workspace_id: WORKSPACE_ID,
        p_actor_id: ACTOR_ID,
        p_source_system: "live-proof-ui",
        p_source_event_key: runId,
        p_source_event_type: "autokirk.live_proof_requested",
        p_payload: {
          runner: "homepage",
          run_id: runId,
        },
        p_obligation_code: "autokirk_live_proof",
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

    const { data: resolveRaw, error: resolveError } = await supabase
      .schema("api")
      .rpc("resolve_obligation", {
        p_obligation_id: obligationId,
        p_actor_id: ACTOR_ID,
        p_resolution_type: "resolve_with_proof",
        p_reason: "live proof completed",
        p_evidence_present: {
          source: "autokirk-live-proof",
          run_id: runId,
          proof: "homepage initiated canonical lifecycle run",
        },
        p_failed_checks: [],
        p_rule_version: "live-proof-v1",
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
        supabase
          .schema("ingest")
          .from("source_events")
          .select("*")
          .eq("id", sourceEventId)
          .single(),
        supabase
          .schema("core")
          .from("obligations")
          .select("*")
          .eq("id", obligationId)
          .single(),
        supabase
          .schema("ledger")
          .from("events")
          .select("*")
          .eq("id", resolve.event_id)
          .single(),
        supabase
          .schema("receipts")
          .from("receipts")
          .select("*")
          .eq("id", resolve.receipt_id)
          .single(),
        supabase
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
      lifecycle_state: lifecycle.lifecycle_state,
      entity_id: lifecycle.entity_id,
      receipt_entity_id: lifecycle.receipt_entity_id,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : "UNKNOWN_ERROR",
    });
  }
}
