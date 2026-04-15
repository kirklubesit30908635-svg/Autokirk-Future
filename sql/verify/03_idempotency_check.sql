select
  obligation_id::text as obligation_id,
  resolution_type,
  count(*) as idempotency_rows,
  count(distinct receipt_id) as distinct_receipts,
  count(distinct event_id) as distinct_events,
  min(idempotency_key) as sample_idempotency_key
from ledger.idempotency_keys
where obligation_id in (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
)
group by obligation_id, resolution_type
order by obligation_id, resolution_type;
