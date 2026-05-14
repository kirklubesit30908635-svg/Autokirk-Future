import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { buildConnectionUrl, createConnectionToken } from "../../../lib/customer/connectionLink";
import { supabaseUrl } from "../../../lib/board/signedBoardUrl";

type ConnectionLinkResponse =
  | { ok: true; connection_url: string; source_type: string; helper_text: string }
  | { ok: false; error: string; detail?: string };

type ConnectionLinkBody = {
  workspace_id?: string | null;
  watched_work?: string | null;
  proof_required?: string | null;
  board_label?: string | null;
  obligation_code?: string | null;
  source_type?: string | null;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function codeFromLabel(value: string): string {
  const code = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 54);
  return code || "client_proof_rule";
}

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ConnectionLinkResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const body = req.body as ConnectionLinkBody;
    const authHeader = req.headers.authorization;
    const accessToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!accessToken) return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    const workspaceId = clean(body.workspace_id);
    const watchedWork = clean(body.watched_work);
    const proofRequired = clean(body.proof_required);
    const boardLabel = clean(body.board_label);
    const sourceType = clean(body.source_type) || "other";
    const obligationCode = clean(body.obligation_code) || codeFromLabel(boardLabel);

    if (!workspaceId) return res.status(400).json({ ok: false, error: "ACCOUNT_NOT_READY" });
    if (watchedWork.length < 6) return res.status(400).json({ ok: false, error: "WATCHED_WORK_REQUIRED" });
    if (proofRequired.length < 4) return res.status(400).json({ ok: false, error: "PROOF_REQUIRED" });
    if (boardLabel.length < 3) return res.status(400).json({ ok: false, error: "BOARD_LABEL_REQUIRED" });

    const supabase = serviceClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    const { data: membership, error: membershipError } = await supabase
      .schema("core")
      .from("workspace_members")
      .select("workspace_id,user_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) return res.status(500).json({ ok: false, error: "ACCOUNT_LOOKUP_FAILED", detail: membershipError.message });
    if (!membership) return res.status(403).json({ ok: false, error: "ACCOUNT_ACCESS_DENIED" });

    const token = createConnectionToken({ workspaceId, userId: user.id, watchedWork, proofRequired, boardLabel, obligationCode, sourceType });

    return res.status(200).json({
      ok: true,
      connection_url: buildConnectionUrl(token),
      source_type: sourceType,
      helper_text: "Copy this connection link into the system where new work starts, or send it to the person who manages that system. Use Send test work before leaving setup.",
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "CONNECTION_LINK_FAILED", detail: error instanceof Error ? error.message : "unknown_error" });
  }
}
