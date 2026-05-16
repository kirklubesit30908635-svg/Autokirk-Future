import { createHmac, timingSafeEqual } from "crypto";

const BOARD_TOKEN_VERSION = "v1";
const PROOF_ACTION_TOKEN_VERSION = "pa1";
const SUPABASE_URL_FALLBACK = "https://aiuicbyufelqdeiwhmyi.supabase.co";

type ProofActionPayload = {
  workspaceId: string;
  obligationId: string;
  action: "close_with_proof";
  expiresAt: number;
};

function signingKey(kind: "board" | "proof-action"): string {
  const value =
    kind === "proof-action"
      ? process.env.AUTOKIRK_PROOF_ACTION_KEY ??
        process.env.AUTOKIRK_BOARD_LINK_KEY ??
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.STRIPE_WEBHOOK_SECRET
      : process.env.AUTOKIRK_BOARD_LINK_KEY ??
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.STRIPE_WEBHOOK_SECRET;

  if (!value || !value.trim()) {
    throw new Error(kind === "proof-action" ? "PROOF_ACTION_KEY_REQUIRED" : "BOARD_LINK_KEY_REQUIRED");
  }

  return value;
}

function boardDigest(workspaceId: string): string {
  return createHmac("sha256", signingKey("board"))
    .update(`${BOARD_TOKEN_VERSION}:${workspaceId}`)
    .digest("hex");
}

function proofActionDigest(payload: ProofActionPayload): string {
  return createHmac("sha256", signingKey("proof-action"))
    .update(`${PROOF_ACTION_TOKEN_VERSION}:${payload.workspaceId}:${payload.obligationId}:${payload.action}:${payload.expiresAt}`)
    .digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const received = Buffer.from(left);
  const target = Buffer.from(right);

  if (received.length !== target.length) return false;
  return timingSafeEqual(received, target);
}

export function signBoardToken(workspaceId: string): string {
  return `${BOARD_TOKEN_VERSION}.${boardDigest(workspaceId)}`;
}

export function verifyBoardToken(workspaceId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  return safeEqual(token, signBoardToken(workspaceId));
}

export function signProofActionToken(input: {
  workspaceId: string;
  obligationId: string;
  expiresInSeconds?: number;
}): string {
  const payload: ProofActionPayload = {
    workspaceId: input.workspaceId,
    obligationId: input.obligationId,
    action: "close_with_proof",
    expiresAt: Math.floor(Date.now() / 1000) + (input.expiresInSeconds ?? 900),
  };
  const digest = proofActionDigest(payload);

  return [
    PROOF_ACTION_TOKEN_VERSION,
    payload.workspaceId,
    payload.obligationId,
    payload.action,
    String(payload.expiresAt),
    digest,
  ].join(".");
}

export function verifyProofActionToken(input: {
  workspaceId: string;
  obligationId: string;
  token: string | null | undefined;
  now?: number;
}): boolean {
  if (!input.token) return false;

  const [version, workspaceId, obligationId, action, expiresAtRaw, digest] = input.token.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (version !== PROOF_ACTION_TOKEN_VERSION) return false;
  if (workspaceId !== input.workspaceId) return false;
  if (obligationId !== input.obligationId) return false;
  if (action !== "close_with_proof") return false;
  if (!Number.isFinite(expiresAt)) return false;
  if (expiresAt < (input.now ?? Math.floor(Date.now() / 1000))) return false;
  if (!digest) return false;

  const expected = proofActionDigest({
    workspaceId,
    obligationId,
    action: "close_with_proof",
    expiresAt,
  });

  return safeEqual(digest, expected);
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