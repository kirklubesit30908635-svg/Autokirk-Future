begin;

create schema if not exists intake;

create table if not exists intake.connected_systems (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    claim_source_id uuid references proof_boundary.claim_sources(id) on delete set null,
    authority_boundary_id uuid references proof_boundary.authority_boundaries(id) on delete set null,
    source_type text not null check (source_type in ('human','api','automation','agent','multi_agent','external_system')),
    connector_type text not null check (connector_type in ('manual','webhook','api','crm','form','email','payment','job_system','agent','mcp','automation','other')),
    source_name text not null,
    source_system text not null,
    display_name text not null,
    watched_work text not null,
    proof_required text not null,
    board_label text not null,
    obligation_code text not null default 'client_proof_rule',
    ingestion_scopes text[] not null default array['open_obligation']::text[],
    trust_level text not null default 'standard' check (trust_level in ('unverified','standard','trusted','verified')),
    requires_human_approval boolean not null default false,
    allow_auto_obligation boolean not null default true,
    allow_auto_resolution boolean not null default false,
    governing_policy_ref text,
    token_fingerprint text,
    token_hint text,
    status text not null default 'active' check (status in ('active','paused','revoked')),
    last_seen_at timestamptz,
    last_event_at timestamptz,
    last_success_at timestamptz,
    last_error_at timestamptz,
    last_error text,
    event_count bigint not null default 0,
    error_count bigint not null default 0,
    created_by uuid not null,
    created_at timestamptz not null default now(),
    rotated_at timestamptz,
    revoked_at timestamptz,
    unique (workspace_id, source_system),
    unique (workspace_id, source_name)
);

create table if not exists intake.ingestion_events (
    id uuid primary key default gen_random_uuid(),
    connected_system_id uuid references intake.connected_systems(id) on delete set null,
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    source_event_id uuid references ingest.source_events(id) on delete set null,
    obligation_id uuid references core.obligations(id) on delete set null,
    source_system text not null,
    source_event_key text not null,
    source_event_type text not null,
    status text not null check (status in ('accepted','duplicate','rejected','error')),
    trust_level text not null default 'standard',
    agent_run_id text,
    mcp_tool_name text,
    workflow_chain jsonb not null default '[]'::jsonb,
    payload_snapshot jsonb not null default '{}'::jsonb,
    error text,
    received_at timestamptz not null default now()
);

comment on table intake.connected_systems is 'Productized operational ingestion registry. Systems create signals; AutoKirk governs whether those signals count.';
comment on table intake.ingestion_events is 'Append-only operational intake trail for connected systems, agent claims, and webhook events.';

create index if not exists idx_connected_systems_workspace_status on intake.connected_systems(workspace_id, status);
create index if not exists idx_connected_systems_workspace_connector on intake.connected_systems(workspace_id, connector_type, status);
create index if not exists idx_ingestion_events_workspace_received on intake.ingestion_events(workspace_id, received_at desc);
create index if not exists idx_ingestion_events_connected_system on intake.ingestion_events(connected_system_id, received_at desc);
create index if not exists idx_ingestion_events_source_event on intake.ingestion_events(workspace_id, source_system, source_event_key);

drop trigger if exists trg_block_mutation_ingestion_events on intake.ingestion_events;
create trigger trg_block_mutation_ingestion_events before update or delete on intake.ingestion_events for each row execute function kernel.block_mutation();

alter table intake.connected_systems enable row level security;
alter table intake.ingestion_events enable row level security;

drop policy if exists connected_systems_select_for_workspace_members on intake.connected_systems;
create policy connected_systems_select_for_workspace_members on intake.connected_systems for select to authenticated using (kernel.user_is_workspace_member(workspace_id));

drop policy if exists ingestion_events_select_for_workspace_members on intake.ingestion_events;
create policy ingestion_events_select_for_workspace_members on intake.ingestion_events for select to authenticated using (kernel.user_is_workspace_member(workspace_id));

grant usage on schema intake to authenticated;
grant select on table intake.connected_systems to authenticated;
grant select on table intake.ingestion_events to authenticated;

