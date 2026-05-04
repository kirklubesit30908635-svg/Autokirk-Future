-- 20260504120000_api_create_watchdog_emission.sql
--
-- Purpose:
--   Establish the kernel-governed boundary for watchdog emission row creation.
--
-- Why:
--   pages/api/watchdog/emit-overdue-webhook.ts currently calls:
--     controlClient.from('watchdog_emissions').insert({...})
--   That is an app-layer mutation of a control schema table — a violation of
--   Constitution Article 1 (kernel-only mutation authority) and AXIS 1 in
--   AUTOKIRK_AGENT_HANDOFF.md TASK 0C.
--
--   This migration creates the SECURITY DEFINER api.* function so the app
--   layer has a kernel-governed surface to call instead. It does not change
--   semantics — it makes the existing get-or-create behavior governed.
--
-- Doctrine:
--   - SECURITY DEFINER, owned by the role api.* functions are owned by
--   - search_path pinned (no relative schema lookups)
--   - validates inputs and fails closed on missing identifiers
--   - leans on the unique (obligation_id, delivery_target) index established
--     in 20260423212700_watchdog_delivery_alignment_and_kernel_resolution_guards.sql
--   - returns the canonical row shape consumed by the emit route
--   - execute granted only to service_role (the role used by Next.js routes
--     via SUPABASE_SERVICE_ROLE_KEY)
--
-- Doctrine constraint:
--   - This function does not perform claim or attempt-recording. Those remain
--     the sole authority of api.claim_watchdog_emission() and
--     api.record_watchdog_attempt() — protected surfaces per the handoff.
--   - This function only owns row creation (or idempotent return of an
--     existing row), which today happens at the app layer in violation
--     of AXIS 1.
--
-- Verification after apply:
--   1. supabase db reset --local
--   2. npm run prove                 (all 5 sealed markers must remain green)
--   3. grep -RIn "watchdog_emissions" pages/   (no .insert(...) calls remain)

begin;

create or replace function api.create_watchdog_emission(
  p_obligation_id   uuid,
  p_delivery_target text
)
returns table (
  id              uuid,
  obligation_id   uuid,
  delivery_status text,
  next_retry_at   timestamptz,
  attempt_count   integer,
  max_attempts    integer
)
language plpgsql
security definer
set search_path = api, control, public, pg_temp
as $$
begin
  if p_obligation_id is null then
    raise exception 'OBLIGATION_ID_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_delivery_target, '')), '') is null then
    raise exception 'DELIVERY_TARGET_REQUIRED';
  end if;

  -- Idempotent get-or-create against the unique
  -- (obligation_id, delivery_target) index. Concurrent invocations are safe
  -- because the conflict resolution is "do nothing" and the subsequent
  -- select is by the same key tuple.
  insert into control.watchdog_emissions (
    obligation_id,
    delivery_target,
    delivery_status
  )
  values (
    p_obligation_id,
    p_delivery_target,
    'pending'
  )
  on conflict (obligation_id, delivery_target) do nothing;

  return query
  select
    e.id,
    e.obligation_id,
    e.delivery_status,
    e.next_retry_at,
    coalesce(e.attempt_count, 0) as attempt_count,
    coalesce(e.max_attempts, 5)  as max_attempts
  from control.watchdog_emissions e
  where e.obligation_id   = p_obligation_id
    and e.delivery_target = p_delivery_target;
end;
$$;

comment on function api.create_watchdog_emission(uuid, text) is
'Kernel-governed get-or-create boundary for watchdog emission rows. App-layer code MUST call this RPC instead of inserting into control.watchdog_emissions directly. Pairs with api.claim_watchdog_emission() and api.record_watchdog_attempt() to keep the watchdog delivery surface fully kernel-governed.';

grant execute on function api.create_watchdog_emission(uuid, text) to service_role;

commit;
