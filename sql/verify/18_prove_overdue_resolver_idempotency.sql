with created as (
    select
        (
            api.ingest_event_to_obligation(
                'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
                '11111111-1111-1111-1111-111111111111'::uuid,
                'service_commitment',
                'overdue-resolver-' || gen_random_uuid()::text,
                'service_commitment_created',
                '{}'::jsonb,
                now()
            )
        ) as ingest_result
),
target as (
    select
        ((ingest_result -> 'obligation' ->> 'obligation_id'))::uuid as obligation_id
    from created
),
forced_overdue as (
    update core.obligations
    set due_at = now() - interval '1 day'
    where id = (select obligation_id from target)
    returning id
),
watchdog_before as (
    select count(*)::integer as cnt
    from public.overdue_failure_watchdog
    where obligation_id = (select obligation_id from target)
),
run_one as (
    select *
    from api.resolve_overdue_obligations()
),
receipts_after_one as (
    select count(*)::integer as cnt
    from receipts.receipts
    where obligation_id = (select obligation_id from target)
      and resolution_type = 'resolve_overdue'
      and proof_status = 'rejected'
),
projection_after_one as (
    select
        obligation_id,
        receipt_id,
        resolution_type,
        proof_status,
        lifecycle_state
    from projection.obligation_lifecycle
    where obligation_id = (select obligation_id from target)
),
run_two as (
    select *
    from api.resolve_overdue_obligations()
),
receipts_after_two as (
    select count(*)::integer as cnt
    from receipts.receipts
    where obligation_id = (select obligation_id from target)
      and resolution_type = 'resolve_overdue'
      and proof_status = 'rejected'
),
watchdog_after as (
    select count(*)::integer as cnt
    from public.overdue_failure_watchdog
    where obligation_id = (select obligation_id from target)
)
select
    (select obligation_id from target) as obligation_id,
    (select cnt from watchdog_before) as watchdog_before_count,
    coalesce((select max(resolved_count) from run_one), 0) as resolver_run_one_resolved_count,
    (select cnt from receipts_after_one) as exact_failed_receipt_count,
    coalesce((select max(resolved_count) from run_two), 0) as resolver_run_two_resolved_count,
    (select cnt from receipts_after_two) as final_single_receipt_count,
    (select cnt from watchdog_after) as watchdog_after_count,
    (select resolution_type from projection_after_one limit 1) as projection_resolution_type,
    (select proof_status from projection_after_one limit 1) as projection_proof_status,
    (select lifecycle_state from projection_after_one limit 1) as projection_lifecycle_state;
