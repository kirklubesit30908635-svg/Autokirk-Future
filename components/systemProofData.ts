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

function noLiveDataBoard(note: string): SystemProofBoardProps {
  return {
    mode: "placeholder",
    generatedAt: new Date().toISOString(),
    summary: {
      sourceEvents: null,
      obligations: null,
      receipts: null,
      failed: null,
      overdue: null,
      open: null,
      retries: "—",
      projection: "NO LIVE DATA",
    },
    lifecycleRows: [],
    watchdogRows: [],
    note,
  };
}

function countValue(value: number | null): number {
  return typeof value === "number" ? value : 0;
}

function getProjectionStatus({
  hasLiveRows,
  failed,
  overdue,
}: {
  hasLiveRows: boolean;
  failed: number;
  overdue: number;
}): "OK" | "FAILING" | "NO LIVE DATA" {
  if (!hasLiveRows) {
    return "NO LIVE DATA";
  }

  if (failed > 0 || overdue > 0) {
    return "FAILING";
  }

  return "OK";
}

export async function getSystemProofBoardData(): Promise<SystemProofBoardProps> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim() || !serviceRoleKey?.trim()) {
    return noLiveDataBoard(
      "Live projection credentials are unavailable for this environment."
    );
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
      .limit(12),
    supabase
      .from("overdue_failure_watchdog")
      .select(
        "obligation_id, entity_id, obligation_code, workspace_id, obligation_created_at, source_event_id, source_system, source_event_key, source_event_type, source_event_created_at, receipt_id, receipt_entity_id, resolution_type, proof_status, receipt_emitted_at, truth_burden, due_at, lifecycle_state"
      )
      .order("obligation_created_at", { ascending: false })
      .limit(12),
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
        retries: "—",
        projection: "FAILING",
      },
      lifecycleRows: [],
      watchdogRows: [],
      note: "The read model is configured, but the projection query is failing.",
      error: firstError.message,
    };
  }

  const lifecycleRows = (lifecycleRowsResult.data ?? []) as LifecycleRow[];
  const watchdogRows = (watchdogRowsResult.data ?? []) as LifecycleRow[];
  const failed = countValue(failedCountResult.count);
  const overdue = countValue(overdueCountResult.count);
  const hasLiveRows = lifecycleRows.length > 0 || watchdogRows.length > 0;

  return {
    mode: "live",
    generatedAt: new Date().toISOString(),
    summary: {
      sourceEvents: countValue(sourceEventsCountResult.count),
      obligations: countValue(obligationsCountResult.count),
      receipts: countValue(receiptsCountResult.count),
      failed,
      overdue,
      open: countValue(openCountResult.count),
      retries: "—",
      projection: getProjectionStatus({ hasLiveRows, failed, overdue }),
    },
    lifecycleRows,
    watchdogRows,
    note:
      "Read-only truth is sourced from projection.obligation_lifecycle and public.overdue_failure_watchdog.",
  };
}
