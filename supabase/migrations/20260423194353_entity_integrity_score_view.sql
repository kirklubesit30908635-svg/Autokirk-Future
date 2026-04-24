begin;

drop view if exists projection.entity_integrity_score;

create view projection.entity_integrity_score as
with lifecycle as (
    select
        pl.entity_id,
        pl.lifecycle_state,
        pl.proof_status,
        pl.truth_burden
    from projection.obligation_lifecycle pl
)
select
    l.entity_id,
    count(*)::bigint as total_obligations,
    count(*) filter (where l.lifecycle_state = 'resolved')::bigint as resolved_count,
    count(*) filter (where l.lifecycle_state = 'failed')::bigint as failed_count,
    count(*) filter (
        where l.proof_status in ('insufficient', 'rejected')
    )::bigint as weak_proof_count,
    round(
        (
            count(*) filter (where l.lifecycle_state = 'resolved')::numeric
            / nullif(count(*), 0)
        ) * 100,
        2
    ) as resolution_rate,
    greatest(
        -100::numeric,
        least(
            100::numeric,
            round(
                (
                    (
                        count(*) filter (where l.lifecycle_state = 'resolved')
                        - count(*) filter (where l.lifecycle_state = 'failed')
                        - count(*) filter (
                            where l.proof_status in ('insufficient', 'rejected')
                        )
                    )::numeric
                    / nullif(count(*), 0)
                ) * 100,
                2
            )
        )
    ) as integrity_score
from lifecycle l
group by l.entity_id;

commit;
