import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "../../../lib/board/signedBoardUrl";

type OpsResponse =
  | {
      ok: true;
      counts: Record<string, number | null>;
      connected_systems: unknown[];
      ingestion_events: unknown[];
      proof_evaluations: unknown[];
      receipt_rationales: unknown[];
      message?: string;
    }
  | { ok: false; error: string; detail?: string };

type QueryResult = { data: unknown[] | null; error: { message: string } | null };
type ServiceClient = ReturnType<typeof createClient> & {
  schema(schema: string): {
    from(table: string): {
      select(columns: string, options?: { count?: "exact"; head?: boolean }): Promise<{ count: number | null }> & {
        order(column: string, options?: { ascending?: boolean }): { limit(count: number): Promise<QueryResult> };
      };
    };
  };
};

function serviceClient(): ServiceClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } }) as ServiceClient;
}

function isAuthorized(req: NextApiRequest): boolean {
  const expected = process.env.AUTOKIRK_OPS_KEY;
  if (!expected?.trim()) return false;
  const bearer = typeof req.headers.authorization === "string" && req.headers.authorization.toLowerCase().startsWith("bearer ")
    ? req.headers.authorization.slice("bearer ".length).trim()
    : null;
  return bearer === expected;
}

async function countTable(db: ServiceClient, schema: string, table: string): Promise<number | null> {
  const { count } = await db.schema(schema).from(table).select("*", { count: "exact", head: true });
  return count ?? null;
}

function rows(db: ServiceClient, schema: string, table: string, columns: string, order: string): Promise<QueryResult> {
  return db.schema(schema).from(table).select(columns).order(order, { ascending: false }).limit(50);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<OpsResponse>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: "OPS_KEY_REQUIRED" });

  try {
    const db = serviceClient();
    const counts = {
      connected_systems: await countTable(db, "intake", "connected_systems"),
      ingestion_events: await countTable(db, "intake", "ingestion_events"),
      claim_sources: await countTable(db, "proof_boundary", "claim_sources"),
      authority_boundaries: await countTable(db, "proof_boundary", "authority_boundaries"),
      proof_evaluations: await countTable(db, "proof_boundary", "proof_evaluations"),
      receipt_rationales: await countTable(db, "proof_boundary", "receipt_rationales"),
      obligations: await countTable(db, "core", "obligations"),
      receipts: await countTable(db, "receipts", "receipts"),
    };

    const [connected, events, evaluations, rationales] = await Promise.all([
      rows(db, "intake", "connected_systems", "id,workspace_id,source_type,connector_type,source_name,display_name,board_label,trust_level,requires_human_approval,status,last_seen_at,last_event_at,last_success_at,last_error_at,event_count,error_count,created_at", "created_at"),
      rows(db, "intake", "ingestion_events", "id,connected_system_id,workspace_id,source_event_key,source_event_type,status,trust_level,agent_run_id,mcp_tool_name,received_at,obligation_id,source_event_id,error", "received_at"),
      rows(db, "proof_boundary", "proof_evaluations", "id,obligation_id,workspace_id,decision,evaluation_mode,rule_version,idempotency_key,evaluated_at,claim_source_id,authority_boundary_id", "evaluated_at"),
      rows(db, "proof_boundary", "receipt_rationales", "receipt_id,obligation_id,workspace_id,proof_evaluation_id,authority_decision,emitted_at,claim_source_id,authority_boundary_id", "emitted_at"),
    ]);

    return res.status(200).json({
      ok: true,
      counts,
      connected_systems: connected.data ?? [],
      ingestion_events: events.data ?? [],
      proof_evaluations: evaluations.data ?? [],
      receipt_rationales: rationales.data ?? [],
      message: [connected.error?.message, events.error?.message, evaluations.error?.message, rationales.error?.message].filter(Boolean).join(" | ") || undefined,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "OPS_REGISTRY_FAILED", detail: error instanceof Error ? error.message : "unknown_error" });
  }
}
