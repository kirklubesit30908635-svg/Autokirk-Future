import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { buildSignedBoardUrl, supabaseUrl } from "../../../lib/board/signedBoardUrl";

type AccountLinkResponse =
  | {
      ok: true;
      workspace_id: string;
      board_url: string;
      workspace_name: string | null;
    }
  | { ok: false; error: string; detail?: string };

const DEFAULT_WORKSPACE_ID = "88eecda6-80e4-4eb7-b890-4330674fa7a7";
const DEFAULT_WORKSPACE_NAME = "AutoKirk Platform Launch Workspace";

function slugPart(value: string | null | undefined): string {
  const clean = (value ?? "customer")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 34);

  return clean || "customer";
}

function serviceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED");
  }

  return createClient(supabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountLinkResponse>
) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const authHeader = req.headers.authorization;
    const accessToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;
    const supabase = serviceClient();

    if (!accessToken) {
      return res.status(200).json({
        ok: true,
        workspace_id: DEFAULT_WORKSPACE_ID,
        board_url: buildSignedBoardUrl(DEFAULT_WORKSPACE_ID),
        workspace_name: DEFAULT_WORKSPACE_NAME,
      });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }

    const { data: existingMembership, error: existingMembershipError } = await supabase
      .schema("core")
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingMembershipError) {
      return res.status(500).json({
        ok: false,
        error: "MEMBERSHIP_LOOKUP_FAILED",
        detail: existingMembershipError.message,
      });
    }

    let workspaceId = existingMembership?.workspace_id as string | undefined;

    if (!workspaceId) {
      const email = user.email ?? "customer@autokirk.com";
      const baseName = email.split("@")[0] || "customer";

      const { data: entity, error: entityError } = await supabase
        .schema("core")
        .from("legal_entities")
        .insert({ entity_name: `${baseName} AutoKirk Account`, entity_type: "subscriber" })
        .select("id")
        .single();

      if (entityError || !entity) {
        return res.status(500).json({
          ok: false,
          error: "ENTITY_CREATE_FAILED",
          detail: entityError?.message,
        });
      }

      const { data: workspace, error: workspaceError } = await supabase
        .schema("core")
        .from("workspaces")
        .insert({
          name: `${baseName} AutoKirk Board`,
          entity_id: entity.id,
        })
        .select("id")
        .single();

      if (workspaceError || !workspace) {
        return res.status(500).json({
          ok: false,
          error: "WORKSPACE_CREATE_FAILED",
          detail: workspaceError?.message,
        });
      }

      workspaceId = workspace.id;

      const { error: memberError } = await supabase
        .schema("core")
        .from("workspace_members")
        .insert({ workspace_id: workspaceId, user_id: user.id, role: "owner" });

      if (memberError) {
        return res.status(500).json({
          ok: false,
          error: "MEMBERSHIP_CREATE_FAILED",
          detail: memberError.message,
        });
      }
    }

    const { data: workspaceRow } = await supabase
      .schema("core")
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .maybeSingle();

    return res.status(200).json({
      ok: true,
      workspace_id: workspaceId,
      workspace_name: workspaceRow?.name ?? `${slugPart(user.email)} AutoKirk Board`,
      board_url: buildSignedBoardUrl(workspaceId),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "ACCOUNT_LINK_FAILED",
      detail: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
