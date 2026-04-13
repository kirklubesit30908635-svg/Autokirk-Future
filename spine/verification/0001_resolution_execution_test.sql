-- =========================================================
-- EXECUTION TEST: canonical resolution proof loop
-- Replace placeholder UUIDs before running
-- =========================================================

begin;

-- ---------------------------------------------------------
-- INPUTS
-- ---------------------------------------------------------
do $$
declare
    v_obligation_id uuid := '11111111-1111-1111-1111-111111111111';
    v_actor_id uuid      := '22222222-2222-2222-2222-222222222222';
    v_idempotency_key text := 'test-resolve-001';
    v_result jsonb;
    v_replay jsonb;
begin
    -- =====================================================
    -- FIRST EXECUTION
    -- =====================================================
    select api.resolve_obligation(
        p_obligation_id    => v_obligation_id,
        p_actor_id         => v_actor_id,
        p_resolution_type  => 'resolve_with_proof',
        p_reason           => 'verification execution test',
        p_evidence_present => '{"source":"manual_test","documents":["doc-1"],"proof":"present"}'::jsonb,
        p_failed_checks    => '[]'::jsonb,
        p_rule_version     => 'v1',
        p_idempotency_key  => v_idempotency_key
    )
    into v_result;

    raise notice 'FIRST EXECUTION: %', v_result;

    -- =====================================================
    -- REPLAY SAME INPUT
    -- =====================================================
    select api.resolve_obligation(
        p_obligation_id    => v_obligation_id,
        p_actor_id         => v_actor_id,
        p_resolution_type  => 'resolve_with_proof',
        p_reason           => 'verification execution test',
        p_evidence_present => '{"source":"manual_test","documents":["doc-1"],"proof":"present"}'::jsonb,
        p_failed_checks    => '[]'::jsonb,
        p_rule_version     => 'v1',
        p_idempotency_key  => v_idempotency_key
    )
    into v_replay;

    raise notice 'REPLAY EXECUTION: %', v_replay;
end $$;

-- ---------------------------------------------------------
-- VERIFICATION QUERIES
-- Replace UUID below to match your real obligation_id
-- ---------------------------------------------------------

select 'EVENT_CHECK' as check_name, e.*
from ledger.events e
where e.obligation_id = '11111111-1111-1111-1111-111111111111'::uuid
order by e.emitted_at desc;

select 'OBLIGATION_CHECK' as check_name, o.*
from core.obligations o
where o.id = '11111111-1111-1111-1111-111111111111'::uuid;

select 'RECEIPT_CHECK' as check_name, r.*
from receipts.receipts r
where r.obligation_id = '11111111-1111-1111-1111-111111111111'::uuid
order by r.emitted_at desc;

select 'IDEMPOTENCY_CHECK' as check_name, k.*
from ledger.idempotency_keys k
where k.idempotency_key = 'test-resolve-001';

commit;
