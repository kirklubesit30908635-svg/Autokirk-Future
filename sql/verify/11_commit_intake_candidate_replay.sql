with ctx as (
  select
    wm.workspace_id,
    wm.user_id as actor_user_id
  from core.workspace_members wm
  order by wm.created_at
  limit 1
)
select api.commit_intake_candidate(
  p_workspace_id := ctx.workspace_id,
  p_actor_user_id := ctx.actor_user_id,
  p_candidate_ref := 'candidate-001',
  p_obligation_code := 'fulfill_promised_service',
  p_trigger_text := 'customer requested completion before pickup',
  p_source_signal_ref := 'signal-001',
  p_object_anchor := 'boat_23',
  p_action_anchor := 'wash',
  p_trigger_anchor := 'pre_pickup_deadline',
  p_operator_note := 'replay test same candidate'
) as replay_result
from ctx;