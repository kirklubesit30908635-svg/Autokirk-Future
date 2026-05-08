-- Task 0D: Retire legacy direct-write bypass function
-- Canonical replacement: api.ingest_event_to_obligation
drop function if exists api.ingest_event_create_obligation(uuid, text, text, jsonb, text);
