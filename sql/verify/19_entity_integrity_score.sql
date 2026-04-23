select
  entity_id::text as entity_id,
  total_obligations,
  resolved_count,
  failed_count,
  weak_proof_count,
  resolution_rate::text as resolution_rate,
  integrity_score::text as integrity_score
from projection.entity_integrity_score
order by entity_id;
