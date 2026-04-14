create schema if not exists ingest;

create table if not exists ingest.source_events (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    source_system text not null,
    source_event_key text not null,
    source_event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    occurred_at timestamptz not null default now(),
    received_at timestamptz not null default now(),
    created_by uuid not null,
    created_at timestamptz not null default now(),
    unique (workspace_id, source_system, source_event_key)
);
