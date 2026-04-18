select
  obligation_id,
  truth_burden,
  receipt_id,
  proof_status,
  lifecycle_state
from projection.obligation_lifecycle
where
  (
    truth_burden = 'promise'
    and lifecycle_state = 'resolved'
    and proof_status <> 'sufficient'
  )
  or
  (
    truth_burden = 'promise'
    and lifecycle_state = 'failed'
    and proof_status <> 'failed'
  )
  or
  (
    truth_burden = 'promise'
    and receipt_id is not null
    and proof_status = 'sufficient'
    and lifecycle_state <> 'resolved'
  );
