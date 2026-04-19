select
  o.proof_status,
  count(*)::int as obligation_count
from core.obligations o
group by o.proof_status
order by o.proof_status;
