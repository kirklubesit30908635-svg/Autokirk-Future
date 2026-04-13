create table if not exists core.obligation_sources (
    obligation_id uuid primary key references core.obligations(id) on delete cascade,
    source_event_id uuid not null unique references ingest.source_events(id) on delete cascade,
    linked_at timestamptz not null default now()
);
