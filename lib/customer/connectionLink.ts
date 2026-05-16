import { createHash, createHmac, timingSafeEqual } from "crypto";

const VERSION = "v1";

export type ConnectionPayload = {
  workspaceId: string;
  userId: string;
  watchedWork: string;
  proofRequired: string;
  boardLabel: string;
  obligationCode: string;
  sourceType: string;
  connectedSystemId?: string;
  connectorType?: string;
};

function signingKey(): string {
  const value =
    process.env.AUTOKIRK_CONNECTION_LINK_KEY ??
    process.env.AUTOKIRK_BOARD_LINK_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!value?.trim()) {
    throw new Error("CONNECTION_LINK_KEY_REQUIRED");
  }

  return value;
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function signature(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function createConnectionToken(payload: ConnectionPayload): string {
  const encoded = encodeJson({ version: VERSION, ...payload });
  return `${encoded}.${signature(encoded)}`;
}

export function hashConnectionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyConnectionToken(token: string | null | undefined): ConnectionPayload | null {
  if (!token || !token.includes(".")) return null;

  const [payload, receivedSignature] = token.split(".");
  if (!payload || !receivedSignature) return null;

  const expectedSignature = signature(payload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  const decoded = decodeJson<ConnectionPayload & { version?: string }>(payload);
  if (decoded.version !== VERSION) return null;

  return {
    workspaceId: decoded.workspaceId,
    userId: decoded.userId,
    watchedWork: decoded.watchedWork,
    proofRequired: decoded.proofRequired,
    boardLabel: decoded.boardLabel,
    obligationCode: decoded.obligationCode,
    sourceType: decoded.sourceType,
    connectedSystemId: decoded.connectedSystemId,
    connectorType: decoded.connectorType,
  };
}

function pathForSourceType(sourceType: string): string {
  switch (sourceType) {
    case "crm":
      return "crm";
    case "website-form":
      return "form";
    case "email":
      return "email";
    case "agent":
      return "agent";
    case "mcp":
      return "mcp";
    case "automation":
      return "automation";
    case "payment":
    case "job-system":
    case "api":
    case "webhook":
    case "other":
      return "webhook";
    default:
      return "source";
  }
}

export function buildConnectionUrl(token: string, sourceType = "source"): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "https://autokirk.com";
  const baseUrl = configured.replace(/\/$/, "");
  const url = new URL(`/api/intake/${pathForSourceType(sourceType)}`, baseUrl);
  url.searchParams.set("key", token);
  return url.toString();
}
