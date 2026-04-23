begin;

create or replace function api.commit_intake_candidate(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_candidate_ref text,
  p_obligation_code text,
  p_trigger_text text,
  p_source_signal_ref text,
  p_object_anchor text,
  p_action_anchor text,
  p_trigger_anchor text,
  p_operator_note text default null,
  p_occurred_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_source_event_key text;
  v_payload jsonb;
  v_result jsonb;
begin
  if p_workspace_id is null then
    raise exception 'WORKSPACE_ID_REQUIRED';
  end if;

  if p_actor_user_id is null then
    raise exception 'ACTOR_ID_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_candidate_ref, '')), '') is null then
    raise exception 'CANDIDATE_REF_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_obligation_code, '')), '') is null then
    raise exception 'OBLIGATION_CODE_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_trigger_text, '')), '') is null then
    raise exception 'TRIGGER_TEXT_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_source_signal_ref, '')), '') is null then
    raise exception 'SOURCE_SIGNAL_REF_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_object_anchor, '')), '') is null then
    raise exception 'OBJECT_ANCHOR_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_action_anchor, '')), '') is null then
    raise exception 'ACTION_ANCHOR_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_trigger_anchor, '')), '') is null then
    raise exception 'TRIGGER_ANCHOR_REQUIRED';
  end if;

  perform core.assert_member(p_workspace_id, p_actor_user_id);

  v_source_event_key :=
    'intake:' || p_workspace_id::text || ':' || btrim(p_candidate_ref);

  v_payload :=
    jsonb_build_object(
      'candidate_ref', p_candidate_ref,
      'source_signal_ref', p_source_signal_ref,
      'obligation_code', p_obligation_code,
      'trigger_text', p_trigger_text,
      'operator_note', p_operator_note,
      'anchors', jsonb_build_object(
        'object', p_object_anchor,
        'action', p_action_anchor,
        'trigger', p_trigger_anchor
      )
    );

  v_result := api.ingest_event_to_obligation(
    p_workspace_id => p_workspace_id,
    p_actor_id => p_actor_user_id,
    p_source_system => 'intake',
    p_source_event_key => v_source_event_key,
    p_source_event_type => 'intake_commit',
    p_payload => v_payload,
    p_occurred_at => coalesce(p_occurred_at, now())
  );

  return jsonb_build_object(
    'ok', true,
    'commit_path', 'api.ingest_event_to_obligation',
    'source_event_key', v_source_event_key,
    'result', v_result
  );
end;
$$;

comment on function api.commit_intake_candidate(
  uuid, uuid, text, text, text, text, text, text, text, text, timestamptz
) is
'Visual Intake Face canonical commit wrapper. Validates anchors, constructs deterministic intake event, and routes through api.ingest_event_to_obligation.';

commit;
