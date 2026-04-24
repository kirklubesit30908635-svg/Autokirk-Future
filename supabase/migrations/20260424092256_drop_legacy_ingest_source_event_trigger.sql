begin;

drop trigger if exists trg_ingest_event_to_obligation on ingest.source_events;
drop function if exists ingest.ingest_event_to_obligation();

commit;
