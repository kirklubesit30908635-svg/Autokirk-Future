create table if not exists core.workspace_members (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    user_id uuid not null,
    role text not null default 'member',
    created_at timestamptz not null default now(),
    unique (workspace_id, user_id)
);
