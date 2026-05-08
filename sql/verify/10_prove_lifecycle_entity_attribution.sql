select
  count(*) as total_lifecycle_rows,
  count(*) filter (where entity_id is null) as missing_obligation_entity_id,
  count(*) filter (
    where receipt_id is not null
      and receipt_entity_id is null
  ) as missing_receipt_entity_id
from projection.obligation_lifecycle;