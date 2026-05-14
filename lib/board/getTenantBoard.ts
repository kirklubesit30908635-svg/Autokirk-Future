import type { GetServerSidePropsContext } from "next";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { serialize } from "cookie";

import { mapBoardStatus, type BoardStatus } from "./status";
import { supabaseUrl, verifyBoardToken } from "./signedBoardUrl";

type ObligationRow = {
  id: string;
  obligation_code: string | null;
  entity_id: string | null;
  due_at: string | null;
  proof_status: string | null;
  created_at: string | null;
  status: string | null;
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
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TRUSTED_PUBLIC_BOARD_WORKSPACES = new Set([
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "88eecda6-80e4-4eb7-b890-4330674fa7a7",
  ...(process.env.AUTOKIRK_PUBLIC_BOARD_WORKSPACE_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
]);

export function createFallbackBoard(workspaceId: string): BoardViewModel {
  return {
    tenant: {
      id: workspaceId,
      name: "Link needs refresh",
    },
    lastUpdatedAt: new Date().toISOString(),
    obligations: [],
    receipts: [],
    systemActivity: {
      overdueCount: 0,
      systemActingCount: 0,
    },
  };
}

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

function queryToken(context: GetServerSidePropsContext): string | null {
  const raw = context.query.key;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return typeof raw === "string" ? raw : null;
}

function buildBoard(input: {
  workspace: { id: string; name: string | null };
  obligationRows: ObligationRow[];
  receiptRows: ReceiptRow[];
  now: Date;
}): BoardViewModel {
  const receiptObligationIds = new Set(
    input.receiptRows
      .map((receipt) => receipt.obligation_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );

  const obligations = input.obligationRows.map((row): BoardObligation => ({
    id: row.id,
    status: mapBoardStatus({
      lifecycleState: row.status,
      proofStatus: row.proof_status,
      dueAt: row.due_at,
      hasReceipt: receiptObligationIds.has(row.id),
      now: input.now,
    }),
    obligationCode: asString(row.obligation_code, "UNSPECIFIED"),
    subjectLabel: asNullableString(row.entity_id),
    dueAt: row.due_at,
    proofStatus: row.proof_status,
    openedAt: row.created_at,
  }));

  const receipts = input.receiptRows.map((row): BoardReceipt => ({
    id: row.id,
    obligationId: row.obligation_id,
    sealedAt: row.emitted_at,
    hash: row.receipt_hash,
    sequence: typeof row.seq === "number" ? row.seq : null,
  }));

  const overdueCount = obligations.filter(
    (row) => row.status === "Overdue — System Acting",
  ).length;
  const systemActingCount = input.obligationRows.filter((row) => {
    const mappedStatus = mapBoardStatus({
      lifecycleState: row.status,
      proofStatus: row.proof_status,
      dueAt: row.due_at,
      hasReceipt: receiptObligationIds.has(row.id),
      now: input.now,
    });

    return (
      mappedStatus === "Overdue — System Acting" ||
      row.resolution_type === "resolve_overdue"
    );
  }).length;

  return {
    tenant: {
      id: input.workspace.id,
      name: input.workspace.name ?? null,
    },
    lastUpdatedAt: input.now.toISOString(),
    obligations,
    receipts,
    systemActivity: {
      overdueCount,
      systemActingCount,
    },
  };
}

export async function getTenantBoard(
  context: GetServerSidePropsContext,
  workspaceIdParam: string,
): Promise<TenantBoardResult> {
  const workspaceId = workspaceIdParam.trim();

  if (!isUuid(workspaceId)) {
    return { kind: "not_found" };
  }

  const url = supabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let userSupabase: ReturnType<typeof createServerClient> | null = null;
  if (anonKey?.trim()) {
    userSupabase = createServerClient(url, anonKey, {
      cookies: {
        get(name) {
          return context.req.cookies[name];
        },
        set(name, value, options) {
          appendSetCookie(
            context.res,
            serialize(name, value, { path: "/", ...options }),
          );
        },
        remove(name, options) {
          appendSetCookie(
            context.res,
            serialize(name, "", { path: "/", maxAge: 0, ...options }),
          );
        },
      },
    });
  }

  const signedBoardAccess = verifyBoardToken(workspaceId, queryToken(context));
  const trustedPublicBoard = TRUSTED_PUBLIC_BOARD_WORKSPACES.has(workspaceId);
  const serviceSupabase = serviceRoleKey?.trim()
    ? createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  let canReadViaUser = false;
  if (userSupabase) {
    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    if (user) {
      const { data: membership } = await userSupabase
        .schema("core")
        .from("workspace_members")
        .select("workspace_id,user_id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .maybeSingle();

      canReadViaUser = Boolean(membership);
    }
  }

  const readClient = canReadViaUser
    ? userSupabase
    : signedBoardAccess || trustedPublicBoard
      ? serviceSupabase
      : null;

  if (!readClient) {
    return { kind: "forbidden" };
  }

  const { data: workspace, error: workspaceError } = await readClient
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
    readClient
      .schema("core")
      .from("obligations")
      .select(
        "id,obligation_code,entity_id,due_at,proof_status,created_at,status,resolution_type",
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(100),
    readClient
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

  const board = buildBoard({
    workspace,
    obligationRows: (obligationsResult.data ?? []) as ObligationRow[],
    receiptRows: (receiptsResult.data ?? []) as ReceiptRow[],
    now: new Date(),
  });

  return {
    kind: "ok",
    board,
  };
}
