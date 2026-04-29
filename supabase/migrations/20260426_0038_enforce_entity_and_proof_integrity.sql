begin;

-- enforce entity binding
alter table core.obligations
  alter column entity_id set not null;

alter table ingest.source_events
  alter column entity_id set not null,
  alter column source_event_key set not null,
  alter column source_system set not null,
  alter column source_event_type set not null;

alter table receipts.receipts
  alter column entity_id set not null,
  alter column proof_status set not null;

-- enforce idempotency
create unique index if not exists source_events_idempotency_uidx
on ingest.source_events (workspace_id, source_system, source_event_key);

commit;