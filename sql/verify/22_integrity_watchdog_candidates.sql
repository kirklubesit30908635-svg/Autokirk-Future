select
  event_key,
  entity_id::text as entity_id,
  event_type,
  source_projection,
  occurred_at::text as occurred_at,
  integrity_label_key,
  integrity_label,
  action_mode,
  classification_basis,
  integrity_score::text as integrity_score,
  resolution_rate::text as resolution_rate
from projection.integrity_watchdog_candidates
order by event_key;
