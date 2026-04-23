create table if not exists core.obligations (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    status text not null default 'open',
    resolution_type text null,
    resolution_reason text null,
    proof_status text not null default 'pending',
    created_at timestamptz not null default now(),
    resolved_at timestamptz null
);
