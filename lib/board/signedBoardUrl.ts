import { createHmac, timingSafeEqual } from "crypto";

const BOARD_TOKEN_VERSION = "v1";
const SUPABASE_URL_FALLBACK = "https://aiuicbyufelqdeiwhmyi.supabase.co";

function boardSigningKey(): string {
  const value =
    process.env.AUTOKIRK_BOARD_LINK_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!value || !value.trim()) {
    throw new Error("BOARD_LINK_KEY_REQUIRED");
  }

  return value;
}

function digest(workspaceId: string): string {
  return createHmac("sha256", boardSigningKey())
    .update(`${BOARD_TOKEN_VERSION}:${workspaceId}`)
    .digest("hex");
}

export function signBoardToken(workspaceId: string): string {
  return `${BOARD_TOKEN_VERSION}.${digest(workspaceId)}`;
}

export function verifyBoardToken(workspaceId: string, token: string | null | undefined): boolean {
  if (!token) return false;

  const expected = signBoardToken(workspaceId);
  const received = Buffer.from(token);
  const target = Buffer.from(expected);

  if (received.length !== target.length) return false;
  return timingSafeEqual(received, target);
}

export function siteBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "https://autokirk.com";

  return configured.replace(/\/$/, "");
}

export function supabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    SUPABASE_URL_FALLBACK
  );
}

export function buildSignedBoardUrl(workspaceId: string): string {
  const url = new URL(`/board/${workspaceId}`, siteBaseUrl());
  url.searchParams.set("key", signBoardToken(workspaceId));
  return url.toString();
}
