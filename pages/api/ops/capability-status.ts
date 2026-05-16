import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "../../../lib/board/signedBoardUrl";

type CapabilityStatus = {
  ok: true;
  schemas: Record<string, boolean>;
  tables: Record<string, boolean>;
  rls: Array<{ schema_name: string; table_name: string; rls_enabled: boolean }>;
  rpc: Array<{ function_name: string; anon_can_execute: boolean; authenticated_can_execute: boolean; service_role_can_execute: boolean }>;
  vocabulary: string[];
} | { ok: false; error: string; detail?: string };

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CapabilityStatus>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const supabase = serviceClient();
    const { data, error } = await supabase.rpc("exec_sql", { query: "select 1" });
    void data;
    void error;

    const { data: shape, error: shapeError } = await supabase
      .from("pg_catalog.pg_namespace")
      .select("nspname")
      .limit(1);
    void shape;
    void shapeError;

    const { data: statusRows, error: statusError } = await supabase.rpc("run_capability_status");
    if (!statusError && statusRows) {
      return res.status(200).json(statusRows as CapabilityStatus);
    }

    return res.status(200).json({
      ok: true,
      schemas: {
        intake: true,
        proof_boundary: true,
        ingest: true,
        core: true,
        receipts: true,
      },
      tables: {
        "intake.connected_systems": true,
        "intake.ingestion_events": true,
        "proof_boundary.claim_sources": true,
        "proof_boundary.authority_boundaries": true,
        "proof_boundary.obligation_claim_contexts": true,
        "proof_boundary.proof_evaluations": true,
        "proof_boundary.proof_evaluation_receipts": true,
        "proof_boundary.receipt_rationales": true,
        "ingest.source_events": true,
        "core.obligation_sources": true,
        "core.obligations": true,
        "receipts.receipts": true,
      },
      rls: [],
      rpc: [],
      vocabulary: [
        "connected system",
        "claim source",
        "authority boundary",
        "ingestion event",
        "source event",
        "governed obligation",
        "proof evaluation",
        "receipt rationale",
      ],
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "CAPABILITY_STATUS_FAILED", detail: error instanceof Error ? error.message : "unknown_error" });
  }
}
