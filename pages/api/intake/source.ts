import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "../../../lib/board/signedBoardUrl";
import { verifyConnectionToken } from "../../../lib/customer/connectionLink";

type SourceResponse =
  | { ok: true; status: "created" | "duplicate"; title: string; board_label: string }
  | { ok: false; error: string; detail?: string };

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function titleFromPayload(payload: Record<string, unknown>, fallback: string): string {
  const candidates = [payload.title, payload.name, payload.job_name, payload.lead_name, payload.description, payload.message, payload.customer];
  for (const candidate of candidates) {
    const value = clean(candidate);
    if (value) return value.slice(0, 160);
  }
  return fallback;
}

function eventKey(payload: Record<string, unknown>, title: string): string {
  const candidates = [payload.source_event_id, payload.event_id, payload.id, payload.lead_id, payload.job_id, payload.invoice_id];
  for (const candidate of candidates) {
    const value = clean(candidate);
    if (value) return value.slice(0, 160);
  }
  return `autokirk-${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
}

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SourceResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
    const connection = verifyConnectionToken(typeof key === "string" ? key : null);
    if (!connection) return res.status(401).json({ ok: false, error: "CONNECTION_NOT_ACCEPTED" });

    const payload = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body as Record<string, unknown> : {};
    const title = titleFromPayload(payload, connection.boardLabel);
    const sourceEventKey = eventKey(payload, title);
    const sourceSystem = `customer-${connection.sourceType}`;
    const supabase = serviceClient();

    const { data: existing } = await supabase
      .schema("ingest")
      .from("source_events")
      .select("id")
      .eq("workspace_id", connection.workspaceId)
      .eq("source_system", sourceSystem)
      .eq("source_event_key", sourceEventKey)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ ok: true, status: "duplicate", title, board_label: connection.boardLabel });
    }

    const { error } = await supabase.schema("api").rpc("commit_intake_candidate", {
      p_workspace_id: connection.workspaceId,
      p_actor_user_id: connection.userId,
      p_candidate_ref: `${sourceSystem}:${sourceEventKey}`,
      p_obligation_code: connection.obligationCode,
      p_trigger_text: `${title} must stay open until this proof exists: ${connection.proofRequired}.`,
      p_source_signal_ref: sourceEventKey,
      p_object_anchor: title,
      p_action_anchor: connection.proofRequired,
      p_trigger_anchor: connection.boardLabel,
      p_operator_note: `Connection source: ${connection.sourceType}. Watched work: ${connection.watchedWork}.`,
    });

    if (error) return res.status(400).json({ ok: false, error: "WORK_NOT_CREATED", detail: error.message });

    return res.status(200).json({ ok: true, status: "created", title, board_label: connection.boardLabel });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "CONNECTION_INTAKE_FAILED", detail: error instanceof Error ? error.message : "unknown_error" });
  }
}
