select
  entity_id::text as entity_id,
  total_obligations,
  resolved_count,
  failed_count,
  weak_proof_count,
  resolution_rate::text as resolution_rate,
  integrity_score::text as integrity_score,
  integrity_label_key,
  integrity_label,
  action_mode,
  classification_basis,
  coalesce(max_overdue_age_days, 0)::text as max_overdue_age_days,
  failed_performance_recent_count,
  weak_proof_recent_count,
  overdue_floor_triggered,
  failed_performance_floor_triggered,
  weak_proof_floor_triggered
from projection.entity_integrity_classification
order by entity_id;
