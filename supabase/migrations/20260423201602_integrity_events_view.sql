begin;

drop view if exists projection.integrity_events;

create view projection.integrity_events as
with classified as (
    select *
    from projection.entity_integrity_classification
    where integrity_label_key = 'failed'
      and action_mode = 'contractual'
),
entity_activity as (
    select
        pl.entity_id,
        max(coalesce(pl.receipt_emitted_at, pl.obligation_created_at)) as latest_activity_at,
        count(*) filter (where pl.lifecycle_state = 'failed')::bigint as failed_obligation_count,
        count(*) filter (
            where pl.proof_status in ('insufficient', 'rejected')
        )::bigint as weak_proof_event_count
    from projection.obligation_lifecycle pl
    group by pl.entity_id
)
select
    c.entity_id,
    'integrity.failed'::text as event_type,
    ('integrity.failed.' || c.entity_id::text) as event_key,
    'projection.entity_integrity_classification'::text as source_projection,
    ea.latest_activity_at as detected_at,
    c.integrity_label_key,
    c.integrity_label,
    c.action_mode,
    c.classification_basis,
    c.integrity_score,
    c.resolution_rate,
    c.total_obligations,
    c.resolved_count,
    c.failed_count,
    c.weak_proof_count,
    c.max_overdue_age_days,
    c.failed_performance_recent_count,
    c.weak_proof_recent_count,
    c.overdue_floor_triggered,
    c.failed_performance_floor_triggered,
    c.weak_proof_floor_triggered,
    ea.failed_obligation_count,
    ea.weak_proof_event_count
from classified c
join entity_activity ea
  on ea.entity_id = c.entity_id;

commit;
