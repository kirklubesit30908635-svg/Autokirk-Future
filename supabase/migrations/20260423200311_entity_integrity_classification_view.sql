begin;

drop view if exists projection.entity_integrity_classification;

create view projection.entity_integrity_classification as
with base as (
    select *
    from projection.entity_integrity_score
),
policy_eval as (
    select
        b.entity_id,
        b.total_obligations,
        b.resolved_count,
        b.failed_count,
        b.weak_proof_count,
        b.resolution_rate,
        b.integrity_score,
        p.policy_key,
        p.label,
        p.severity_rank,
        p.action_mode,
        p.rolling_window_days,
        p.overdue_days_floor,
        p.failed_performance_floor,
        p.weak_proof_floor,
        metrics.max_overdue_age_days,
        metrics.failed_performance_recent_count,
        metrics.weak_proof_recent_count,
        (
            (p.min_score is null or b.integrity_score >= p.min_score)
            and (p.max_score is null or b.integrity_score <= p.max_score)
        ) as score_band_matched,
        (
            p.overdue_days_floor is not null
            and coalesce(metrics.max_overdue_age_days, -1) >= p.overdue_days_floor
        ) as overdue_floor_triggered,
        (
            p.failed_performance_floor is not null
            and metrics.failed_performance_recent_count >= p.failed_performance_floor
        ) as failed_performance_floor_triggered,
        (
            p.weak_proof_floor is not null
            and metrics.weak_proof_recent_count >= p.weak_proof_floor
        ) as weak_proof_floor_triggered
    from base b
    join governance.integrity_score_policy p
      on p.is_active = true
    cross join lateral (
        select
            max(extract(epoch from (now() - pl.due_at)) / 86400.0)
                filter (
                    where pl.lifecycle_state = 'failed'
                      and pl.receipt_id is null
                      and pl.due_at is not null
                ) as max_overdue_age_days,
            count(*) filter (
                where pl.lifecycle_state = 'failed'
                  and pl.truth_burden = 'performance'
                  and pl.obligation_created_at >= now() - make_interval(days => p.rolling_window_days)
            )::bigint as failed_performance_recent_count,
            count(*) filter (
                where pl.proof_status in ('insufficient', 'rejected')
                  and coalesce(pl.receipt_emitted_at, pl.obligation_created_at) >= now() - make_interval(days => p.rolling_window_days)
            )::bigint as weak_proof_recent_count
        from projection.obligation_lifecycle pl
        where pl.entity_id = b.entity_id
    ) metrics
),
matched as (
    select
        pe.*,
        case
            when pe.overdue_floor_triggered then 'overdue_floor'
            when pe.failed_performance_floor_triggered then 'failed_performance_floor'
            when pe.weak_proof_floor_triggered then 'weak_proof_floor'
            when pe.score_band_matched then 'score_band'
            else null
        end as classification_basis
    from policy_eval pe
    where pe.score_band_matched
       or pe.overdue_floor_triggered
       or pe.failed_performance_floor_triggered
       or pe.weak_proof_floor_triggered
),
ranked as (
    select
        m.*,
        row_number() over (
            partition by m.entity_id
            order by m.severity_rank desc, m.policy_key
        ) as rn
    from matched m
)
select
    entity_id,
    total_obligations,
    resolved_count,
    failed_count,
    weak_proof_count,
    resolution_rate,
    integrity_score,
    policy_key as integrity_label_key,
    label as integrity_label,
    action_mode,
    classification_basis,
    max_overdue_age_days,
    failed_performance_recent_count,
    weak_proof_recent_count,
    overdue_floor_triggered,
    failed_performance_floor_triggered,
    weak_proof_floor_triggered
from ranked
where rn = 1;

commit;
