-- 0051_intake_commit_boundary
-- Purpose:
-- Establish the first canonical kernel boundary for Visual Intake Face.
-- This migration is intentionally a bounded starting point.
-- It does NOT implement staging.
-- It does NOT implement UI behavior.
-- It only declares the governed commit surface to be filled in cleanly.

begin;

-- -------------------------------------------------------------------
-- Canonical note
-- -------------------------------------------------------------------
-- Visual Intake Face may not write directly to core.objects or
-- core.obligations.
-- All governed mutation must route through api.* SECURITY DEFINER
-- functions and preserve append-only event discipline.

-- -------------------------------------------------------------------
-- Placeholder function contract
-- -------------------------------------------------------------------
-- Replace argument types and body only after repo-state inspection proves:
-- 1. canonical object acknowledgment path
-- 2. canonical obligation open path
-- 3. canonical append_event path
-- 4. required workspace membership guards
--
-- This stub is here to lock the name and purpose of the first slice.

create or replace function api.commit_intake_candidate(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_object_id uuid,
  p_obligation_code text,
  p_trigger_text text,
  p_source_signal_ref text,
  p_operator_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = api, core, ledger, receipts, signals, public
as $$
begin
  raise exception using
    message = 'api.commit_intake_candidate not implemented',
    detail = 'This function name is reserved as the canonical intake-to-kernel commit boundary.',
    hint = 'Implement only after proving canonical object and obligation mutation paths in current repo state.';
end;
$$;

comment on function api.commit_intake_candidate(
  uuid, uuid, uuid, text, text, text, text
) is
'Canonical Visual Intake Face commit boundary. Candidate -> explicit operator commit -> governed mutation path.';

commit;
