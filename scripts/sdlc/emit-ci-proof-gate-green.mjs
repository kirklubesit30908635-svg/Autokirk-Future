#!/usr/bin/env node
import fs from 'node:fs';

const repo = process.env.GITHUB_REPOSITORY || 'kirklubesit30908635-svg/Autokirk-Future';
const token = process.env.GITHUB_TOKEN;
const [owner, name] = repo.split('/');
const api = 'https://api.github.com';
const workflowName = 'AutoKirk Future Proof Gate';

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

const branchResult = await getJson(`/repos/${owner}/${name}/branches/main`);
const headSha = branchResult.body?.commit?.sha || process.env.GITHUB_SHA || null;
const runsResult = await getJson(`/repos/${owner}/${name}/actions/runs?branch=main&per_page=20`);
const runs = runsResult.body?.workflow_runs || [];
const matchingRuns = runs.filter((run) => run.name === workflowName || run.path?.endsWith('/proof.yml'));
const currentRun = matchingRuns.find((run) => run.head_sha === headSha) || null;

let jobsResult = { ok: false, status: null, body: null };
let jobs = [];
if (currentRun) {
  jobsResult = await getJson(`/repos/${owner}/${name}/actions/runs/${currentRun.id}/jobs?per_page=100`);
  jobs = jobsResult.body?.jobs || [];
}

const proofGateJob = jobs.find((job) => job.name === 'AUTOKIRK_PROOF_GATE_OK') || null;
const checks = {
  main_head_known: Boolean(headSha),
  workflow_run_found_for_main_head: Boolean(currentRun),
  workflow_run_completed: currentRun?.status === 'completed',
  workflow_run_success: currentRun?.conclusion === 'success',
  proof_gate_job_found: Boolean(proofGateJob),
  proof_gate_job_success: proofGateJob?.conclusion === 'success'
};
const passed = Object.values(checks).every(Boolean);

const event = {
  schema: 'autokirk.sdlc_source_event.v1',
  workspace_code: 'kdh_internal_sdlc',
  obligation_code: 'ci_proof_gate_green',
  source_system: 'github_actions',
  source_claim: 'current main has a green AutoKirk proof gate',
  observed_at: new Date().toISOString(),
  status: passed ? 'proof_ready' : 'failed_proof',
  subject: { repository: repo, branch: 'main', head_sha: headSha },
  checks,
  proof: {
    workflow_name: workflowName,
    runs_http_status: runsResult.status,
    branch_http_status: branchResult.status,
    selected_run: currentRun ? {
      id: currentRun.id,
      html_url: currentRun.html_url,
      status: currentRun.status,
      conclusion: currentRun.conclusion,
      head_sha: currentRun.head_sha,
      created_at: currentRun.created_at,
      updated_at: currentRun.updated_at
    } : null,
    proof_gate_job: proofGateJob ? {
      id: proofGateJob.id,
      html_url: proofGateJob.html_url,
      status: proofGateJob.status,
      conclusion: proofGateJob.conclusion,
      started_at: proofGateJob.started_at,
      completed_at: proofGateJob.completed_at
    } : null
  },
  rationale: Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => `${name} is not proven`)
};

fs.mkdirSync('sdlc-events', { recursive: true });
fs.writeFileSync('sdlc-events/ci_proof_gate_green.json', JSON.stringify(event, null, 2) + '\n');
console.log(JSON.stringify(event, null, 2));
process.exit(passed ? 0 : 1);
