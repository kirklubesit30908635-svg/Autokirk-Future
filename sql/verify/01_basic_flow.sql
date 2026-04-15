select 'events' as surface, count(*)::text as count
from ledger.events
where obligation_id in (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
)

union all

select 'obligations' as surface, count(*)::text as count
from core.obligations
where id in (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
)

union all

select 'receipts' as surface, count(*)::text as count
from receipts.receipts
where obligation_id in (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
);
