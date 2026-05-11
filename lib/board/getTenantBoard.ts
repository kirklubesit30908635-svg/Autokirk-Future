import type { GetServerSidePropsContext } from "next";
import { createServerClient } from "@supabase/ssr";
import { serialize } from "cookie";

import { mapBoardStatus, type BoardStatus } from "./status";

type LifecycleRow = {
  obligation_id: string;
  obligation_code: string | null;
  entity_id: string | null;
  due_at: string | null;
  proof_status: string | null;
  obligation_created_at: string | null;
  receipt_id: string | null;
  lifecycle_state: string | null;
  resolution_type: string | null;
};

type ReceiptRow = {
  id: string;
  obligation_id: string | null;
  emitted_at: string | null;
  receipt_hash: string | null;
  seq: number | null;
};

export type BoardObligation = {
  id: string;
  status: BoardStatus;
  obligationCode: string;
  subjectLabel: string | null;
  dueAt: string | null;
  proofStatus: string | null;
  openedAt: string | null;
};

export type BoardReceipt = {
  id: string;
  obligationId: string | null;
  sealedAt: string | null;
  hash: string | null;
  sequence: number | null;
};

export type BoardViewModel = {
  tenant: {
    id: string;
    name: string | null;
  };
  lastUpdatedAt: string;
  obligations: BoardObligation[];
  receipts: BoardReceipt[];
  systemActivity: {
    overdueCount: number;
    systemActingCount: number;
  };
};

export type TenantBoardResult =
  | { kind: "ok"; board: BoardViewModel }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "error" };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function appendSetCookie(
  res: GetServerSidePropsContext["res"],
  cookie: string
) {
  const existing = res.getHeader("Set-Cookie");
  const cookies = existing
    ? Array.isArray(existing)
      ? existing
      : [String(existing)]
    : [];

  res.setHeader("Set-Cookie", [...cookies, cookie]);
}

function asString(value: string | null | undefined, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function getTenantBoard(
  context: GetServerSidePropsContext,
  workspaceIdParam: string
): Promise<TenantBoardResult> {
  const workspaceId = workspaceIdParam.trim();

  if (!isUuid(workspaceId)) {
    return { kind: "not_found" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url?.trim() || !anonKey?.trim()) {
    return { kind: "error" };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return context.req.cookies[name];
      },
      set(name, value, options) {
        appendSetCookie(
          context.res,
          serialize(name, value, { path: "/", ...options })
        );
      },
      remove(name, options) {
        appendSetCookie(
          context.res,
          serialize(name, "", { path: "/", maxAge: 0, ...options })
        );
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { kind: "forbidden" };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .schema("core")
    .from("workspaces")
    .select("id,name")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) {
    return { kind: "error" };
  }

  if (!workspace) {
    return { kind: "not_found" };
  }

  const [obligationsResult, receiptsResult] = await Promise.all([
    supabase
      .schema("projection")
      .from("obligation_lifecycle")
      .select(
        "obligation_id,obligation_code,entity_id,due_at,proof_status,obligation_created_at,receipt_id,lifecycle_state,resolution_type"
      )
      .eq("workspace_id", workspaceId)
      .order("obligation_created_at", { ascending: false })
      .limit(100),
    supabase
      .schema("receipts")
      .from("receipts")
      .select("id,obligation_id,emitted_at,receipt_hash,seq")
      .eq("workspace_id", workspaceId)
      .order("emitted_at", { ascending: false })
      .limit(100),
  ]);

  if (obligationsResult.error || receiptsResult.error) {
    return { kind: "error" };
  }

  const now = new Date();
  const obligationRows = (obligationsResult.data ?? []) as LifecycleRow[];
  const receiptRows = (receiptsResult.data ?? []) as ReceiptRow[];

  const obligations = obligationRows.map((row): BoardObligation => ({
    id: row.obligation_id,
    status: mapBoardStatus({
      lifecycleState: row.lifecycle_state,
      proofStatus: row.proof_status,
      dueAt: row.due_at,
      hasReceipt: Boolean(row.receipt_id),
      now,
    }),
    obligationCode: asString(row.obligation_code, "UNSPECIFIED"),
    subjectLabel: asNullableString(row.entity_id),
    dueAt: row.due_at,
    proofStatus: row.proof_status,
    openedAt: row.obligation_created_at,
  }));

  const receipts = receiptRows.map((row): BoardReceipt => ({
    id: row.id,
    obligationId: row.obligation_id,
    sealedAt: row.emitted_at,
    hash: row.receipt_hash,
    sequence: typeof row.seq === "number" ? row.seq : null,
  }));

  const overdueCount = obligations.filter(
    (row) => row.status === "Overdue — System Acting"
  ).length;
  const systemActingCount = obligationRows.filter((row) => {
    const mappedStatus = mapBoardStatus({
      lifecycleState: row.lifecycle_state,
      proofStatus: row.proof_status,
      dueAt: row.due_at,
      hasReceipt: Boolean(row.receipt_id),
      now,
    });

    return (
      mappedStatus === "Overdue — System Acting" ||
      row.resolution_type === "resolve_overdue"
    );
  }).length;

  const board: BoardViewModel = {
    tenant: {
      id: workspace.id,
      name: workspace.name ?? null,
    },
    lastUpdatedAt: now.toISOString(),
    obligations,
    receipts,
    systemActivity: {
      overdueCount,
      systemActingCount,
    },
  };

  return {
    kind: "ok",
    board,
  };
}
