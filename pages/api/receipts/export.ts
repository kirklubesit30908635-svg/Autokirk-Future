import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { serialize } from "cookie";

type ReceiptExportRow = {
  id: string;
  obligation_id: string | null;
  emitted_at: string | null;
  receipt_hash: string | null;
  seq: number | null;
  resolution_type: string | null;
  proof_status: string | null;
  reason: string | null;
};

type ReceiptExportSuccess = {
  ok: true;
  workspace_id: string;
  exported_at: string;
  receipt_count: number;
  receipts: ReceiptExportRow[];
};

type ReceiptExportFailure = {
  ok: false;
  error: string;
};

type ApiResponse = ReceiptExportSuccess | ReceiptExportFailure;

class RequestValidationError extends Error {}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function assertEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`${name}_REQUIRED`);
  }

  return value;
}

function appendSetCookie(res: NextApiResponse, cookie: string) {
  const existing = res.getHeader("Set-Cookie");
  const cookies = existing
    ? Array.isArray(existing)
      ? existing
      : [String(existing)]
    : [];

  res.setHeader("Set-Cookie", [...cookies, cookie]);
}

function singleQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requireWorkspaceId(req: NextApiRequest): string {
  const workspaceId = singleQueryValue(req.query.workspace_id);

  if (!workspaceId) {
    throw new RequestValidationError("WORKSPACE_ID_REQUIRED");
  }

  if (!UUID_PATTERN.test(workspaceId)) {
    throw new RequestValidationError("WORKSPACE_ID_INVALID");
  }

  return workspaceId;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const workspaceId = requireWorkspaceId(req);
    const url = assertEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    const anonKey = assertEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const key = assertEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);

    const userSupabase = createServerClient(url, anonKey, {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          appendSetCookie(
            res,
            serialize(name, value, { path: "/", ...options })
          );
        },
        remove(name, options) {
          appendSetCookie(
            res,
            serialize(name, "", { path: "/", maxAge: 0, ...options })
          );
        },
      },
    });
    const serviceSupabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ ok: false, error: "NOT_AUTHENTICATED" });
    }

    const { data: membership, error: membershipError } = await serviceSupabase
      .schema("core")
      .from("workspace_members")
      .select("workspace_id,user_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      return res.status(500).json({
        ok: false,
        error: `MEMBERSHIP_LOOKUP_FAILED: ${membershipError.message}`,
      });
    }

    if (!membership) {
      return res.status(403).json({ ok: false, error: "INVALID_WORKSPACE_ACCESS" });
    }

    const { data: receipts, error: receiptError } = await serviceSupabase
      .schema("receipts")
      .from("receipts")
      .select(
        "id,obligation_id,emitted_at,receipt_hash,seq,resolution_type,proof_status,reason"
      )
      .eq("workspace_id", workspaceId)
      .order("emitted_at", { ascending: false })
      .limit(500);

    if (receiptError) {
      throw new Error(receiptError.message);
    }

    const rows = (receipts ?? []) as ReceiptExportRow[];

    return res.status(200).json({
      ok: true,
      workspace_id: workspaceId,
      exported_at: new Date().toISOString(),
      receipt_count: rows.length,
      receipts: rows,
    });
  } catch (err) {
    const statusCode = err instanceof RequestValidationError ? 400 : 500;

    return res.status(statusCode).json({
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : "UNKNOWN_ERROR",
    });
  }
}
