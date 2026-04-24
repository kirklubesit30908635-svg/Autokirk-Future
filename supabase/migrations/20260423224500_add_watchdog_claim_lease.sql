begin;

alter table control.watchdog_emissions
add column if not exists lease_expires_at timestamptz null;

create or replace function api.claim_watchdog_emission(
    p_emission_id uuid,
    p_lease_seconds integer default 120
)
returns control.watchdog_emissions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_row control.watchdog_emissions;
begin
    if p_emission_id is null then
        raise exception 'EMISSION_ID_REQUIRED';
    end if;

    if p_lease_seconds is null or p_lease_seconds < 1 then
        raise exception 'LEASE_SECONDS_INVALID';
    end if;

    update control.watchdog_emissions
       set lease_expires_at = now() + make_interval(secs => p_lease_seconds)
     where id = p_emission_id
       and (
            (
                delivery_status = 'pending'
            and attempt_count = 0
            )
            or
            (
                delivery_status = 'failed'
            and attempt_count < max_attempts
            and next_retry_at is not null
            and next_retry_at <= now()
            )
       )
       and coalesce(lease_expires_at, '-infinity'::timestamptz) <= now()
     returning *
      into v_row;

    return v_row;
end;
$$;

create or replace function api.record_watchdog_attempt(
    p_emission_id uuid,
    p_delivery_status text,
    p_next_retry_at timestamptz default null
)
returns control.watchdog_emissions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_current control.watchdog_emissions;
    v_row control.watchdog_emissions;
begin
    if p_emission_id is null then
        raise exception 'EMISSION_ID_REQUIRED';
    end if;

    if nullif(btrim(coalesce(p_delivery_status, '')), '') is null then
        raise exception 'DELIVERY_STATUS_REQUIRED';
    end if;

    if p_delivery_status not in ('pending', 'delivered', 'failed', 'exhausted') then
        raise exception 'INVALID_DELIVERY_STATUS';
    end if;

    select *
      into v_current
      from control.watchdog_emissions
     where id = p_emission_id
     for update;

    if not found then
        raise exception 'WATCHDOG_EMISSION_NOT_FOUND';
    end if;

    update control.watchdog_emissions
       set attempt_count = attempt_count + 1,
           last_attempt_at = now(),
           next_retry_at = p_next_retry_at,
           delivery_status = p_delivery_status,
           lease_expires_at = null
     where id = p_emission_id
     returning *
      into v_row;

    return v_row;
end;
$$;

commit;
