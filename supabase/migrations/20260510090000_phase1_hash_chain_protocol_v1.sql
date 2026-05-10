begin;
-- ============================================================================
-- AutoKirk Hash Chain Protocol v1
-- ----------------------------------------------------------------------------
-- Status:        ACTIVE after this migration commits successfully
-- Supersedes:    none (initial protocol on AutoKirk Future)
-- Quarantines:   pre-chain rows where chain_status = 'pre_chain'
--
-- 1. SCOPE
--    Defines the cryptographic chain protocol governing ledger.events and
--    receipts.receipts. Each (workspace_id, chain_key) pair is an independent
--    append-only chain. This migration implements Phase 1 Step 1.1 only.
--
-- 2. CANONICALIZATION
--    Hash envelopes are serialized with a deliberately narrow RFC 8785/JCS
--    compatible v1 subset: objects, arrays, strings, integers, booleans, and
--    null. Floats are rejected. Object keys are sorted lexicographically.
--    Insignificant whitespace is removed. V1 payloads must use integer cents
--    or strings for quantities that might otherwise be decimal values.
--
-- 3. SCALAR SERIALIZATION
--    UUIDs are lowercase, hyphenated RFC 4122 strings. Timestamps are UTC ISO
--    8601 with microsecond precision and literal Z suffix:
--    YYYY-MM-DDTHH24:MI:SS.USZ. Hashes are lowercase 64-character sha256 hex.
--
-- 4. EVENT ENVELOPE
--    event_hash = sha256_hex(JCS({
--      "v": 1,
--      "workspace_id": <uuid>,
--      "chain": "events:v1",
--      "seq": <bigint>,
--      "prev_hash": <hex>,
--      "event_type": <string>,
--      "occurred_at": <timestamp>,
--      "payload": {
--        "obligation_id": <uuid>,
--        "actor_id": <uuid>,
--        "reason": <string>,
--        "evidence_present": <object-or-array>,
--        "failed_checks": <object-or-array>,
--        "rule_version": <string>
--      }
--    }))
--
-- 5. RECEIPT ENVELOPE
--    receipt_hash = sha256_hex(JCS({
--      "v": 1,
--      "workspace_id": <uuid>,
--      "chain": "receipts:v1",
--      "seq": <bigint>,
--      "prev_hash": <hex>,
--      "obligation_id": <uuid>,
--      "resolution_event_hash": <hex>,
--      "resolved_at": <timestamp>,
--      "outcome": <string>
--    }))
--
-- 6. GENESIS RULE
--    genesis_hash(workspace_id, chain_key) = sha256_hex(JCS({
--      "kind": "genesis",
--      "workspace_id": <uuid>,
--      "chain": <chain_key>,
--      "version": "v1"
--    }))
--
-- 7. CHAIN ADVANCE RULE
--    ledger.chain_heads is the serialization point. BEFORE INSERT triggers
--    SELECT the workspace/chain head FOR UPDATE, set seq=head.seq+1, set
--    prev_hash=head.head_hash, compute the row hash, and update the head in
--    the same transaction. Missing chain heads raise and abort the write.
--
-- 8. PRE-CHAIN BOUNDARY
--    Existing rows are marked chain_status='pre_chain' and excluded from
--    verification. New rows begin legacy_unverified and are trigger-sealed
--    to chain_status='verified' only after hash fields are computed.
--
-- 9. VERIFIER CONTRACT
--    ledger.verify_chain(workspace_id, chain_key) recomputes hashes using the
--    same compute_*_hash helpers used by the producer triggers.
--
-- 10. VERSIONING
--     Field "v": 1 commits these envelopes to protocol v1. A future v2 requires
--     a new protocol boundary; never rewrite v1 rows in place.
-- ============================================================================

