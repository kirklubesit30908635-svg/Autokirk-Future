import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "../../../lib/board/signedBoardUrl";

type OpsResponse =
  | {
      ok: true;
      authorized: boolean;
      counts: Record<string, number | null>;
      connected_systems: unknown[];
      ingestion_events: unknown[];
      proof_evaluations: unknown[];
      receipt_rationales: unknown[];
      message?: string;
    }
  | { ok: false; error: string; detail?: string };

type SupabaseQueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

type SupabaseServiceClient = ReturnType<typeof createClient> & {
  schema(schema: string): {
    from(table: string): {
      select(columns: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): Promise<{
        count: number | null;
        error: { message: string } | null;
      }> & {
        order(column: string, options?: { ascending?: boolean }): {
          limit(count: number): Promise<SupabaseQueryResult>;
        };
      };
    };
  };
};

function serviceClient(): SupabaseServiceClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } }) as SupabaseServiceClient;
}

function opsKey(): string | null {
  return process.env.AUTOKIRK_OPS_KEY ?? process.env.AUTOKIRK_BOARD_LINK_KEY ?? null;
}

function authorized(req: NextApiRequest): boolean {
  const expected = opsKey();
  if (!expected) return false;
  const queryKey = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
  const auth = typeof req.headers.authorization === "string" && req.headers.authorization.toLowerCase().startsWith("bearer ")
    ? req.headers.authorization.slice("bearer ".length).trim()
    : null;
  return queryKey === expected || auth === expected;
}

async function countTable(supabase: SupabaseServiceClient, schema: string, table: string): Promise<number | null> {
  const { count } = await supabase.schema(schema).from(table).select("*", { count: "exact", head: true });
  return count ?? null;
}

function selectRows(supabase: SupabaseServiceClient, schema: string, table: string, columns: string, orderColumn: string): Promise<SupabaseQueryResult> {
  return supabase.schema(schema).from(table).select(columns).order(orderColumn, { ascending: false }).limit(50);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<OpsResponse>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const supabase = serviceClient();
    const isAuthorized = authorized(req);
    const counts = {
      connected_systems: await countTable(supabase, "intake", "connected_systems"),
      ingestion_events: await countTable(supabase, "intake", "ingestion_events"),
      claim_sources: await countTable(supabase, "proof_boundary", "claim_sources"),
      authority_boundaries: await countTable(supabase, "proof_boundary", "authority_boundaries"),
      proof_evaluations: await countTable(supabase, "proof_boundary", "proof_evaluations"),
      receipt_rationales: await countTable(supabase, "proof_boundary", "receipt_rationales"),
      obligations: await countTable(supabase, "core", "obligations"),
      receipts: await countTable(supabase, "receipts", "receipts"),
    };

    if (!isAuthorized) {
      return res.status(200).json({
        ok: true,
        authorized: false,
        counts,
        connected_systems: [],
        ingestion_events: [],
        proof_evaluations: [],
        receipt_rationales: [],
        message: "Add ?key=<AUTOKIRK_OPS_KEY> to view operational rows.",
      });
    }

    const [connected, events, evaluations, rationales] = await Promise.all([
      selectRows(
        supabase,
        "intake",
        "connected_systems",
        "id,workspace_id,source_type,connector_type,source_name,display_name,watched_work,proof_required,board_label,trust_level,requires_human_approval,allow_auto_resolution,status,last_seen_at,last_event_at,last_success_at,last_error_at,last_error,event_count,error_count,created_at",
        "created_at"
      ),
      selectRows(
        supabase,
        "intake",
        "ingestion_events",
        "id,connected_system_id,workspace_id,source_event_key,source_event_type,status,trust_level,agent_run_id,mcp_tool_name,workflow_chain,received_at,obligation_id,source_event_id,error",
        "received_at"
      ),
      selectRows(
        supabase,
        "proof_boundary",
        "proof_evaluations",
        "id,obligation_id,workspace_id,decision,evaluation_mode,rationale,cited_controls,required_follow_up,rule_version,idempotency_key,evaluated_at,claim_source_id,authority_boundary_id",
        "evaluated_at"
      ),
      selectRows(
        supabase,
        "proof_boundary",
        "receipt_rationales",
        "receipt_id,obligation_id,workspace_id,proof_evaluation_id,authority_decision,machine_rationale,emitted_at,claim_source_id,authority_boundary_id",
        "emitted_at"
      ),
    ]);

    return res.status(200).json({
      ok: true,
      authorized: true,
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
