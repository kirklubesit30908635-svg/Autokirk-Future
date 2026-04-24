begin;

with ranked as (
  select
    e.id,
    row_number() over (
      partition by e.obligation_id, e.delivery_target
      order by
        case e.delivery_status
          when 'delivered' then 4
          when 'exhausted' then 3
          when 'failed' then 2
          when 'pending' then 1
          else 0
        end desc,
        e.attempt_count desc,
        coalesce(e.last_attempt_at, e.next_retry_at, e.created_at) desc,
        e.created_at desc,
        e.id desc
    ) as rn
  from control.watchdog_emissions e
)
delete from control.watchdog_emissions e
using ranked r
where e.id = r.id
  and r.rn > 1;

create unique index if not exists watchdog_emissions_obligation_delivery_target_uidx
  on control.watchdog_emissions (obligation_id, delivery_target);

drop view if exists public.watchdog_delivery_candidates;

create view public.watchdog_delivery_candidates
with (security_invoker = true) as
select
  c.obligation_id,
  c.entity_id,
  c.obligation_code,
  c.workspace_id,
  c.obligation_created_at,
  c.source_event_id,
  c.source_system,
  c.source_event_key,
  c.source_event_type,
  c.source_event_created_at,
  c.receipt_id,
  c.receipt_entity_id,
  c.resolution_type,
  c.proof_status,
  c.receipt_emitted_at,
  c.truth_burden,
  c.due_at,
  c.lifecycle_state,
  'outbound-webhook'::text as delivery_target,
  e.id as emission_id,
  e.delivery_status,
  e.created_at as emission_created_at,
  e.attempt_count,
  e.last_attempt_at,
  e.next_retry_at,
  e.max_attempts
from public.overdue_failure_emission_candidates c
left join control.watchdog_emissions e
  on e.obligation_id = c.obligation_id
 and e.delivery_target = 'outbound-webhook'
where e.id is null
   or (
        e.delivery_status = 'pending'
    and e.attempt_count = 0
   )
   or (
        e.delivery_status = 'failed'
    and e.attempt_count < e.max_attempts
    and e.next_retry_at is not null
    and e.next_retry_at <= now()
   );

comment on view public.watchdog_delivery_candidates is
'Retry-governed overdue failure delivery surface. Emits one logical candidate per obligation and delivery target using control.watchdog_emissions as the delivery state authority.';

