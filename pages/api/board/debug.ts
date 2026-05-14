import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl, verifyBoardToken } from "../../../lib/board/signedBoardUrl";

type DebugResponse = {
  ok: boolean;
  workspace_id: string | null;
  checks: Record<string, unknown>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TRUSTED_PUBLIC_BOARD_WORKSPACES = new Set([
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "88eecda6-80e4-4eb7-b890-4330674fa7a7",
]);

function stringParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<DebugResponse>) {
  const workspaceId = stringParam(req.query.workspace_id);
  const key = stringParam(req.query.key);
  const checks: Record<string, unknown> = {};

  checks.hasWorkspaceId = Boolean(workspaceId);
  checks.workspaceIdLooksValid = Boolean(workspaceId && UUID_PATTERN.test(workspaceId));
  checks.hasSupabaseUrl = Boolean(supabaseUrl());
  checks.hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  checks.hasAnonKey = Boolean((process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)?.trim());

  if (!workspaceId || !UUID_PATTERN.test(workspaceId)) {
    return res.status(400).json({ ok: false, workspace_id: workspaceId, checks });
  }

  checks.signedBoardAccess = verifyBoardToken(workspaceId, key);
  checks.trustedPublicBoard = TRUSTED_PUBLIC_BOARD_WORKSPACES.has(workspaceId);

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey?.trim()) {
    return res.status(500).json({ ok: false, workspace_id: workspaceId, checks });
  }

  const supabase = createClient(supabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const workspaceResult = await supabase
    .schema("core")
    .from("workspaces")
    .select("id,name")
    .eq("id", workspaceId)
    .maybeSingle();

  checks.workspaceError = workspaceResult.error?.message ?? null;
  checks.workspace = workspaceResult.data ?? null;

  const obligationsResult = await supabase
    .schema("core")
    .from("obligations")
    .select("id,obligation_code,status,proof_status,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(5);

  checks.obligationsError = obligationsResult.error?.message ?? null;
  checks.obligationCount = obligationsResult.data?.length ?? null;
  checks.obligations = obligationsResult.data ?? null;

  const receiptsResult = await supabase
    .schema("receipts")
    .from("receipts")
    .select("id,obligation_id,emitted_at,receipt_hash,seq")
    .eq("workspace_id", workspaceId)
    .order("emitted_at", { ascending: false })
    .limit(5);

  checks.receiptsError = receiptsResult.error?.message ?? null;
  checks.receiptCount = receiptsResult.data?.length ?? null;

  return res.status(200).json({
    ok: !workspaceResult.error && !obligationsResult.error && !receiptsResult.error,
    workspace_id: workspaceId,
    checks,
  });
}
