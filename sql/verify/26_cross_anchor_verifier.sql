select count(*) as cross_anchor_violations
from receipts.receipts r
where r.chain_key is not null
  and not exists (
    select 1
    from ledger.events e
    where e.event_hash = r.resolution_event_hash
      and e.workspace_id = r.workspace_id
  );
-- Expected: 0
