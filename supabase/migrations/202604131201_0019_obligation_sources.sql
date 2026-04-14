create table if not exists core.obligation_sources (
    obligation_id uuid primary key references core.obligations(id) on delete cascade,
    source_event_id uuid not null unique references ingest.source_events(id) on delete cascade,
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    source_system text not null,
    source_event_key text not null,
    linked_at timestamptz not null default now(),
    unique (workspace_id, source_system, source_event_key)
);
