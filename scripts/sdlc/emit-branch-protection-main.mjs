#!/usr/bin/env node
import fs from 'node:fs';

const repo = process.env.GITHUB_REPOSITORY || 'kirklubesit30908635-svg/Autokirk-Future';
const token = process.env.GITHUB_TOKEN;
const [owner, name] = repo.split('/');
const api = 'https://api.github.com';

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};
if (token) headers.Authorization = `Bearer ${token}`;

async function getJson(path) {
  const response = await fetch(`${api}${path}`, { headers });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { ok: response.ok, status: response.status, body };
}

const repoResult = await getJson(`/repos/${owner}/${name}`);
const protectionResult = await getJson(`/repos/${owner}/${name}/branches/main/protection`);
const rulesetsResult = await getJson(`/repos/${owner}/${name}/rules/branches/main`);

const protection = protectionResult.ok ? protectionResult.body : null;
const rulesets = rulesetsResult.ok && Array.isArray(rulesetsResult.body) ? rulesetsResult.body : [];

const requiredContexts = new Set();
const protectionContexts = protection?.required_status_checks?.contexts || [];
for (const context of protectionContexts) requiredContexts.add(context);

for (const ruleset of rulesets) {
  for (const rule of ruleset.rules || []) {
    if (rule.type === 'required_status_checks') {
      for (const check of rule.parameters?.required_status_checks || []) {
        if (check.context) requiredContexts.add(check.context);
      }
    }
  }
}

const hasProtection = protectionResult.ok || rulesets.length > 0;
const blocksForcePushes = protection?.allow_force_pushes?.enabled === false || rulesets.some((r) => (r.rules || []).some((rule) => rule.type === 'non_fast_forward'));
const blocksDeletions = protection?.allow_deletions?.enabled === false || rulesets.some((r) => (r.rules || []).some((rule) => rule.type === 'deletion'));
const requiresPr = Boolean(protection?.required_pull_request_reviews) || rulesets.some((r) => (r.rules || []).some((rule) => rule.type === 'pull_request'));
const hasProofGate = requiredContexts.has('AUTOKIRK_PROOF_GATE_OK');

const checks = {
  default_branch_main: repoResult.body?.default_branch === 'main',
  branch_protection_or_ruleset_present: hasProtection,
  force_pushes_blocked: blocksForcePushes,
  deletions_blocked: blocksDeletions,
  pull_request_flow_required: requiresPr,
  proof_gate_required: hasProofGate
};

const passed = Object.values(checks).every(Boolean);
const event = {
  schema: 'autokirk.sdlc_source_event.v1',
  workspace_code: 'kdh_internal_sdlc',
  obligation_code: 'branch_protection_main',
  source_system: 'github',
  source_claim: 'main branch is protected and cannot bypass the proof gate',
  observed_at: new Date().toISOString(),
  status: passed ? 'proof_ready' : 'failed_proof',
  subject: { repository: repo, branch: 'main' },
  checks,
  proof: {
    repo: repoResult.body ? { default_branch: repoResult.body.default_branch, visibility: repoResult.body.visibility } : null,
    branch_protection_http_status: protectionResult.status,
    rulesets_http_status: rulesetsResult.status,
    required_contexts: Array.from(requiredContexts).sort(),
    ruleset_names: rulesets.map((r) => r.name).filter(Boolean)
  },
  rationale: Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => `${name} is not proven`)
};

fs.mkdirSync('sdlc-events', { recursive: true });
fs.writeFileSync('sdlc-events/branch_protection_main.json', JSON.stringify(event, null, 2) + '\n');
console.log(JSON.stringify(event, null, 2));
process.exit(passed ? 0 : 1);
