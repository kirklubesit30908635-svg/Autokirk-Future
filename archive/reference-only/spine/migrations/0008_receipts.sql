create table if not exists receipts.receipts (
    id uuid primary key default gen_random_uuid(),
    obligation_id uuid not null references core.obligations(id) on delete cascade,
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    actor_id uuid not null,
    resolution_type text not null,
    reason text not null,
    evidence_present jsonb not null default '{}'::jsonb,
    failed_checks jsonb not null default '[]'::jsonb,
    proof_status text not null,
    rule_version text not null,
    emitted_at timestamptz not null default now()
);
