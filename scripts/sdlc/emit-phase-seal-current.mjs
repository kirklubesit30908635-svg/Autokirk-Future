#!/usr/bin/env node
import fs from 'node:fs';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = process.env.SUPABASE_PROJECT_REF || 'aiuicbyufelqdeiwhmyi';

function missingEnvEvent(missing) {
  return {
    schema: 'autokirk.sdlc_source_event.v1',
    workspace_code: 'kdh_internal_sdlc',
    obligation_code: 'phase_seal_current',
    source_system: 'supabase',
    source_claim: 'live kernel state supports the current phase seal claim',
    observed_at: new Date().toISOString(),
    status: 'awaiting_proof',
    subject: { project_ref: projectRef },
    checks: {
      supabase_url_configured: Boolean(supabaseUrl),
      service_role_key_configured: Boolean(serviceRoleKey),
      snapshot_rpc_available: false,
      receipt_invariant_holds: false,
      protected_rls_queried: false
    },
    proof: { missing_env: missing },
    rationale: [`Missing environment required for live Supabase proof: ${missing.join(', ')}`]
  };
}

async function postRpc(functionName, body = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
  return { ok: response.ok, status: response.status, payload };
}

const missing = [];
if (!supabaseUrl) missing.push('SUPABASE_URL');
if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

let event;
if (missing.length) {
  event = missingEnvEvent(missing);
} else {
  const snapshot = await postRpc('sdlc_phase_seal_current_snapshot', {});
  const payload = snapshot.payload;
  const checks = {
    supabase_url_configured: true,
    service_role_key_configured: true,
    snapshot_rpc_available: snapshot.ok,
    receipt_invariant_holds: Boolean(payload?.receipt_invariant_holds),
    protected_rls_queried: Array.isArray(payload?.protected_table_rls) && payload.protected_table_rls.length > 0,
    protected_rls_enabled: Array.isArray(payload?.protected_table_rls) && payload.protected_table_rls.every((row) => row.rls_enabled === true)
  };
  const passed = Object.values(checks).every(Boolean);
  event = {
    schema: 'autokirk.sdlc_source_event.v1',
    workspace_code: 'kdh_internal_sdlc',
    obligation_code: 'phase_seal_current',
    source_system: 'supabase',
    source_claim: 'live kernel state supports the current phase seal claim',
    observed_at: new Date().toISOString(),
    status: passed ? 'proof_ready' : 'failed_proof',
    subject: { project_ref: projectRef },
    checks,
    proof: {
      snapshot_rpc_http_status: snapshot.status,
      snapshot: payload
    },
    rationale: Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => `${name} is not proven`)
  };
}

fs.mkdirSync('sdlc-events', { recursive: true });
fs.writeFileSync('sdlc-events/phase_seal_current.json', JSON.stringify(event, null, 2) + '\n');
console.log(JSON.stringify(event, null, 2));
process.exit(event.status === 'proof_ready' ? 0 : 1);
