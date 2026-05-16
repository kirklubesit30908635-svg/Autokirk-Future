import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "../../../lib/board/signedBoardUrl";
import { hashConnectionToken, verifyConnectionToken } from "../../../lib/customer/connectionLink";

type SourceResponse =
  | { ok: true; status: "created" | "duplicate"; title: string; board_label: string; connected_system_id?: string; obligation_id?: string; source_event_id?: string }
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
  const candidates = [payload.source_event_id, payload.event_id, payload.id, payload.lead_id, payload.job_id, payload.invoice_id, payload.agent_run_id, payload.run_id];
  for (const candidate of candidates) {
    const value = clean(candidate);
    if (value) return value.slice(0, 160);
  }
  return `autokirk-${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
}

function eventType(payload: Record<string, unknown>, sourceType: string): string {
  return clean(payload.source_event_type) || clean(payload.event_type) || `${sourceType}.created`;
}

function bearerToken(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) return auth.slice("bearer ".length).trim();
  return null;
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
    const queryKey = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
    const rawToken = bearerToken(req) ?? (typeof queryKey === "string" ? queryKey : null);
    const connection = verifyConnectionToken(rawToken);
    if (!connection || !rawToken) return res.status(401).json({ ok: false, error: "CONNECTION_NOT_ACCEPTED" });

    const payload = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? (req.body as Record<string, unknown>) : {};
    const title = titleFromPayload(payload, connection.boardLabel);
    const sourceEventKey = eventKey(payload, title);
    const sourceEventType = eventType(payload, connection.sourceType);
    const supabase = serviceClient();

    if (connection.connectedSystemId) {
      const { data, error } = await supabase.schema("api").rpc("ingest_connected_system_event", {
        p_connected_system_id: connection.connectedSystemId,
        p_workspace_id: connection.workspaceId,
        p_actor_id: connection.userId,
        p_source_event_key: sourceEventKey,
        p_source_event_type: sourceEventType,
        p_payload: {
          title,
          board_label: connection.boardLabel,
          watched_work: connection.watchedWork,
          proof_required: connection.proofRequired,
          source_type: connection.sourceType,
          connector_type: connection.connectorType,
          ...payload,
        },
        p_occurred_at: new Date().toISOString(),
        p_token_fingerprint: hashConnectionToken(rawToken),
        p_claimant_identity: clean(payload.claimant_identity) || clean(payload.agent_id) || clean(payload.agent_identity) || null,
        p_execution_identity: clean(payload.execution_identity) || clean(payload.agent_run_id) || clean(payload.run_id) || null,
      });

      if (error) return res.status(400).json({ ok: false, error: "WORK_NOT_CREATED", detail: error.message });

      const result = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
      const status = result.status === "duplicate" || result.replayed === true ? "duplicate" : "created";

      return res.status(200).json({
        ok: true,
        status,
        title,
        board_label: connection.boardLabel,
        connected_system_id: connection.connectedSystemId,
        obligation_id: typeof result.obligation_id === "string" ? result.obligation_id : undefined,
        source_event_id: typeof result.source_event_id === "string" ? result.source_event_id : undefined,
      });
    }

    const sourceSystem = `customer-${connection.sourceType}`;
    const { data: existing } = await supabase
      .schema("ingest")
      .from("source_events")
      .select("id")
      .eq("workspace_id", connection.workspaceId)
      .eq("source_system", sourceSystem)
      .eq("source_event_key", sourceEventKey)
      .maybeSingle();

    if (existing) return res.status(200).json({ ok: true, status: "duplicate", title, board_label: connection.boardLabel });

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