create schema if not exists ledger;
create schema if not exists governance;
create or replace function ledger.sha256_hex(input text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select encode(extensions.digest(convert_to(input, 'UTF8'), 'sha256'), 'hex');
$$;
create or replace function ledger._is_sha256_hex(input text)
returns boolean
language sql
immutable
strict
parallel safe
as $$
  select input ~ '^[0-9a-f]{64}$';
$$;
create or replace function ledger.format_chain_timestamp(input timestamptz)
returns text
language sql
immutable
strict
parallel safe
as $$
  select to_char(input at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
$$;
create or replace function ledger.canonicalize_jsonb(input jsonb)
returns text
language plpgsql
immutable
strict
parallel safe
as $$
declare
    v_type text := jsonb_typeof(input);
    v_result text;
begin
    if v_type = 'object' then
        select string_agg(to_jsonb(key)::text || ':' || ledger.canonicalize_jsonb(value), ',' order by key)
          into v_result
          from jsonb_each(input);
        return '{' || coalesce(v_result, '') || '}';
    elsif v_type = 'array' then
        select string_agg(ledger.canonicalize_jsonb(value), ',' order by ordinality)
          into v_result
          from jsonb_array_elements(input) with ordinality as e(value, ordinality);
        return '[' || coalesce(v_result, '') || ']';
    elsif v_type = 'string' then
        return input::text;
    elsif v_type = 'number' then
        if input::text !~ '^-?(0|[1-9][0-9]*)$' then
            raise exception 'JCS_V1_FLOATS_FORBIDDEN: %', input::text;
        end if;
        return input::text;
    elsif v_type = 'boolean' then
        return input::text;
    elsif v_type = 'null' then
        return 'null';
    end if;

    raise exception 'JCS_V1_UNSUPPORTED_JSON_TYPE: %', v_type;
end;
$$;
create or replace function ledger.genesis_hash(p_workspace_id uuid, p_chain_key text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select ledger.sha256_hex(
    ledger.canonicalize_jsonb(
      jsonb_build_object(
        'kind', 'genesis',
        'workspace_id', lower(p_workspace_id::text),
        'chain', p_chain_key,
        'version', 'v1'
      )
    )
  );
$$;
create or replace function ledger.compute_event_hash(envelope jsonb)
returns text
language sql
immutable
strict
parallel safe
as $$
  select ledger.sha256_hex(ledger.canonicalize_jsonb(envelope));
$$;
create or replace function ledger.compute_receipt_hash(envelope jsonb)
returns text
language sql
immutable
strict
parallel safe
as $$
  select ledger.sha256_hex(ledger.canonicalize_jsonb(envelope));
$$;
create table if not exists governance.protocol_test_vectors (
    protocol text not null,
    vector_name text not null,
    envelope jsonb not null,
    expected_hash text not null,
    created_at timestamptz not null default now(),
    primary key (protocol, vector_name),
    constraint protocol_test_vectors_expected_hash_hex check (ledger._is_sha256_hex(expected_hash))
);
insert into governance.protocol_test_vectors (protocol, vector_name, envelope, expected_hash)
values
(
  'autokirk.hash_chain.v1',
  'event_minimal',
  '{"v":1,"workspace_id":"00000000-0000-0000-0000-000000000001","chain":"events:v1","seq":1,"prev_hash":"0000000000000000000000000000000000000000000000000000000000000000","event_type":"obligation.resolved","occurred_at":"2026-05-10T00:00:00.000000Z","payload":{}}'::jsonb,
  '6625107794e4cd62af86759101c76a69ba95969dcdc925285ed8274cdc901b40'
),
(
  'autokirk.hash_chain.v1',
  'event_obligation_resolved',
  '{"v":1,"workspace_id":"00000000-0000-0000-0000-000000000001","chain":"events:v1","seq":2,"prev_hash":"1111111111111111111111111111111111111111111111111111111111111111","event_type":"obligation.resolved","occurred_at":"2026-05-10T00:00:01.000000Z","payload":{"obligation_id":"00000000-0000-0000-0000-000000000003","actor_id":"00000000-0000-0000-0000-000000000002","reason":"proof accepted","evidence_present":{"invoice":"inv_001"},"failed_checks":[],"rule_version":"v1.resolve_with_proof"}}'::jsonb,
  '8ec0c3df21c6da161a993b7c8ecafb0ab75be3b4802c8e5c3215610b3dffa229'
),
(
  'autokirk.hash_chain.v1',
  'receipt_resolution',
  '{"v":1,"workspace_id":"00000000-0000-0000-0000-000000000001","chain":"receipts:v1","seq":1,"prev_hash":"2222222222222222222222222222222222222222222222222222222222222222","obligation_id":"00000000-0000-0000-0000-000000000003","resolution_event_hash":"3333333333333333333333333333333333333333333333333333333333333333","resolved_at":"2026-05-10T00:00:02.000000Z","outcome":"resolve_with_proof"}'::jsonb,
  '6ff6ea1dee44a2570bdef000dbb201c96a951aa4d929fa775b814ca3caf3c956'
)
on conflict (protocol, vector_name) do update
set envelope = excluded.envelope,
    expected_hash = excluded.expected_hash;
create or replace function ledger.self_test_hash_chain_v1()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v record;
    v_actual text;
begin
    for v in
        select * from governance.protocol_test_vectors
        where protocol = 'autokirk.hash_chain.v1'
        order by vector_name
    loop
        if v.vector_name like 'receipt_%' then
            v_actual := ledger.compute_receipt_hash(v.envelope);
        else
            v_actual := ledger.compute_event_hash(v.envelope);
        end if;

        if v_actual <> v.expected_hash then
            raise exception 'HASH_CHAIN_SELF_TEST_FAILED vector=% expected=% actual=%',
                v.vector_name, v.expected_hash, v_actual;
        end if;
    end loop;
end;
$$;
select ledger.self_test_hash_chain_v1();
create table if not exists ledger.chain_heads (
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    chain_key text not null,
    seq bigint not null default 0,
    head_hash text not null,
    updated_at timestamptz not null default now(),
    primary key (workspace_id, chain_key),
    constraint chain_heads_chain_key_not_blank check (nullif(btrim(chain_key), '') is not null),
    constraint chain_heads_seq_nonnegative check (seq >= 0),
    constraint chain_heads_head_hash_hex check (ledger._is_sha256_hex(head_hash))
);
alter table ledger.events
    add column if not exists chain_key text,
    add column if not exists seq bigint,
    add column if not exists prev_hash text,
    add column if not exists event_hash text,
    add column if not exists chain_status text not null default 'legacy_unverified';
alter table receipts.receipts
    add column if not exists chain_key text,
    add column if not exists seq bigint,
    add column if not exists prev_hash text,
    add column if not exists receipt_hash text,
    add column if not exists resolution_event_hash text,
    add column if not exists chain_status text not null default 'legacy_unverified';
alter table ledger.events
    drop constraint if exists ledger_events_chain_status_check,
    add constraint ledger_events_chain_status_check
        check (chain_status in ('verified', 'legacy_unverified', 'pre_chain', 'quarantined'));
alter table receipts.receipts
    drop constraint if exists receipts_chain_status_check,
    add constraint receipts_chain_status_check
        check (chain_status in ('verified', 'legacy_unverified', 'pre_chain', 'quarantined'));
alter table ledger.events
    drop constraint if exists ledger_events_verified_chain_fields_check,
    add constraint ledger_events_verified_chain_fields_check
        check (
            chain_status <> 'verified'
            or (
                chain_key = 'events:v1'
                and seq is not null
                and seq > 0
                and ledger._is_sha256_hex(prev_hash)
                and ledger._is_sha256_hex(event_hash)
            )
        );
alter table receipts.receipts
    drop constraint if exists receipts_verified_chain_fields_check,
    add constraint receipts_verified_chain_fields_check
        check (
            chain_status <> 'verified'
            or (
                chain_key = 'receipts:v1'
                and seq is not null
                and seq > 0
                and ledger._is_sha256_hex(prev_hash)
                and ledger._is_sha256_hex(receipt_hash)
                and ledger._is_sha256_hex(resolution_event_hash)
            )
        );
create unique index if not exists ledger_events_verified_chain_seq_uq
    on ledger.events(workspace_id, chain_key, seq)
    where chain_status = 'verified';
create unique index if not exists receipts_verified_chain_seq_uq
    on receipts.receipts(workspace_id, chain_key, seq)
    where chain_status = 'verified';
update ledger.events
set chain_status = 'pre_chain',
    chain_key = 'pre-hash-chain',
    seq = null,
    prev_hash = null,
    event_hash = null
where chain_status = 'verified'
  and event_hash is null;
update receipts.receipts
set chain_status = 'pre_chain',
    chain_key = 'pre-hash-chain',
    seq = null,
    prev_hash = null,
    receipt_hash = null,
    resolution_event_hash = null
where chain_status = 'verified'
  and receipt_hash is null;
insert into ledger.chain_heads (workspace_id, chain_key, seq, head_hash)
select w.id, c.chain_key, 0, ledger.genesis_hash(w.id, c.chain_key)
from core.workspaces w
cross join (values ('events:v1'), ('receipts:v1')) as c(chain_key)
on conflict (workspace_id, chain_key) do nothing;
create or replace function ledger.initialize_workspace_chain_heads()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    insert into ledger.chain_heads (workspace_id, chain_key, seq, head_hash)
    values
      (new.id, 'events:v1', 0, ledger.genesis_hash(new.id, 'events:v1')),
      (new.id, 'receipts:v1', 0, ledger.genesis_hash(new.id, 'receipts:v1'))
    on conflict (workspace_id, chain_key) do nothing;

    return new;
end;
$$;
drop trigger if exists trg_initialize_workspace_chain_heads on core.workspaces;
create trigger trg_initialize_workspace_chain_heads
after insert on core.workspaces
for each row execute function ledger.initialize_workspace_chain_heads();
create or replace function ledger.events_chain_advance()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_head ledger.chain_heads%rowtype;
    v_payload jsonb;
    v_envelope jsonb;
begin
    if new.chain_status in ('pre_chain', 'quarantined') then
        return new;
    end if;

    new.chain_key := 'events:v1';

    select * into v_head
    from ledger.chain_heads
    where workspace_id = new.workspace_id
      and chain_key = 'events:v1'
    for update;

    if not found then
        raise exception 'CHAIN_HEAD_MISSING workspace=% chain=events:v1', new.workspace_id;
    end if;

    new.seq := v_head.seq + 1;
    new.prev_hash := v_head.head_hash;

    v_payload := jsonb_build_object(
        'obligation_id', lower(new.obligation_id::text),
        'actor_id', lower(new.actor_id::text),
        'reason', coalesce(new.reason, ''),
        'evidence_present', coalesce(new.evidence_present, '{}'::jsonb),
        'failed_checks', coalesce(new.failed_checks, '[]'::jsonb),
        'rule_version', coalesce(new.rule_version, '')
    );

    v_envelope := jsonb_build_object(
        'v', 1,
        'workspace_id', lower(new.workspace_id::text),
        'chain', 'events:v1',
        'seq', new.seq,
        'prev_hash', new.prev_hash,
        'event_type', new.event_type,
        'occurred_at', ledger.format_chain_timestamp(new.emitted_at),
        'payload', v_payload
    );

    new.event_hash := ledger.compute_event_hash(v_envelope);
    new.chain_status := 'verified';

    update ledger.chain_heads
    set seq = new.seq,
        head_hash = new.event_hash,
        updated_at = now()
    where workspace_id = new.workspace_id
      and chain_key = 'events:v1';

    return new;
end;
$$;
create or replace function ledger.receipts_chain_advance()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_head ledger.chain_heads%rowtype;
    v_event_hash text;
    v_envelope jsonb;
begin
    if new.chain_status in ('pre_chain', 'quarantined') then
        return new;
    end if;

    new.chain_key := 'receipts:v1';

    if new.resolution_event_hash is null then
        raise exception 'RESOLUTION_EVENT_HASH_REQUIRED receipt=%', new.id;
    end if;

    if not ledger._is_sha256_hex(new.resolution_event_hash) then
        raise exception 'RESOLUTION_EVENT_HASH_INVALID receipt=%', new.id;
    end if;

    select * into v_head
    from ledger.chain_heads
    where workspace_id = new.workspace_id
      and chain_key = 'receipts:v1'
    for update;

    if not found then
        raise exception 'CHAIN_HEAD_MISSING workspace=% chain=receipts:v1', new.workspace_id;
    end if;

    new.seq := v_head.seq + 1;
    new.prev_hash := v_head.head_hash;

    v_envelope := jsonb_build_object(
        'v', 1,
        'workspace_id', lower(new.workspace_id::text),
        'chain', 'receipts:v1',
        'seq', new.seq,
        'prev_hash', new.prev_hash,
        'obligation_id', lower(new.obligation_id::text),
        'resolution_event_hash', new.resolution_event_hash,
        'resolved_at', ledger.format_chain_timestamp(new.emitted_at),
        'outcome', new.resolution_type
    );

    new.receipt_hash := ledger.compute_receipt_hash(v_envelope);
    new.chain_status := 'verified';

    update ledger.chain_heads
    set seq = new.seq,
        head_hash = new.receipt_hash,
        updated_at = now()
    where workspace_id = new.workspace_id
      and chain_key = 'receipts:v1';

    return new;
end;
$$;
drop trigger if exists trg_events_chain_advance on ledger.events;
create trigger trg_events_chain_advance
before insert on ledger.events
for each row execute function ledger.events_chain_advance();
drop trigger if exists trg_receipts_chain_advance on receipts.receipts;
create trigger trg_receipts_chain_advance
before insert on receipts.receipts
for each row execute function ledger.receipts_chain_advance();
create or replace view ledger.receipts as
select
    r.id,
    r.workspace_id,
    r.entity_id,
    r.obligation_id,
    r.actor_id,
    r.resolution_type,
    r.reason,
    r.evidence_present,
    r.failed_checks,
    r.proof_status,
    r.rule_version,
    r.emitted_at,
    r.chain_key,
    r.seq,
    r.prev_hash,
    r.receipt_hash as hash,
    r.resolution_event_hash,
    r.chain_status
from receipts.receipts r;
create or replace function ledger.verify_chain(p_workspace_id uuid, p_chain_key text)
returns table (
    ok boolean,
    broken_at_seq bigint,
    expected_hash text,
    actual_hash text,
    error_type text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_expected_prev text;
    v_expected_seq bigint := 1;
    v_expected_hash text;
    v_head ledger.chain_heads%rowtype;
    r record;
begin
    if p_chain_key not in ('events:v1', 'receipts:v1') then
        return query select false, null::bigint, null::text, null::text, 'UNSUPPORTED_CHAIN';
        return;
    end if;

    select * into v_head
    from ledger.chain_heads
    where workspace_id = p_workspace_id
      and chain_key = p_chain_key;

    if not found then
        return query select false, null::bigint, ledger.genesis_hash(p_workspace_id, p_chain_key), null::text, 'CHAIN_HEAD_MISSING';
        return;
    end if;

    v_expected_prev := ledger.genesis_hash(p_workspace_id, p_chain_key);

    if p_chain_key = 'events:v1' then
        for r in
            select * from ledger.events
            where workspace_id = p_workspace_id
              and chain_key = 'events:v1'
              and chain_status = 'verified'
            order by seq
        loop
            if r.seq <> v_expected_seq then
                return query select false, r.seq, v_expected_seq::text, r.seq::text, 'SEQ_MISMATCH';
                return;
            end if;

            if r.prev_hash <> v_expected_prev then
                return query select false, r.seq, v_expected_prev, r.prev_hash, 'PREV_HASH_MISMATCH';
                return;
            end if;

            v_expected_hash := ledger.compute_event_hash(jsonb_build_object(
                'v', 1,
                'workspace_id', lower(r.workspace_id::text),
                'chain', 'events:v1',
                'seq', r.seq,
                'prev_hash', r.prev_hash,
                'event_type', r.event_type,
                'occurred_at', ledger.format_chain_timestamp(r.emitted_at),
                'payload', jsonb_build_object(
                    'obligation_id', lower(r.obligation_id::text),
                    'actor_id', lower(r.actor_id::text),
                    'reason', coalesce(r.reason, ''),
                    'evidence_present', coalesce(r.evidence_present, '{}'::jsonb),
                    'failed_checks', coalesce(r.failed_checks, '[]'::jsonb),
                    'rule_version', coalesce(r.rule_version, '')
                )
            ));

            if r.event_hash <> v_expected_hash then
                return query select false, r.seq, v_expected_hash, r.event_hash, 'HASH_MISMATCH';
                return;
            end if;

            v_expected_prev := r.event_hash;
            v_expected_seq := v_expected_seq + 1;
        end loop;
    else
        for r in
            select * from receipts.receipts
            where workspace_id = p_workspace_id
              and chain_key = 'receipts:v1'
              and chain_status = 'verified'
            order by seq
        loop
            if r.seq <> v_expected_seq then
                return query select false, r.seq, v_expected_seq::text, r.seq::text, 'SEQ_MISMATCH';
                return;
            end if;

            if r.prev_hash <> v_expected_prev then
                return query select false, r.seq, v_expected_prev, r.prev_hash, 'PREV_HASH_MISMATCH';
                return;
            end if;

            v_expected_hash := ledger.compute_receipt_hash(jsonb_build_object(
                'v', 1,
                'workspace_id', lower(r.workspace_id::text),
                'chain', 'receipts:v1',
                'seq', r.seq,
                'prev_hash', r.prev_hash,
                'obligation_id', lower(r.obligation_id::text),
                'resolution_event_hash', r.resolution_event_hash,
                'resolved_at', ledger.format_chain_timestamp(r.emitted_at),
                'outcome', r.resolution_type
            ));

            if r.receipt_hash <> v_expected_hash then
                return query select false, r.seq, v_expected_hash, r.receipt_hash, 'HASH_MISMATCH';
                return;
            end if;

            v_expected_prev := r.receipt_hash;
            v_expected_seq := v_expected_seq + 1;
        end loop;
    end if;

    if v_head.seq <> v_expected_seq - 1 then
        return query select false, v_head.seq, (v_expected_seq - 1)::text, v_head.seq::text, 'HEAD_SEQ_MISMATCH';
        return;
    end if;

    if v_head.head_hash <> v_expected_prev then
        return query select false, v_head.seq, v_expected_prev, v_head.head_hash, 'HEAD_HASH_MISMATCH';
        return;
    end if;

    return query select true, null::bigint, null::text, null::text, null::text;
end;
$$;
create or replace function api.verify_chain_integrity(p_workspace_id uuid, p_chain_key text)
returns table (
    ok boolean,
    broken_at_seq bigint,
    expected_hash text,
    actual_hash text,
    error_type text
)
language sql
security definer
set search_path = public, pg_temp
as $$
    select * from ledger.verify_chain(p_workspace_id, p_chain_key);
$$;
-- Re-wrap the current resolver so receipts bind to the just-sealed event hash.
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
    v_event_hash text;
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
        'obligation.resolved',
        p_reason,
        coalesce(p_evidence_present, '{}'::jsonb),
        coalesce(p_failed_checks, '[]'::jsonb),
        p_rule_version,
        v_now
    )
    returning event_hash into v_event_hash;

    if not ledger._is_sha256_hex(v_event_hash) then
        raise exception 'EVENT_HASH_NOT_EMITTED';
    end if;

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
        emitted_at,
        resolution_event_hash
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
        v_now,
        v_event_hash
    );

    update core.obligations
    set
        status = 'resolved',
        resolution_type = p_resolution_type,
        resolution_reason = p_reason,
        proof_status = p_proof_status,
        resolved_at = v_now
    where id = p_obligation_id;

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
        'entity_id', v_obligation.entity_id,
        'event_hash', v_event_hash
    );
end;
$function$;
create table if not exists governance.chain_activations (
    id uuid primary key default gen_random_uuid(),
    protocol text not null,
    activated_at timestamptz not null default now(),
    scope text not null,
    notes text not null
);
insert into governance.chain_activations (protocol, scope, notes)
values (
    'autokirk.hash_chain.v1',
    'ledger.events + receipts.receipts',
    'Phase 1 Step 1.1 activation. Existing rows marked pre_chain; new events and receipts advance workspace-scoped chain heads through BEFORE INSERT triggers.'
);
commit;
