begin;

grant usage on schema api to service_role;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname = 'ingest_event_to_obligation'
      and oidvectortypes(p.proargtypes) = 'uuid, uuid, text, text, text, jsonb, timestamp with time zone, text'
  ) then
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
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname = 'resolve_obligation'
      and oidvectortypes(p.proargtypes) = 'uuid, uuid, text, text, jsonb, jsonb, text, text'
  ) then
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
  end if;
end
$$;

commit;
