import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const LOCAL_WORKSPACE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DEFAULT_EMAIL = "board.local+actor1111@autokirk.local";
const DEFAULT_PASSWORD = "autokirk-local-dev-pass";
const DEFAULT_SITE_URL = "http://localhost:3000";

function fail(message) {
  console.error(`LOCAL_BOARD_AUTH_SEED_FAILED: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const value = argv[i + 1];

    if (!value || value.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = value;
    i += 1;
  }

  return parsed;
}

function parseDotenvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    let value = match[2] ?? "";

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function requireEnv(env, key) {
  const value = env[key];
  if (!value || !String(value).trim()) {
    fail(`${key} is required`);
  }
  return String(value).trim();
}

function isLocalhost(urlValue) {
  try {
    const parsed = new URL(urlValue);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

function maskToken(token) {
  if (!token || token.length < 18) {
    return "<redacted>";
  }

  return `${token.slice(0, 8)}...${token.slice(-8)}`;
}

async function ensureLocalAuthUser(serviceClient, email, password) {
  const createPayload = {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      local_only: true,
      purpose: "system-proof-board-smoke-login",
    },
  };
  const { data: created, error: createError } =
    await serviceClient.auth.admin.createUser(createPayload);

  if (!createError && created.user?.id) {
    return { userId: created.user.id, created: true };
  }

  const errorText = createError?.message ?? "UNKNOWN_AUTH_CREATE_ERROR";
  const alreadyExists = /already|exists|registered/i.test(errorText);

  if (!alreadyExists) {
    fail(`unable to create local auth user (${errorText})`);
  }

  const { data: listed, error: listError } =
    await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (listError) {
    fail(`unable to list auth users (${listError.message})`);
  }

  const existing = (listed?.users ?? []).find(
    (candidate) => candidate.email?.toLowerCase() === email.toLowerCase()
  );

  if (!existing?.id) {
    fail("auth user exists by email but could not be resolved by admin list");
  }

  const { data: updated, error: updateError } =
    await serviceClient.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: createPayload.user_metadata,
    });

  if (updateError || !updated.user?.id) {
    fail(`unable to update existing auth user (${updateError?.message ?? "UNKNOWN_AUTH_UPDATE_ERROR"})`);
  }

  return { userId: updated.user.id, created: false };
}

function requireUuid(value, name) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    fail(`${name} must be a UUID (${value})`);
  }

  return value;
}

function upsertWorkspaceMembershipWithLocalDb(userId) {
  requireUuid(userId, "user_id");
  requireUuid(LOCAL_WORKSPACE_ID, "workspace_id");

  const sql = `
insert into core.workspace_members (workspace_id, user_id, role)
values ('${LOCAL_WORKSPACE_ID}'::uuid, '${userId}'::uuid, 'owner')
on conflict (workspace_id, user_id)
do update set role = excluded.role;
`;

  try {
    execFileSync(
      "supabase",
      ["db", "query", sql, "--local", "--output", "json"],
      {
        cwd: process.cwd(),
        stdio: "pipe",
        encoding: "utf8",
      }
    );
  } catch (error) {
    const stderr =
      typeof error?.stderr === "string" && error.stderr.trim()
        ? error.stderr.trim()
        : "UNKNOWN_SUPABASE_DB_QUERY_ERROR";
    fail(
      `unable to upsert core.workspace_members through local db query (${stderr})`
    );
  }
}

function buildBoardSessionUrl(siteUrl, session) {
  if (!session?.access_token || !session?.refresh_token) {
    fail("sign-in response did not include session tokens");
  }

  const boardUrl = new URL("/system-proof", siteUrl);
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: session.token_type ?? "bearer",
    expires_in: String(session.expires_in ?? 3600),
    expires_at: String(session.expires_at ?? ""),
  });
  boardUrl.hash = hash.toString();

  return boardUrl.toString();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const envFromFile = parseDotenvFile(path.join(cwd, ".env.local"));
  const env = {
    ...envFromFile,
    ...process.env,
  };

  const supabaseUrl = requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");

  if (!isLocalhost(supabaseUrl)) {
    fail(`NEXT_PUBLIC_SUPABASE_URL must be localhost/127.0.0.1 for this helper (${supabaseUrl})`);
  }

  const siteUrl = String(
    args["site-url"] ||
      env.LOCAL_BOARD_SITE_URL ||
      DEFAULT_SITE_URL
  ).trim();

  if (!isLocalhost(siteUrl)) {
    fail(`site URL must be localhost/127.0.0.1 for this helper (${siteUrl})`);
  }

  const email = String(args.email || env.LOCAL_BOARD_DEV_EMAIL || DEFAULT_EMAIL).trim();
  const password = String(
    args.password || env.LOCAL_BOARD_DEV_PASSWORD || DEFAULT_PASSWORD
  ).trim();

  if (!email) {
    fail("email cannot be empty");
  }
  if (!password) {
    fail("password cannot be empty");
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { userId, created } = await ensureLocalAuthUser(serviceClient, email, password);
  upsertWorkspaceMembershipWithLocalDb(userId);

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    fail(`password sign-in failed (${signInError.message})`);
  }

  const boardSessionUrl = buildBoardSessionUrl(siteUrl, signInData.session);

  console.log("LOCAL_BOARD_AUTH_SEED_OK");
  console.log(`workspace_id=${LOCAL_WORKSPACE_ID}`);
  console.log(`user_id=${userId}`);
  console.log(`user_created=${created ? "true" : "false"}`);
  console.log(`email=${email}`);
  console.log(`session_access_token=${maskToken(signInData.session?.access_token)}`);
  console.log("");
  console.log("Open this URL in the same browser profile that runs local board smoke checks:");
  console.log(boardSessionUrl);
}

await main();
