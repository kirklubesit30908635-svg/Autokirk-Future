begin;

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
            w.obligation_id,
            w.workspace_id
        from public.overdue_failure_watchdog w
        order by w.due_at asc
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

comment on function api.resolve_overdue_obligations()
is 'Resolves overdue unresolved obligations into explicit failed terminal state via kernel authority.';

commit;
