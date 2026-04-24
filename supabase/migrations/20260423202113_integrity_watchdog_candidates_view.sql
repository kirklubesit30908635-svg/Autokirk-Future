begin;

drop view if exists projection.integrity_watchdog_candidates;

create view projection.integrity_watchdog_candidates as
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
where ie.action_mode in ('contractual', 'internal');

commit;
