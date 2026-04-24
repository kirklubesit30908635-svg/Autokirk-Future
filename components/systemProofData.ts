import { createClient } from "@supabase/supabase-js";

import type { SystemProofBoardProps } from "./SystemProofBoard";

type LifecycleRow = {
  obligation_id: string;
  entity_id: string | null;
  obligation_code: string;
  workspace_id: string;
  obligation_created_at: string;
  source_event_id: string | null;
  source_system: string | null;
  source_event_key: string | null;
  source_event_type: string | null;
  source_event_created_at: string | null;
  receipt_id: string | null;
  receipt_entity_id: string | null;
  resolution_type: string | null;
  proof_status: string | null;
  receipt_emitted_at: string | null;
  truth_burden: string | null;
  due_at: string | null;
  lifecycle_state: string;
};

function placeholderBoard(): SystemProofBoardProps {
  return {
    mode: "placeholder",
    generatedAt: new Date().toISOString(),
    summary: {
      sourceEvents: 48,
      obligations: 48,
      receipts: 39,
      failed: 6,
      overdue: 3,
      open: 3,
      retries: "projection only",
      projection: "PLACEHOLDER",
    },
    lifecycleRows: [
      {
        obligation_id: "proof-obligation-001",
        entity_id: "entity-proof-001",
        obligation_code: "invoice_delivery_confirmed",
        workspace_id: "workspace-proof-001",
        obligation_created_at: "2026-04-24T11:15:00.000Z",
        source_event_id: "source-proof-001",
        source_system: "billing-webhook",
        source_event_key: "charge.succeeded:proof-001",
        source_event_type: "billing.charge_succeeded",
        source_event_created_at: "2026-04-24T11:15:00.000Z",
        receipt_id: "receipt-proof-001",
        receipt_entity_id: "entity-proof-001",
        resolution_type: "resolve_with_proof",
        proof_status: "sufficient",
        receipt_emitted_at: "2026-04-24T11:16:00.000Z",
        truth_burden: "contractual",
        due_at: "2026-04-25T11:15:00.000Z",
        lifecycle_state: "resolved",
      },
      {
        obligation_id: "proof-obligation-002",
        entity_id: "entity-proof-002",
        obligation_code: "followup_notice_due",
        workspace_id: "workspace-proof-001",
        obligation_created_at: "2026-04-24T10:45:00.000Z",
        source_event_id: "source-proof-002",
        source_system: "operator-intake",
        source_event_key: "manual:notice-002",
        source_event_type: "operator.followup_requested",
        source_event_created_at: "2026-04-24T10:45:00.000Z",
        receipt_id: null,
        receipt_entity_id: null,
        resolution_type: null,
        proof_status: null,
        receipt_emitted_at: null,
        truth_burden: "contractual",
        due_at: "2026-04-25T10:45:00.000Z",
        lifecycle_state: "open",
      },
      {
        obligation_id: "proof-obligation-003",
        entity_id: "entity-proof-003",
        obligation_code: "overdue_chargeback_response",
        workspace_id: "workspace-proof-002",
        obligation_created_at: "2026-04-19T08:20:00.000Z",
        source_event_id: "source-proof-003",
        source_system: "watchdog",
        source_event_key: "watchdog:chargeback-003",
        source_event_type: "watchdog.overdue_failure_detected",
        source_event_created_at: "2026-04-19T08:20:00.000Z",
        receipt_id: null,
        receipt_entity_id: null,
        resolution_type: null,
        proof_status: null,
        receipt_emitted_at: null,
        truth_burden: "contractual",
        due_at: "2026-04-20T08:20:00.000Z",
        lifecycle_state: "failed",
      },
    ],
    watchdogRows: [
      {
        obligation_id: "proof-obligation-003",
        entity_id: "entity-proof-003",
        obligation_code: "overdue_chargeback_response",
        workspace_id: "workspace-proof-002",
        obligation_created_at: "2026-04-19T08:20:00.000Z",
        source_event_id: "source-proof-003",
        source_system: "watchdog",
        source_event_key: "watchdog:chargeback-003",
        source_event_type: "watchdog.overdue_failure_detected",
        source_event_created_at: "2026-04-19T08:20:00.000Z",
        receipt_id: null,
        receipt_entity_id: null,
        resolution_type: null,
        proof_status: null,
        receipt_emitted_at: null,
        truth_burden: "contractual",
        due_at: "2026-04-20T08:20:00.000Z",
        lifecycle_state: "failed",
      },
      {
        obligation_id: "proof-obligation-004",
        entity_id: "entity-proof-004",
        obligation_code: "refund_evidence_missing",
        workspace_id: "workspace-proof-003",
        obligation_created_at: "2026-04-18T04:10:00.000Z",
        source_event_id: "source-proof-004",
        source_system: "operator-intake",
        source_event_key: "manual:refund-004",
        source_event_type: "operator.refund_escalated",
        source_event_created_at: "2026-04-18T04:10:00.000Z",
        receipt_id: null,
        receipt_entity_id: null,
        resolution_type: null,
        proof_status: null,
        receipt_emitted_at: null,
        truth_burden: "contractual",
        due_at: "2026-04-19T04:10:00.000Z",
        lifecycle_state: "failed",
      },
    ],
    note:
      "Supabase environment variables are missing. Showing placeholder proof rows only.",
  };
}

