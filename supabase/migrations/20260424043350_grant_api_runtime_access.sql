begin;

grant usage on schema api to service_role;

grant execute on function api.ingest_event_to_obligation(
  uuid,
  uuid,
  text,
  text,
  text,
  jsonb,
  timestamptz,
  text
) to service_role;

grant execute on function api.resolve_obligation(
  uuid,
  uuid,
  text,
  text,
  jsonb,
  jsonb,
  text,
  text
) to service_role;

commit;
