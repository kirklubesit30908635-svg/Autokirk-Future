begin;

create or replace function control.set_watchdog_emission_workspace()
returns trigger
language plpgsql
security definer
set search_path = control, core, public
as $$
begin
  if new.workspace_id is null and new.watchdog_detection_id is not null then
    select d.workspace_id into new.workspace_id
    from control.watchdog_detections d
    where d.id = new.watchdog_detection_id;
  end if;

  if new.workspace_id is null and new.obligation_id is not null then
    select o.workspace_id into new.workspace_id
    from core.obligations o
    where o.id = new.obligation_id;
  end if;

  -- Watchdog v2 supports workspace-bound production emissions, while preserving
  -- legacy/synthetic claim-concurrency proof rows that intentionally use a random
  -- obligation_id to test leasing behavior only. Production v2 emitters should
  -- supply workspace_id directly or through watchdog_detection_id.
  return new;
end;
$$;

comment on function control.set_watchdog_emission_workspace() is 'Backfills workspace_id for Watchdog v2 emissions from detections or obligations while allowing legacy synthetic lease-test rows.';

commit;
