begin;

create or replace view projection.obligation_lifecycle as
select
  o.id as obligation_id,
  o.entity_id,
  o.obligation_code,
  o.workspace_id,
  o.created_at as obligation_created_at,
  os.source_event_id,
  se.source_system,
  se.source_event_key,
  se.source_event_type,
  se.created_at as source_event_created_at,
  r.id as receipt_id,
  r.entity_id as receipt_entity_id,
  r.resolution_type,
  r.proof_status,
  r.emitted_at as receipt_emitted_at,
  o.truth_burden,
  o.due_at,
  case
    when r.id is null then 'open'
    when r.proof_status = 'sufficient' then 'resolved'
    when r.proof_status = any (array['insufficient','rejected']) then 'failed'
    else 'unknown'
  end as lifecycle_state
from core.obligation_sources os
join core.obligations o
  on o.id = os.obligation_id
left join ingest.source_events se
  on se.id = os.source_event_id
left join receipts.receipts r
  on r.obligation_id = o.id;

create or replace view projection.entity_integrity_classification as
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
                      and pl.resolution_type = 'resolve_overdue'
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

create or replace view projection.overdue_failure_resolution_candidates as
select
  pl.obligation_id,
  pl.entity_id,
  pl.obligation_code,
  pl.workspace_id,
  pl.obligation_created_at,
  pl.source_event_id,
  pl.source_system,
  pl.source_event_key,
  pl.source_event_type,
  pl.source_event_created_at,
  pl.receipt_id,
  pl.receipt_entity_id,
  pl.resolution_type,
  pl.proof_status,
  pl.receipt_emitted_at,
  pl.truth_burden,
  pl.due_at,
  pl.lifecycle_state
from projection.obligation_lifecycle pl
where pl.lifecycle_state = 'open'
  and pl.due_at is not null
  and pl.due_at < now();

create or replace view public.overdue_failure_watchdog
with (security_invoker = true) as
select
  pl.obligation_id,
  pl.entity_id,
  pl.obligation_code,
  pl.workspace_id,
  pl.obligation_created_at,
  pl.source_event_id,
  pl.source_system,
  pl.source_event_key,
  pl.source_event_type,
  pl.source_event_created_at,
  pl.receipt_id,
  pl.receipt_entity_id,
  pl.resolution_type,
  pl.proof_status,
  pl.receipt_emitted_at,
  pl.truth_burden,
  pl.due_at,
  pl.lifecycle_state
from projection.obligation_lifecycle pl
where pl.lifecycle_state = 'failed'
  and pl.resolution_type = 'resolve_overdue'
  and pl.receipt_id is not null;

create or replace view public.overdue_failure_emission_candidates
with (security_invoker = true) as
select
  pl.obligation_id,
  pl.entity_id,
  pl.obligation_code,
  pl.workspace_id,
  pl.obligation_created_at,
  pl.source_event_id,
  pl.source_system,
  pl.source_event_key,
  pl.source_event_type,
  pl.source_event_created_at,
  pl.receipt_id,
  pl.receipt_entity_id,
  pl.resolution_type,
  pl.proof_status,
  pl.receipt_emitted_at,
  pl.truth_burden,
  pl.due_at,
  pl.lifecycle_state
from projection.obligation_lifecycle pl
where pl.lifecycle_state = 'failed'
  and pl.resolution_type = 'resolve_overdue'
  and pl.receipt_id is not null;

create or replace function api.resolve_overdue_obligations()
returns table (
    scanned_count integer,
    resolved_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_row record;
    v_scanned integer := 0;
    v_resolved integer := 0;
    v_idempotency_key text;
begin
    for v_row in
        select
            c.obligation_id,
            c.workspace_id
        from projection.overdue_failure_resolution_candidates c
        order by c.due_at asc, c.obligation_created_at asc, c.obligation_id asc
    loop
        v_scanned := v_scanned + 1;

        v_idempotency_key :=
            'overdue:' || v_row.obligation_id::text;

        perform kernel.resolve_obligation_internal(
            p_obligation_id    => v_row.obligation_id,
            p_actor_id         => '11111111-1111-1111-1111-111111111111'::uuid,
            p_resolution_type  => 'resolve_overdue',
            p_reason           => 'auto_resolved_due_to_overdue',
            p_evidence_present => '{}'::jsonb,
            p_failed_checks    => '[]'::jsonb,
            p_rule_version     => 'v1',
            p_proof_status     => 'rejected',
            p_idempotency_key  => v_idempotency_key
        );

        v_resolved := v_resolved + 1;
    end loop;

    return query
    select v_scanned, v_resolved;
end;
$$;

comment on view projection.overdue_failure_resolution_candidates is
  'Operational candidate surface for explicit overdue resolution. Open overdue obligations only; not failed truth and not a consumer-facing watchdog surface.';

comment on view public.overdue_failure_watchdog is
  'Read-only watchdog surface for explicit overdue failures authored through kernel/API resolution. Does not infer failure from due_at alone.';

comment on view public.overdue_failure_emission_candidates is
  'Read-only emission surface for explicit overdue failures authored through kernel/API resolution. Does not infer failure from due_at alone.';

commit;
