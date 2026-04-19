select
  o.obligation_code,
  o.truth_burden,
  count(*)::int as obligation_count,
  count(r.id)::int as receipt_count
from core.obligations o
left join receipts.receipts r
  on r.obligation_id = o.id
group by o.obligation_code, o.truth_burden
order by obligation_count desc, o.obligation_code;