function countValue(value: number | null): number {
  return typeof value === "number" ? value : 0;
}

export async function getSystemProofBoardData(): Promise<SystemProofBoardProps> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim() || !serviceRoleKey?.trim()) {
    return placeholderBoard();
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const lifecycleView = supabase.schema("projection").from("obligation_lifecycle");

  const [
    lifecycleRowsResult,
    watchdogRowsResult,
    obligationsCountResult,
    sourceEventsCountResult,
    receiptsCountResult,
    failedCountResult,
    openCountResult,
    overdueCountResult,
  ] = await Promise.all([
    lifecycleView
      .select(
        "obligation_id, entity_id, obligation_code, workspace_id, obligation_created_at, source_event_id, source_system, source_event_key, source_event_type, source_event_created_at, receipt_id, receipt_entity_id, resolution_type, proof_status, receipt_emitted_at, truth_burden, due_at, lifecycle_state"
      )
      .order("obligation_created_at", { ascending: false })
      .limit(8),
    supabase
      .from("overdue_failure_watchdog")
      .select(
        "obligation_id, entity_id, obligation_code, workspace_id, obligation_created_at, source_event_id, source_system, source_event_key, source_event_type, source_event_created_at, receipt_id, receipt_entity_id, resolution_type, proof_status, receipt_emitted_at, truth_burden, due_at, lifecycle_state"
      )
      .order("obligation_created_at", { ascending: false })
      .limit(8),
    lifecycleView.select("obligation_id", { count: "exact", head: true }),
    lifecycleView
      .select("source_event_id", { count: "exact", head: true })
      .not("source_event_id", "is", null),
    lifecycleView
      .select("receipt_id", { count: "exact", head: true })
      .not("receipt_id", "is", null),
    lifecycleView
      .select("obligation_id", { count: "exact", head: true })
      .eq("lifecycle_state", "failed"),
    lifecycleView
      .select("obligation_id", { count: "exact", head: true })
      .eq("lifecycle_state", "open"),
    supabase
      .from("overdue_failure_watchdog")
      .select("obligation_id", { count: "exact", head: true }),
  ]);

  const firstError =
    lifecycleRowsResult.error ||
    watchdogRowsResult.error ||
    obligationsCountResult.error ||
    sourceEventsCountResult.error ||
    receiptsCountResult.error ||
    failedCountResult.error ||
    openCountResult.error ||
    overdueCountResult.error;

  if (firstError) {
    return {
      mode: "error",
      generatedAt: new Date().toISOString(),
      summary: {
        sourceEvents: null,
        obligations: null,
        receipts: null,
        failed: null,
        overdue: null,
        open: null,
        retries: "not surfaced",
        projection: "ERROR",
      },
      lifecycleRows: [],
      watchdogRows: [],
      note:
        "Projection env vars are present, but the read-model query failed. No placeholder truth was injected.",
      error: firstError.message,
    };
  }

  return {
    mode: "live",
    generatedAt: new Date().toISOString(),
    summary: {
      sourceEvents: countValue(sourceEventsCountResult.count),
      obligations: countValue(obligationsCountResult.count),
      receipts: countValue(receiptsCountResult.count),
      failed: countValue(failedCountResult.count),
      overdue: countValue(overdueCountResult.count),
      open: countValue(openCountResult.count),
      retries: "kernel-owned",
      projection: "LIVE",
    },
    lifecycleRows: (lifecycleRowsResult.data ?? []) as LifecycleRow[],
    watchdogRows: (watchdogRowsResult.data ?? []) as LifecycleRow[],
    note:
      "Read-only truth is sourced from projection.obligation_lifecycle and public.overdue_failure_watchdog only.",
  };
}
