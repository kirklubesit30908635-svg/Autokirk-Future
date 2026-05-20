-- Task 0C: Create api.create_watchdog_emission()
-- Replaces direct app-layer insert into control.watchdog_emissions
create or replace function api.create_watchdog_emission(
  p_obligation_id uuid,
  p_delivery_target text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
begin
  insert into control.watchdog_emissions (obligation_id, delivery_target, delivery_status)
  values (p_obligation_id, p_delivery_target, 'pending')
  on conflict (obligation_id, delivery_target) do nothing;

  select id, obligation_id, delivery_status, next_retry_at, attempt_count, max_attempts
  into v_row
  from control.watchdog_emissions
  where obligation_id = p_obligation_id and delivery_target = p_delivery_target;

  return jsonb_build_object(
    'id', v_row.id,
    'obligation_id', v_row.obligation_id,
    'delivery_status', v_row.delivery_status,
    'next_retry_at', v_row.next_retry_at,
    'attempt_count', coalesce(v_row.attempt_count, 0),
    'max_attempts', coalesce(v_row.max_attempts, 5)
  );
end;
$$;