create or replace function api.register_connected_system(
    p_workspace_id uuid,
    p_actor_id uuid,
    p_connected_system_id uuid default null,
    p_source_type text default 'external_system',
    p_connector_type text default 'webhook',
    p_source_name text default null,
    p_display_name text default null,
    p_watched_work text default null,
    p_proof_required text default null,
    p_board_label text default null,
    p_obligation_code text default 'client_proof_rule',
    p_ingestion_scopes text[] default array['open_obligation']::text[],
    p_trust_level text default 'standard',
    p_requires_human_approval boolean default false,
    p_allow_auto_resolution boolean default false,
    p_governing_policy_ref text default null,
    p_token_fingerprint text default null,
    p_token_hint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_id uuid := coalesce(p_connected_system_id, gen_random_uuid());
    v_source_type text := coalesce(nullif(btrim(p_source_type), ''), 'external_system');
    v_connector_type text := coalesce(nullif(btrim(p_connector_type), ''), 'webhook');
    v_source_name text;
    v_display_name text;
    v_source_system text;
    v_claim_source_id uuid;
    v_authority_boundary_id uuid;
begin
    if p_workspace_id is null then raise exception 'WORKSPACE_ID_REQUIRED'; end if;
    if p_actor_id is null then raise exception 'ACTOR_ID_REQUIRED'; end if;

    perform core.assert_member(p_workspace_id, p_actor_id);

    if v_source_type not in ('human','api','automation','agent','multi_agent','external_system') then
        raise exception 'INVALID_SOURCE_TYPE: %', v_source_type;
    end if;
    if v_connector_type not in ('manual','webhook','api','crm','form','email','payment','job_system','agent','mcp','automation','other') then
        raise exception 'INVALID_CONNECTOR_TYPE: %', v_connector_type;
    end if;

    v_display_name := nullif(btrim(coalesce(p_display_name, p_board_label, p_source_name, '')), '');
    if v_display_name is null then raise exception 'DISPLAY_NAME_REQUIRED'; end if;

    v_source_name := nullif(btrim(coalesce(p_source_name, v_display_name)), '');
    v_source_system := 'connected:' || v_connector_type || ':' || v_id::text;

    v_claim_source_id := api.register_claim_source(
        p_workspace_id,
        v_source_type,
        v_source_name,
        v_source_system,
        p_token_fingerprint,
        jsonb_build_object('connected_system_id', v_id, 'connector_type', v_connector_type, 'trust_level', coalesce(p_trust_level, 'standard'), 'source_system', v_source_system)
    );

    v_authority_boundary_id := api.upsert_authority_boundary(
        p_workspace_id,
        'connected_system:' || v_id::text,
        v_claim_source_id,
        jsonb_build_object('connected_system_id', v_id, 'connector_type', v_connector_type, 'source_system', v_source_system, 'trust_level', coalesce(p_trust_level, 'standard'), 'allow_auto_obligation', true, 'allow_auto_resolution', coalesce(p_allow_auto_resolution, false)),
        array[v_connector_type, v_source_type],
        array['resolve_with_proof'],
        coalesce(p_requires_human_approval, false),
        coalesce(p_trust_level, 'standard'),
        coalesce(p_governing_policy_ref, 'connected-system-intake-v1'),
        true
    );

    insert into intake.connected_systems (
        id, workspace_id, claim_source_id, authority_boundary_id, source_type, connector_type, source_name, source_system, display_name,
        watched_work, proof_required, board_label, obligation_code, ingestion_scopes, trust_level, requires_human_approval,
        allow_auto_obligation, allow_auto_resolution, governing_policy_ref, token_fingerprint, token_hint, status, created_by
    ) values (
        v_id, p_workspace_id, v_claim_source_id, v_authority_boundary_id, v_source_type, v_connector_type, v_source_name, v_source_system, v_display_name,
        coalesce(nullif(btrim(coalesce(p_watched_work, '')), ''), v_display_name),
        coalesce(nullif(btrim(coalesce(p_proof_required, '')), ''), 'proof required'),
        coalesce(nullif(btrim(coalesce(p_board_label, v_display_name)), ''), v_display_name),
        coalesce(nullif(btrim(coalesce(p_obligation_code, '')), ''), 'client_proof_rule'),
        coalesce(p_ingestion_scopes, array['open_obligation']::text[]), coalesce(p_trust_level, 'standard'), coalesce(p_requires_human_approval, false),
        true, coalesce(p_allow_auto_resolution, false), p_governing_policy_ref, p_token_fingerprint, p_token_hint, 'active', p_actor_id
    )
    on conflict (id) do update set
        claim_source_id = excluded.claim_source_id,
        authority_boundary_id = excluded.authority_boundary_id,
        source_type = excluded.source_type,
        connector_type = excluded.connector_type,
        source_name = excluded.source_name,
        display_name = excluded.display_name,
        watched_work = excluded.watched_work,
        proof_required = excluded.proof_required,
        board_label = excluded.board_label,
        obligation_code = excluded.obligation_code,
        ingestion_scopes = excluded.ingestion_scopes,
        trust_level = excluded.trust_level,
        requires_human_approval = excluded.requires_human_approval,
        allow_auto_resolution = excluded.allow_auto_resolution,
        governing_policy_ref = excluded.governing_policy_ref,
        token_fingerprint = excluded.token_fingerprint,
        token_hint = excluded.token_hint,
        status = 'active',
        rotated_at = case when intake.connected_systems.token_fingerprint is distinct from excluded.token_fingerprint then now() else intake.connected_systems.rotated_at end,
        revoked_at = null;

    return jsonb_build_object('ok', true, 'connected_system_id', v_id, 'source_system', v_source_system, 'claim_source_id', v_claim_source_id, 'authority_boundary_id', v_authority_boundary_id, 'status', 'active');
end;
$$;

create or replace function api.ingest_connected_system_event(
    p_connected_system_id uuid,
    p_workspace_id uuid,
    p_actor_id uuid,
    p_source_event_key text,
    p_source_event_type text,
    p_payload jsonb default '{}'::jsonb,
    p_occurred_at timestamptz default null,
    p_token_fingerprint text default null,
    p_claimant_identity text default null,
    p_execution_identity text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_system intake.connected_systems%rowtype;
    v_ingest jsonb;
    v_source_event_id uuid;
    v_obligation_id uuid;
    v_replayed boolean;
    v_status text;
    v_agent_run_id text;
    v_mcp_tool_name text;
    v_workflow_chain jsonb;
begin
    if p_connected_system_id is null then raise exception 'CONNECTED_SYSTEM_ID_REQUIRED'; end if;
    if p_workspace_id is null then raise exception 'WORKSPACE_ID_REQUIRED'; end if;
    if p_actor_id is null then raise exception 'ACTOR_ID_REQUIRED'; end if;
    if nullif(btrim(coalesce(p_source_event_key, '')), '') is null then raise exception 'SOURCE_EVENT_KEY_REQUIRED'; end if;
    if nullif(btrim(coalesce(p_source_event_type, '')), '') is null then raise exception 'SOURCE_EVENT_TYPE_REQUIRED'; end if;

    select * into v_system from intake.connected_systems where id = p_connected_system_id and workspace_id = p_workspace_id;
    if v_system.id is null then raise exception 'CONNECTED_SYSTEM_NOT_FOUND'; end if;
    if v_system.status <> 'active' then raise exception 'CONNECTED_SYSTEM_NOT_ACTIVE: %', v_system.status; end if;
    if v_system.token_fingerprint is not null and p_token_fingerprint is not null and v_system.token_fingerprint <> p_token_fingerprint then raise exception 'CONNECTED_SYSTEM_TOKEN_MISMATCH'; end if;
    if v_system.allow_auto_obligation is not true then raise exception 'CONNECTED_SYSTEM_AUTO_OBLIGATION_DISABLED'; end if;

    perform core.assert_member(p_workspace_id, p_actor_id);

    v_ingest := api.ingest_event_to_obligation(
        p_workspace_id,
        p_actor_id,
        v_system.source_system,
        p_source_event_key,
        p_source_event_type,
        jsonb_build_object('connected_system_id', v_system.id, 'display_name', v_system.display_name, 'connector_type', v_system.connector_type, 'source_type', v_system.source_type, 'source_system', v_system.source_system, 'watched_work', v_system.watched_work, 'proof_required', v_system.proof_required, 'board_label', v_system.board_label, 'trust_level', v_system.trust_level, 'payload', coalesce(p_payload, '{}'::jsonb)),
        coalesce(p_occurred_at, now()),
        v_system.obligation_code
    );

    v_source_event_id := (v_ingest ->> 'source_event_id')::uuid;
    v_obligation_id := (v_ingest -> 'obligation' ->> 'obligation_id')::uuid;
    v_replayed := coalesce((v_ingest -> 'obligation' ->> 'replayed')::boolean, false);
    v_status := case when v_replayed then 'duplicate' else 'accepted' end;
    v_agent_run_id := coalesce(p_payload ->> 'agent_run_id', p_payload ->> 'run_id', p_payload ->> 'session_id');
    v_mcp_tool_name := coalesce(p_payload ->> 'mcp_tool_name', p_payload ->> 'tool_name');
    v_workflow_chain := coalesce(p_payload -> 'workflow_chain', p_payload -> 'agent_chain', '[]'::jsonb);

    perform api.attach_obligation_claim_context(
        v_obligation_id,
        v_system.claim_source_id,
        v_system.authority_boundary_id,
        coalesce(p_claimant_identity, v_system.source_system),
        coalesce(p_execution_identity, v_agent_run_id, v_system.source_name),
        jsonb_build_object('connected_system_id', v_system.id, 'source_type', v_system.source_type, 'connector_type', v_system.connector_type, 'source_system', v_system.source_system, 'source_event_key', p_source_event_key, 'source_event_type', p_source_event_type, 'trust_level', v_system.trust_level, 'agent_run_id', v_agent_run_id, 'mcp_tool_name', v_mcp_tool_name, 'workflow_chain', v_workflow_chain, 'payload', coalesce(p_payload, '{}'::jsonb))
    );

    insert into intake.ingestion_events (connected_system_id, workspace_id, source_event_id, obligation_id, source_system, source_event_key, source_event_type, status, trust_level, agent_run_id, mcp_tool_name, workflow_chain, payload_snapshot)
    values (v_system.id, p_workspace_id, v_source_event_id, v_obligation_id, v_system.source_system, p_source_event_key, p_source_event_type, v_status, v_system.trust_level, v_agent_run_id, v_mcp_tool_name, v_workflow_chain, coalesce(p_payload, '{}'::jsonb));

    update intake.connected_systems set last_seen_at = now(), last_event_at = now(), last_success_at = now(), last_error = null, event_count = event_count + case when v_replayed then 0 else 1 end where id = v_system.id;

    return jsonb_build_object('ok', true, 'connected_system_id', v_system.id, 'source_system', v_system.source_system, 'source_event_id', v_source_event_id, 'obligation_id', v_obligation_id, 'replayed', v_replayed, 'status', v_status, 'claim_source_id', v_system.claim_source_id, 'authority_boundary_id', v_system.authority_boundary_id);
exception when others then
    update intake.connected_systems set last_seen_at = now(), last_error_at = now(), last_error = sqlerrm, error_count = error_count + 1 where id = p_connected_system_id;
    raise;
end;
$$;

create or replace function api.revoke_connected_system(p_connected_system_id uuid, p_workspace_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if p_connected_system_id is null then raise exception 'CONNECTED_SYSTEM_ID_REQUIRED'; end if;
    if p_workspace_id is null then raise exception 'WORKSPACE_ID_REQUIRED'; end if;
    if p_actor_id is null then raise exception 'ACTOR_ID_REQUIRED'; end if;
    perform core.assert_member(p_workspace_id, p_actor_id);
    update intake.connected_systems set status = 'revoked', revoked_at = now() where id = p_connected_system_id and workspace_id = p_workspace_id;
    if not found then raise exception 'CONNECTED_SYSTEM_NOT_FOUND'; end if;
    return jsonb_build_object('ok', true, 'connected_system_id', p_connected_system_id, 'status', 'revoked');
end;
$$;

revoke all on function api.register_connected_system(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text[], text, boolean, boolean, text, text, text) from public;
revoke all on function api.ingest_connected_system_event(uuid, uuid, uuid, text, text, jsonb, timestamptz, text, text, text) from public;
revoke all on function api.revoke_connected_system(uuid, uuid, uuid) from public;

grant execute on function api.register_connected_system(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text[], text, boolean, boolean, text, text, text) to authenticated, service_role;
grant execute on function api.ingest_connected_system_event(uuid, uuid, uuid, text, text, jsonb, timestamptz, text, text, text) to authenticated, service_role;
grant execute on function api.revoke_connected_system(uuid, uuid, uuid) to authenticated, service_role;

commit;
