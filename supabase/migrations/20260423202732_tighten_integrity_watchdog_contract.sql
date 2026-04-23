begin;

create or replace view projection.integrity_watchdog_candidates as
select
    ie.event_key,
    ie.entity_id,
    ie.event_type,
    ie.source_projection,
    ie.detected_at as occurred_at,
    ie.integrity_label_key,
    ie.integrity_label,
    ie.action_mode,
    ie.classification_basis,
    ie.integrity_score,
    ie.resolution_rate,
    ie.total_obligations,
    ie.resolved_count,
    ie.failed_count,
    ie.weak_proof_count
from projection.integrity_events ie
where ie.action_mode = 'contractual';

comment on view projection.integrity_events is
    'Current-state integrity consequence projection derived from entity_integrity_classification. Not append-only event history; deterministic rows may reappear after recovery and later failure.';

comment on view projection.integrity_watchdog_candidates is
    'Current-state watchdog observer slice sourced from projection.integrity_events. Contract is currently failed contractual classifications only.';

commit;
