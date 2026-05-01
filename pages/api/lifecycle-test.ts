import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const WORKSPACE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TEST_ACTOR_ID = "00000000-0000-0000-0000-000000000001";

type ApiResponse =
  | {
      ok: true;
      lifecycle: string;
      steps: {
        ingest: { source_event_id: string; obligation_id: string };
        resolve: { event_id: string; receipt_id: string };
        verify: {
          obligation_status: string;
          lifecycle_state: string;
          receipt_exists: boolean;
          ledger_event_exists: boolean;
          source_event_exists: boolean;
        };
      };
    }
  | { ok: false; error: string; step?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const emitSecret = process.env.WATCHDOG_EMIT_SECRET;
  const authHeader = req.headers.authorization;
  if (!emitSecret || authHeader !== `Bearer ${emitSecret}`) {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res
      .status(500)
      .json({ ok: false, error: "SUPABASE_CONFIG_MISSING" });
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const runId = `lifecycle-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // --- STEP 1: INGEST ---
  const { data: ingestRaw, error: ingestError } = await sb
    .schema("api")
    .rpc("ingest_event_to_obligation", {
      p_workspace_id: WORKSPACE_ID,
      p_actor_id: TEST_ACTOR_ID,
      p_source_system: "lifecycle-test",
      p_source_event_key: runId,
      p_source_event_type: "marine.service_started",
      p_payload: {
        operator_surface: "lifecycle-test",
        run_id: runId,
        service_type: "marine_service",
        boat_name: "Test Vessel",
        customer_name: "Test Customer",
        service_event: "Hull wash lifecycle test",
        proof_note: "Lifecycle test proof note",
        proof_photo_url: null,
      },
      p_obligation_code: "fulfill_service_with_proof",
    });

  if (ingestError) {
    return res
      .status(500)
      .json({ ok: false, error: ingestError.message, step: "ingest" });
  }

  const ingest = ingestRaw as {
    source_event_id: string;
    entity_id: string;
    obligation: { obligation_id: string };
  };

  const obligationId = ingest?.obligation?.obligation_id;
  const sourceEventId = ingest?.source_event_id;

  if (!obligationId || !sourceEventId) {
    return res.status(500).json({
      ok: false,
      error: `INGEST_INCOMPLETE: got ${JSON.stringify(ingestRaw)}`,
      step: "ingest",
    });
  }

  // --- STEP 2: RESOLVE WITH PROOF ---
  const { data: resolveRaw, error: resolveError } = await sb
    .schema("api")
    .rpc("resolve_with_proof", {
      p_obligation_id: obligationId,
      p_actor_id: TEST_ACTOR_ID,
      p_reason: "lifecycle test proof submitted",
      p_evidence_present: {
        source: "lifecycle-test",
        run_id: runId,
        proof_type: "operator_attestation",
        note: "Lifecycle test proof note",
        photo_url: null,
        boat_name: "Test Vessel",
        customer_name: "Test Customer",
        service_event: "Hull wash lifecycle test",
      },
      p_failed_checks: [],
      p_rule_version: "lifecycle-test-v1",
      p_idempotency_key: `${runId}-resolve`,
    });

  if (resolveError) {
    return res
      .status(500)
      .json({ ok: false, error: resolveError.message, step: "resolve" });
  }

  const resolve = resolveRaw as { event_id: string; receipt_id: string };

  if (!resolve?.event_id || !resolve?.receipt_id) {
    return res.status(500).json({
      ok: false,
      error: `RESOLVE_INCOMPLETE: got ${JSON.stringify(resolveRaw)}`,
      step: "resolve",
    });
  }

  // --- STEP 3: VERIFY ALL ARTIFACTS ---
  const [obligationRes, lifecycleRes, receiptRes, ledgerRes, sourceRes] =
    await Promise.all([
      sb
        .schema("core")
        .from("obligations")
        .select("id, status")
        .eq("id", obligationId)
        .single(),
      sb
        .schema("projection")
        .from("obligation_lifecycle")
        .select("lifecycle_state")
        .eq("obligation_id", obligationId)
        .single(),
      sb
        .schema("receipts")
        .from("receipts")
        .select("id")
        .eq("id", resolve.receipt_id)
        .single(),
      sb
        .schema("ledger")
        .from("events")
        .select("id")
        .eq("id", resolve.event_id)
        .single(),
      sb
        .schema("ingest")
        .from("source_events")
        .select("id")
        .eq("id", sourceEventId)
        .single(),
    ]);

  const verifyError =
    obligationRes.error ||
    lifecycleRes.error ||
    receiptRes.error ||
    ledgerRes.error ||
    sourceRes.error;

  if (verifyError) {
    return res
      .status(500)
      .json({ ok: false, error: verifyError.message, step: "verify" });
  }

  const lifecycleState =
    (lifecycleRes.data as { lifecycle_state: string })?.lifecycle_state ??
    "UNKNOWN";

  return res.status(200).json({
    ok: true,
    lifecycle: lifecycleState,
    steps: {
      ingest: {
        source_event_id: sourceEventId,
        obligation_id: obligationId,
      },
      resolve: {
        event_id: resolve.event_id,
        receipt_id: resolve.receipt_id,
      },
      verify: {
        obligation_status: (obligationRes.data as { status: string })?.status,
        lifecycle_state: lifecycleState,
        receipt_exists: !!receiptRes.data,
        ledger_event_exists: !!ledgerRes.data,
        source_event_exists: !!sourceRes.data,
      },
    },
  });
}
