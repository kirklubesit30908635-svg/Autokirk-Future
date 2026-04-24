begin;

create or replace function public.ingest_event_to_obligation(
    p_workspace_id uuid,
    p_actor_id uuid,
    p_source_system text,
    p_source_event_key text,
    p_source_event_type text,
    p_payload jsonb default '{}'::jsonb,
    p_occurred_at timestamptz default null
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select api.ingest_event_to_obligation(
    p_workspace_id,
    p_actor_id,
    p_source_system,
    p_source_event_key,
    p_source_event_type,
    p_payload,
    p_occurred_at
  );
$$;

commit;
