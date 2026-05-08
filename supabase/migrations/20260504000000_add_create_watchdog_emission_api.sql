begin;

create or replace function api.create_watchdog_emission(
  p_obligation_id uuid,
  p_delivery_target text
)
returns control.watchdog_emissions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row control.watchdog_emissions;
begin
  if p_obligation_id is null then
    raise exception 'OBLIGATION_ID_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_delivery_target, '')), '') is null then
    raise exception 'DELIVERY_TARGET_REQUIRED';
  end if;

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
  on conflict (obligation_id, delivery_target) do nothing
  returning *
  into v_row;

  if v_row.id is null then
    select *
      into v_row
      from control.watchdog_emissions
     where obligation_id = p_obligation_id
       and delivery_target = p_delivery_target;
  end if;

  if v_row.id is null then
    raise exception 'WATCHDOG_EMISSION_CREATE_FAILED';
  end if;

  return v_row;
end;
$$;

grant execute on function api.create_watchdog_emission(uuid, text) to service_role;

commit;