create or replace function kernel.resolve_obligation_internal(
    p_obligation_id uuid,
    p_actor_id uuid,
    p_resolution_type text,
    p_reason text,
    p_evidence_present jsonb,
    p_failed_checks jsonb,
    p_rule_version text,
    p_proof_status text,
    p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
    v_obligation core.obligations%rowtype;
    v_existing_key ledger.idempotency_keys%rowtype;
    v_event_id uuid := gen_random_uuid();
    v_receipt_id uuid := gen_random_uuid();
    v_now timestamptz := now();
    v_input_hash text;
begin
    if p_obligation_id is null then
        raise exception 'OBLIGATION_ID_REQUIRED';
    end if;

    if p_actor_id is null then
        raise exception 'ACTOR_ID_REQUIRED';
    end if;

    if nullif(btrim(coalesce(p_resolution_type, '')), '') is null then
        raise exception 'RESOLUTION_TYPE_REQUIRED';
    end if;

    if p_resolution_type not in (
        'resolve_with_proof',
        'resolve_with_insufficient_proof',
        'resolve_rejected',
        'resolve_overdue'
    ) then
        raise exception 'UNSUPPORTED_RESOLUTION_TYPE';
    end if;

    if nullif(btrim(coalesce(p_proof_status, '')), '') is null then
        raise exception 'PROOF_STATUS_REQUIRED';
    end if;

    if p_proof_status not in ('sufficient', 'insufficient', 'rejected') then
        raise exception 'INVALID_PROOF_STATUS';
    end if;

    if nullif(btrim(coalesce(p_idempotency_key, '')), '') is null then
        raise exception 'IDEMPOTENCY_KEY_REQUIRED';
    end if;

    if p_resolution_type = 'resolve_with_proof'
       and (
            p_evidence_present is null
            or p_evidence_present = '{}'::jsonb
            or p_evidence_present = '[]'::jsonb
       ) then
        raise exception 'PROOF_REQUIRED';
    end if;

    select *
      into v_obligation
      from core.obligations
     where id = p_obligation_id
     for update;

    if not found then
        raise exception 'OBLIGATION_NOT_FOUND';
    end if;

    if v_obligation.entity_id is null then
        raise exception 'OBLIGATION_ENTITY_ID_REQUIRED';
    end if;

    perform core.assert_member(v_obligation.workspace_id, p_actor_id);

    v_input_hash := encode(
        extensions.digest(
            convert_to(
                coalesce(p_resolution_type, '') ||
                coalesce(p_reason, '') ||
                coalesce(p_evidence_present::text, '') ||
                coalesce(p_failed_checks::text, '') ||
                coalesce(p_rule_version, '') ||
                coalesce(p_proof_status, ''),
                'UTF8'
            ),
            'sha256'
        ),
        'hex'
    );

    select *
      into v_existing_key
      from ledger.idempotency_keys
     where idempotency_key = p_idempotency_key
     for update;

    if found then
        if v_existing_key.obligation_id <> p_obligation_id then
            raise exception 'IDEMPOTENCY_KEY_REUSED_FOR_DIFFERENT_OBLIGATION';
        end if;

        if v_existing_key.input_hash <> v_input_hash then
            raise exception 'IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_INPUT';
        end if;

        return jsonb_build_object(
            'ok', true,
            'replayed', true,
            'obligation_id', v_existing_key.obligation_id,
            'event_id', v_existing_key.event_id,
            'receipt_id', v_existing_key.receipt_id,
            'entity_id', v_obligation.entity_id
        );
    end if;

    if v_obligation.status <> 'open' then
        raise exception 'OBLIGATION_NOT_OPEN';
    end if;

    insert into ledger.events (
        id,
        workspace_id,
        obligation_id,
        actor_id,
        event_type,
        reason,
        evidence_present,
        failed_checks,
        rule_version,
        emitted_at
    )
    values (
        v_event_id,
        v_obligation.workspace_id,
        p_obligation_id,
        p_actor_id,
        'obligation_resolved',
        p_reason,
        coalesce(p_evidence_present, '{}'::jsonb),
        coalesce(p_failed_checks, '[]'::jsonb),
        p_rule_version,
        v_now
    );

    update core.obligations
    set
        status = 'resolved',
        resolution_type = p_resolution_type,
        resolution_reason = p_reason,
        proof_status = p_proof_status,
        resolved_at = v_now
    where id = p_obligation_id;

    insert into receipts.receipts (
        id,
        obligation_id,
        workspace_id,
        entity_id,
        actor_id,
        resolution_type,
        reason,
        evidence_present,
        failed_checks,
        proof_status,
        rule_version,
        emitted_at
    )
    values (
        v_receipt_id,
        p_obligation_id,
        v_obligation.workspace_id,
        v_obligation.entity_id,
        p_actor_id,
        p_resolution_type,
        p_reason,
        coalesce(p_evidence_present, '{}'::jsonb),
        coalesce(p_failed_checks, '[]'::jsonb),
        p_proof_status,
        p_rule_version,
        v_now
    );

    insert into ledger.idempotency_keys (
        id,
        idempotency_key,
        obligation_id,
        resolution_type,
        event_id,
        receipt_id,
        created_at,
        input_hash
    )
    values (
        gen_random_uuid(),
        p_idempotency_key,
        p_obligation_id,
        p_resolution_type,
        v_event_id,
        v_receipt_id,
        v_now,
        v_input_hash
    );

    return jsonb_build_object(
        'ok', true,
        'replayed', false,
        'obligation_id', p_obligation_id,
        'event_id', v_event_id,
        'receipt_id', v_receipt_id,
        'entity_id', v_obligation.entity_id
    );
end;
$function$;

commit;
