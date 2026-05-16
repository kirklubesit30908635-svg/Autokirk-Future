import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "../../../lib/board/signedBoardUrl";

type CountResult = { count: number | null; error: string | null };
type CapabilityStatus =
  | {
      ok: true;
      authorized: boolean;
      vocabulary: string[];
      tables: Record<string, CountResult>;
      routes: string[];
      rpcBoundary: string;
      productState: string;
      message?: string;
    }
  | { ok: false; error: string; detail?: string };

type SupabaseServiceClient = ReturnType<typeof createClient> & {
  schema(schema: string): {
    from(table: string): {
      select(columns: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): Promise<{
        count: number | null;
        error: { message: string } | null;
      }>;
    };
  };
};

function serviceClient(): SupabaseServiceClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } }) as SupabaseServiceClient;
}

function opsKey(): string | null {
  return process.env.AUTOKIRK_OPS_KEY ?? null;
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

async function tableCount(supabase: SupabaseServiceClient, schema: string, table: string): Promise<CountResult> {
  const { count, error } = await supabase.schema(schema).from(table).select("*", { count: "exact", head: true });
  return { count: count ?? null, error: error?.message ?? null };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CapabilityStatus>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  if (!authorized(req)) {
    return res.status(401).json({ ok: false, error: "OPS_KEY_REQUIRED" });
  }

  try {
    const supabase = serviceClient();
    const tableEntries = await Promise.all([
      ["intake.connected_systems", tableCount(supabase, "intake", "connected_systems")] as const,
      ["intake.ingestion_events", tableCount(supabase, "intake", "ingestion_events")] as const,
      ["proof_boundary.claim_sources", tableCount(supabase, "proof_boundary", "claim_sources")] as const,
      ["proof_boundary.authority_boundaries", tableCount(supabase, "proof_boundary", "authority_boundaries")] as const,
      ["proof_boundary.obligation_claim_contexts", tableCount(supabase, "proof_boundary", "obligation_claim_contexts")] as const,
      ["proof_boundary.proof_evaluations", tableCount(supabase, "proof_boundary", "proof_evaluations")] as const,
      ["proof_boundary.proof_evaluation_receipts", tableCount(supabase, "proof_boundary", "proof_evaluation_receipts")] as const,
      ["proof_boundary.receipt_rationales", tableCount(supabase, "proof_boundary", "receipt_rationales")] as const,
      ["ingest.source_events", tableCount(supabase, "ingest", "source_events")] as const,
      ["core.obligation_sources", tableCount(supabase, "core", "obligation_sources")] as const,
      ["core.obligations", tableCount(supabase, "core", "obligations")] as const,
      ["receipts.receipts", tableCount(supabase, "receipts", "receipts")] as const,
    ]);

    const tables: Record<string, CountResult> = {};
    for (const [name, resultPromise] of tableEntries) tables[name] = await resultPromise;

    return res.status(200).json({
      ok: true,
      authorized: true,
      vocabulary: [
        "connected system",
        "connector type",
        "claim source",
        "authority boundary",
        "ingestion event",
        "source event",
        "governed obligation",
        "obligation claim context",
        "proof evaluation",
        "receipt rationale",
      ],
      tables,
      routes: [
        "/platform",
        "/intake",
        "/agent-proof",
        "/ops",
        "/api/customer/connection-link",
        "/api/intake/webhook",
        "/api/intake/crm",
        "/api/intake/form",
        "/api/intake/email",
        "/api/intake/agent",
        "/api/intake/mcp",
        "/api/intake/automation",
        "/api/ops/capability-status",
        "/api/ops/intake-registry",
      ],
      rpcBoundary: "Governed-write RPCs are service-role only; UI access is through server API routes.",
      productState: "Operational ingestion and agentic proof boundary are live in Supabase and accessible through protected product routes.",
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "CAPABILITY_STATUS_FAILED", detail: error instanceof Error ? error.message : "unknown_error" });
  }
}
