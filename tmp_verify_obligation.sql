select
  id,
  status,
  resolution_type,
  resolution_reason,
  proof_status,
  resolved_at
from core.obligations
where id = '58c61a03-8535-412f-994f-33a0c96fdaae'::uuid;
