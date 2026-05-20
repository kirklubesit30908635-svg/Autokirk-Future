begin;

-- Retire the legacy api.ingest_event_to_obligation overload left behind
-- when intake due_at support added a new canonical signature.
--
-- Without this cleanup, calls that provide the original seven arguments match
-- both:
--   api.ingest_event_to_obligation(uuid, uuid, text, text, text, jsonb, timestamptz, text)
-- and:
--   api.ingest_event_to_obligation(uuid, uuid, text, text, text, jsonb, timestamptz, text, timestamptz)
-- because the trailing parameters have defaults. That makes sealed proof SQL fail
-- with SQLSTATE 42725 instead of reaching the governed ingest -> resolve path.

-- Drop the public wrapper first because it was bound to the legacy overload.
drop function if exists public.ingest_event_to_obligation(
    uuid,
    uuid,
    text,
    text,
    text,
    jsonb,
    timestamptz
);

-- Keep the current canonical 9-argument function. Remove only obsolete API
-- overloads that conflict with default-argument resolution.
drop function if exists api.ingest_event_to_obligation(
    uuid,
    uuid,
    text,
    text,
    text,
    jsonb,
    timestamptz
);

drop function if exists api.ingest_event_to_obligation(
    uuid,
    uuid,
    text,
    text,
    text,
    jsonb,
    timestamptz,
    text
);

-- Recreate the public compatibility wrapper against the canonical API surface.
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
    p_workspace_id => p_workspace_id,
    p_actor_id => p_actor_id,
    p_source_system => p_source_system,
    p_source_event_key => p_source_event_key,
    p_source_event_type => p_source_event_type,
    p_payload => p_payload,
    p_occurred_at => p_occurred_at,
    p_obligation_code => null::text,
    p_due_at => null::timestamptz
  );
$$;

commit;
