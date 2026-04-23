alter table control.watchdog_emissions
add column if not exists attempt_count integer not null default 0;

alter table control.watchdog_emissions
add column if not exists last_attempt_at timestamptz null;

alter table control.watchdog_emissions
add column if not exists next_retry_at timestamptz null;

alter table control.watchdog_emissions
add column if not exists max_attempts integer not null default 5;

alter table control.watchdog_emissions
drop constraint if exists watchdog_emissions_delivery_status_check;

alter table control.watchdog_emissions
add constraint watchdog_emissions_delivery_status_check
check (delivery_status in ('pending', 'delivered', 'failed', 'exhausted'));

create or replace view public.watchdog_delivery_candidates as
select
  e.id,
  e.obligation_id,
  e.created_at as emitted_at,
  e.delivery_target,
  e.delivery_status,
  e.attempt_count,
  e.last_attempt_at,
  e.next_retry_at,
  e.max_attempts
from control.watchdog_emissions e
where
  (
    e.delivery_status = 'pending'
    and e.attempt_count = 0
  )
  or
  (
    e.delivery_status = 'failed'
    and e.attempt_count < e.max_attempts
    and e.next_retry_at is not null
    and e.next_retry_at <= now()
  );
