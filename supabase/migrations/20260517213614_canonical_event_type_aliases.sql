create or replace view projection.v_canonical_events as
select
  e.*,
  case e.event_type
    when 'obligation.resolved' then 'obligation.resolved'
    when 'obligation_resolved' then 'obligation.resolved'
    when 'resolve_completed' then 'obligation.resolved'
    else e.event_type
  end as canonical_event_type
from ledger.events e;

grant select on projection.v_canonical_events to authenticated;
grant select on projection.v_canonical_events to service_role;
