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

type StripeCheckoutSession = {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
};

const DEFAULT_WORKSPACE_NAME = "AutoKirk Platform Launch Workspace";
const CHECKOUT_SESSION_PATTERN = /^cs_(test|live)_[A-Za-z0-9_]+$/;

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

function idFrom(value: string | { id?: string } | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

function normalizedEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email && email.includes("@") ? email : null;
}

function requestCheckoutSessionId(req: NextApiRequest): string | null {
  const raw = req.method === "GET" ? req.query.session_id : req.body?.session_id;
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();
  if (!CHECKOUT_SESSION_PATTERN.test(trimmed)) {
    throw new Error("INVALID_CHECKOUT_SESSION_ID");
  }

  return trimmed;
}

async function fetchStripeCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey?.trim()) {
    throw new Error("STRIPE_SECRET_KEY_REQUIRED_FOR_CHECKOUT_BINDING");
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${stripeSecretKey}`,
      },
    }
  );

  const body = await response.json();
  if (!response.ok) {
    const message = typeof body?.error?.message === "string" ? body.error.message : "STRIPE_SESSION_LOOKUP_FAILED";
    throw new Error(message);
  }

  return body as StripeCheckoutSession;
}

async function bindCheckoutSession(input: {
  supabase: ReturnType<typeof serviceClient>;
  sessionId: string;
  userEmail: string | null;
  userId: string;
  workspaceId: string;
}): Promise<void> {
  const checkout = await fetchStripeCheckoutSession(input.sessionId);

  if (checkout.status && checkout.status !== "complete") {
    throw new Error("CHECKOUT_SESSION_NOT_COMPLETE");
  }

  const checkoutEmail =
    normalizedEmail(checkout.customer_details?.email) ??
    normalizedEmail(checkout.customer_email);

  if (checkoutEmail && input.userEmail && checkoutEmail !== input.userEmail) {
    throw new Error("CHECKOUT_EMAIL_MISMATCH");
  }

  const customerId = idFrom(checkout.customer);
  if (!customerId) {
    throw new Error("CHECKOUT_CUSTOMER_NOT_RESOLVED");
  }

  const { error } = await input.supabase.schema("billing").from("accounts").upsert(
    {
      workspace_id: input.workspaceId,
      actor_id: input.userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: idFrom(checkout.subscription),
      stripe_checkout_session_id: checkout.id,
      customer_email: checkoutEmail ?? input.userEmail,
      status: "active",
      metadata: {
        ...(checkout.metadata ?? {}),
        autokirk_bound_user_id: input.userId,
        autokirk_post_checkout_workspace_id: input.workspaceId,
      },
    },
    { onConflict: "stripe_customer_id" }
  );

  if (error) {
    throw new Error(`CHECKOUT_BILLING_BIND_FAILED:${error.message}`);
  }
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
    const checkoutSessionId = requestCheckoutSessionId(req);
    const authHeader = req.headers.authorization;
    const accessToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;
    const supabase = serviceClient();

    if (!accessToken) {
      return res.status(401).json({
        ok: false,
        error: "AUTH_REQUIRED",
      });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }

    const email = normalizedEmail(user.email) ?? "customer@autokirk.com";
    const baseName = slugPart(email.split("@")[0]);
    const personalWorkspaceName = `${baseName} AutoKirk Board`;

    const { data: memberships, error: membershipError } = await supabase
      .schema("core")
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    if (membershipError) {
      return res.status(500).json({
        ok: false,
        error: "MEMBERSHIP_LOOKUP_FAILED",
        detail: membershipError.message,
      });
    }

    const workspaceIds = (memberships ?? [])
      .map((row) => row.workspace_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    let workspaceId: string | null = null;
    let workspaceName: string | null = null;

    if (workspaceIds.length > 0) {
      const { data: workspaces, error: workspaceLookupError } = await supabase
        .schema("core")
        .from("workspaces")
        .select("id,name")
        .in("id", workspaceIds);

      if (workspaceLookupError) {
        return res.status(500).json({
          ok: false,
          error: "WORKSPACE_LOOKUP_FAILED",
          detail: workspaceLookupError.message,
        });
      }

      const personalWorkspace = workspaces?.find(
        (workspace) => workspace.name === personalWorkspaceName
      );

      if (personalWorkspace) {
        workspaceId = personalWorkspace.id;
        workspaceName = personalWorkspace.name;
      }
    }

    if (!workspaceId) {
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
        .insert({ name: personalWorkspaceName || DEFAULT_WORKSPACE_NAME, entity_id: entity.id })
        .select("id,name")
        .single();

      if (workspaceError || !workspace) {
        return res.status(500).json({
          ok: false,
          error: "WORKSPACE_CREATE_FAILED",
          detail: workspaceError?.message,
        });
      }

      workspaceId = workspace.id;
      workspaceName = workspace.name;

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

    if (!workspaceId) {
      return res.status(500).json({ ok: false, error: "WORKSPACE_ID_NOT_RESOLVED" });
    }

    if (checkoutSessionId) {
      await bindCheckoutSession({
        supabase,
        sessionId: checkoutSessionId,
        userEmail: email,
        userId: user.id,
        workspaceId,
      });
    }

    const resolvedWorkspaceId: string = workspaceId;

    return res.status(200).json({
      ok: true,
      workspace_id: resolvedWorkspaceId,
      workspace_name: workspaceName ?? personalWorkspaceName,
      board_url: buildSignedBoardUrl(resolvedWorkspaceId),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "ACCOUNT_LINK_FAILED",
      detail: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
