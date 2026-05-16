-- AutoKirk Agentic Proof Boundary Attachment
-- -----------------------------------------------------------------------------
-- Purpose:
--   Make AutoKirk factually capable of governing agentic work without becoming
--   an agent platform, workflow builder, or orchestration layer.
--
-- Doctrine preserved:
--   chosen intake -> governed obligation -> proof path -> receipt
--
-- This migration adds optional sidecar truth around agent/automation provenance,
-- authority boundaries, proof evaluations, and receipt rationales. It does not
-- alter the universal obligation kernel, receipt emission chain, or append-only
-- enforcement model.

begin;

create schema if not exists proof_boundary;

-- -----------------------------------------------------------------------------
-- Claim sources
-- -----------------------------------------------------------------------------
-- A claim source is the universal provenance wrapper for work claims. An agent is
-- only one source type. This keeps the system universal while making autonomous
-- execution legible and governable.

create table if not exists proof_boundary.claim_sources (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    source_type text not null check (
        source_type in (
            'human',
            'api',
            'automation',
            'agent',
            'multi_agent',
            'external_system'
        )
    ),
    source_name text not null,
    external_subject text,
    system_fingerprint text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    unique (workspace_id, source_type, source_name)
);

comment on table proof_boundary.claim_sources is
'Universal provenance registry for obligation claims. Agentic systems are a source type, not a separate product architecture.';

-- -----------------------------------------------------------------------------
-- Authority boundaries
-- -----------------------------------------------------------------------------
-- These records define what a source is allowed to claim, execute, close, or
-- escalate. They are optional attachments to the universal kernel, not alternate
-- kernel semantics.

create table if not exists proof_boundary.authority_boundaries (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    claim_source_id uuid references proof_boundary.claim_sources(id) on delete cascade,
    boundary_name text not null,
    authority_scope jsonb not null default '{}'::jsonb,
    allowed_claim_types text[] not null default array[]::text[],
    allowed_resolution_types text[] not null default array[]::text[],
    requires_human_approval boolean not null default false,
    approval_tier text not null default 'standard',
    governing_policy_ref text,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    unique (workspace_id, boundary_name)
);

comment on table proof_boundary.authority_boundaries is
'Optional authority policy surface used to decide whether claimed work may count as governed completion.';

-- -----------------------------------------------------------------------------
-- Obligation claim context
-- -----------------------------------------------------------------------------
-- One obligation may have one current source/authority context. This allows any
-- intake route to declare who or what made the claim and which authority boundary
-- applies before closure is evaluated.

create table if not exists proof_boundary.obligation_claim_contexts (
    obligation_id uuid primary key references core.obligations(id) on delete cascade,
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    claim_source_id uuid references proof_boundary.claim_sources(id) on delete set null,
    authority_boundary_id uuid references proof_boundary.authority_boundaries(id) on delete set null,
    claimant_identity text,
    execution_identity text,
    claim_payload jsonb not null default '{}'::jsonb,
    attached_at timestamptz not null default now()
);

comment on table proof_boundary.obligation_claim_contexts is
'Sidecar context joining universal obligations to claimant provenance and authority boundaries.';

-- -----------------------------------------------------------------------------
-- Proof evaluations
-- -----------------------------------------------------------------------------
-- This is the policy-aware decision surface: approve, deny, or conditional. It is
-- append-oriented and can be linked to a terminal receipt after kernel resolution.

create table if not exists proof_boundary.proof_evaluations (
    id uuid primary key default gen_random_uuid(),
    obligation_id uuid not null references core.obligations(id) on delete cascade,
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    claim_source_id uuid references proof_boundary.claim_sources(id) on delete set null,
    authority_boundary_id uuid references proof_boundary.authority_boundaries(id) on delete set null,
    decision text not null check (decision in ('approve', 'deny', 'conditional')),
    evaluation_mode text not null default 'policy_evaluated' check (
        evaluation_mode in (
            'deterministic',
            'policy_evaluated',
            'conditional',
            'escalation_required'
        )
    ),
    rationale jsonb not null default '{}'::jsonb,
    cited_controls jsonb not null default '[]'::jsonb,
    required_follow_up jsonb not null default '[]'::jsonb,
    evidence_snapshot jsonb not null default '{}'::jsonb,
    rule_version text not null,
    evaluated_by uuid,
    idempotency_key text not null,
    receipt_id uuid references receipts.receipts(id) on delete set null,
    evaluated_at timestamptz not null default now(),
    unique (workspace_id, idempotency_key)
);

comment on table proof_boundary.proof_evaluations is
'Append-oriented approve/deny/conditional decision record for proof claims and authority-boundary evaluation.';

-- -----------------------------------------------------------------------------
-- Receipt rationales
-- -----------------------------------------------------------------------------
-- Receipts remain immutable terminal artifacts. This sidecar preserves the
-- machine-readable rationale and provenance that made the receipt count.

create table if not exists proof_boundary.receipt_rationales (
    receipt_id uuid primary key references receipts.receipts(id) on delete cascade,
    obligation_id uuid not null references core.obligations(id) on delete cascade,
    workspace_id uuid not null references core.workspaces(id) on delete cascade,
    proof_evaluation_id uuid references proof_boundary.proof_evaluations(id) on delete set null,
    claim_source_id uuid references proof_boundary.claim_sources(id) on delete set null,
    authority_boundary_id uuid references proof_boundary.authority_boundaries(id) on delete set null,
    machine_rationale jsonb not null default '{}'::jsonb,
    authority_decision text not null check (authority_decision in ('approve', 'deny', 'conditional')),
    emitted_at timestamptz not null default now()
);

comment on table proof_boundary.receipt_rationales is
'Machine-readable provenance/rationale attachment proving why a terminal receipt was allowed to count.';

create index if not exists idx_claim_sources_workspace
on proof_boundary.claim_sources(workspace_id);

create index if not exists idx_authority_boundaries_workspace
on proof_boundary.authority_boundaries(workspace_id, active);

create index if not exists idx_obligation_claim_contexts_workspace
on proof_boundary.obligation_claim_contexts(workspace_id);

create index if not exists idx_proof_evaluations_obligation
on proof_boundary.proof_evaluations(obligation_id, evaluated_at desc);

create index if not exists idx_proof_evaluations_workspace_decision
on proof_boundary.proof_evaluations(workspace_id, decision, evaluated_at desc);

create index if not exists idx_receipt_rationales_workspace
on proof_boundary.receipt_rationales(workspace_id, emitted_at desc);

-- -----------------------------------------------------------------------------
-- Append-only protection for proof-boundary truth surfaces
-- -----------------------------------------------------------------------------

create trigger trg_block_mutation_proof_evaluations
before update or delete on proof_boundary.proof_evaluations
for each row execute function kernel.block_mutation();

create trigger trg_block_mutation_receipt_rationales
before update or delete on proof_boundary.receipt_rationales
for each row execute function kernel.block_mutation();

-- -----------------------------------------------------------------------------
-- Tenant read isolation
-- -----------------------------------------------------------------------------

alter table proof_boundary.claim_sources enable row level security;
alter table proof_boundary.authority_boundaries enable row level security;
alter table proof_boundary.obligation_claim_contexts enable row level security;
alter table proof_boundary.proof_evaluations enable row level security;
alter table proof_boundary.receipt_rationales enable row level security;

drop policy if exists claim_sources_select_for_workspace_members
on proof_boundary.claim_sources;
create policy claim_sources_select_for_workspace_members
on proof_boundary.claim_sources
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));

drop policy if exists authority_boundaries_select_for_workspace_members
on proof_boundary.authority_boundaries;
create policy authority_boundaries_select_for_workspace_members
on proof_boundary.authority_boundaries
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));

drop policy if exists obligation_claim_contexts_select_for_workspace_members
on proof_boundary.obligation_claim_contexts;
create policy obligation_claim_contexts_select_for_workspace_members
on proof_boundary.obligation_claim_contexts
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));

drop policy if exists proof_evaluations_select_for_workspace_members
on proof_boundary.proof_evaluations;
create policy proof_evaluations_select_for_workspace_members
on proof_boundary.proof_evaluations
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));

drop policy if exists receipt_rationales_select_for_workspace_members
on proof_boundary.receipt_rationales;
create policy receipt_rationales_select_for_workspace_members
on proof_boundary.receipt_rationales
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));

grant usage on schema proof_boundary to authenticated;
grant select on table proof_boundary.claim_sources to authenticated;
grant select on table proof_boundary.authority_boundaries to authenticated;
grant select on table proof_boundary.obligation_claim_contexts to authenticated;
grant select on table proof_boundary.proof_evaluations to authenticated;
grant select on table proof_boundary.receipt_rationales to authenticated;

-- -----------------------------------------------------------------------------
-- Governed API attachment functions
-- -----------------------------------------------------------------------------

create or replace function api.register_claim_source(
    p_workspace_id uuid,
    p_source_type text,
    p_source_name text,
    p_external_subject text default null,
    p_system_fingerprint text default null,
    p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_id uuid;
begin
    insert into proof_boundary.claim_sources (
        workspace_id,
        source_type,
        source_name,
        external_subject,
        system_fingerprint,
        metadata
    ) values (
        p_workspace_id,
        p_source_type,
        p_source_name,
        p_external_subject,
        p_system_fingerprint,
        coalesce(p_metadata, '{}'::jsonb)
    )
    on conflict (workspace_id, source_type, source_name)
    do update set
        external_subject = excluded.external_subject,
        system_fingerprint = excluded.system_fingerprint,
        metadata = excluded.metadata
    returning id into v_id;

    return v_id;
end;
$$;

create or replace function api.upsert_authority_boundary(
    p_workspace_id uuid,
    p_boundary_name text,
    p_claim_source_id uuid default null,
    p_authority_scope jsonb default '{}'::jsonb,
    p_allowed_claim_types text[] default array[]::text[],
    p_allowed_resolution_types text[] default array[]::text[],
    p_requires_human_approval boolean default false,
    p_approval_tier text default 'standard',
    p_governing_policy_ref text default null,
    p_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_id uuid;
begin
    insert into proof_boundary.authority_boundaries (
        workspace_id,
        claim_source_id,
        boundary_name,
        authority_scope,
        allowed_claim_types,
        allowed_resolution_types,
        requires_human_approval,
        approval_tier,
        governing_policy_ref,
        active
    ) values (
        p_workspace_id,
        p_claim_source_id,
        p_boundary_name,
        coalesce(p_authority_scope, '{}'::jsonb),
        coalesce(p_allowed_claim_types, array[]::text[]),
        coalesce(p_allowed_resolution_types, array[]::text[]),
        coalesce(p_requires_human_approval, false),
        coalesce(p_approval_tier, 'standard'),
        p_governing_policy_ref,
        coalesce(p_active, true)
    )
    on conflict (workspace_id, boundary_name)
    do update set
        claim_source_id = excluded.claim_source_id,
        authority_scope = excluded.authority_scope,
        allowed_claim_types = excluded.allowed_claim_types,
        allowed_resolution_types = excluded.allowed_resolution_types,
        requires_human_approval = excluded.requires_human_approval,
        approval_tier = excluded.approval_tier,
        governing_policy_ref = excluded.governing_policy_ref,
        active = excluded.active
    returning id into v_id;

    return v_id;
end;
$$;

create or replace function api.attach_obligation_claim_context(
    p_obligation_id uuid,
    p_claim_source_id uuid default null,
    p_authority_boundary_id uuid default null,
    p_claimant_identity text default null,
    p_execution_identity text default null,
    p_claim_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_workspace_id uuid;
begin
    select workspace_id
      into v_workspace_id
      from core.obligations
     where id = p_obligation_id;

    if v_workspace_id is null then
        raise exception 'OBLIGATION_NOT_FOUND: %', p_obligation_id;
    end if;

    insert into proof_boundary.obligation_claim_contexts (
        obligation_id,
        workspace_id,
        claim_source_id,
        authority_boundary_id,
        claimant_identity,
        execution_identity,
        claim_payload
    ) values (
        p_obligation_id,
        v_workspace_id,
        p_claim_source_id,
        p_authority_boundary_id,
        p_claimant_identity,
        p_execution_identity,
        coalesce(p_claim_payload, '{}'::jsonb)
    )
    on conflict (obligation_id)
    do update set
        claim_source_id = excluded.claim_source_id,
        authority_boundary_id = excluded.authority_boundary_id,
        claimant_identity = excluded.claimant_identity,
        execution_identity = excluded.execution_identity,
        claim_payload = excluded.claim_payload,
        attached_at = now();

    return p_obligation_id;
end;
$$;

create or replace function api.evaluate_proof_boundary(
    p_obligation_id uuid,
    p_actor_id uuid,
    p_decision text,
    p_evaluation_mode text,
    p_rationale jsonb,
    p_cited_controls jsonb,
    p_required_follow_up jsonb,
    p_evidence_snapshot jsonb,
    p_rule_version text,
    p_idempotency_key text,
    p_reason text default 'Proof boundary evaluation approved closure'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_workspace_id uuid;
    v_context record;
    v_evaluation_id uuid;
    v_receipt_id uuid;
    v_resolution jsonb;
begin
    if p_decision not in ('approve', 'deny', 'conditional') then
        raise exception 'INVALID_PROOF_BOUNDARY_DECISION: %', p_decision;
    end if;

    select workspace_id
      into v_workspace_id
      from core.obligations
     where id = p_obligation_id;

    if v_workspace_id is null then
        raise exception 'OBLIGATION_NOT_FOUND: %', p_obligation_id;
    end if;

    select *
      into v_context
      from proof_boundary.obligation_claim_contexts
     where obligation_id = p_obligation_id;

    insert into proof_boundary.proof_evaluations (
        obligation_id,
        workspace_id,
        claim_source_id,
        authority_boundary_id,
        decision,
        evaluation_mode,
        rationale,
        cited_controls,
        required_follow_up,
        evidence_snapshot,
        rule_version,
        evaluated_by,
        idempotency_key
    ) values (
        p_obligation_id,
        v_workspace_id,
        v_context.claim_source_id,
        v_context.authority_boundary_id,
        p_decision,
        coalesce(p_evaluation_mode, case when p_decision = 'conditional' then 'conditional' else 'policy_evaluated' end),
        coalesce(p_rationale, '{}'::jsonb),
        coalesce(p_cited_controls, '[]'::jsonb),
        coalesce(p_required_follow_up, '[]'::jsonb),
        coalesce(p_evidence_snapshot, '{}'::jsonb),
        p_rule_version,
        p_actor_id,
        p_idempotency_key
    )
    on conflict (workspace_id, idempotency_key)
    do nothing
    returning id into v_evaluation_id;

    if v_evaluation_id is null then
        select id
          into v_evaluation_id
          from proof_boundary.proof_evaluations
         where workspace_id = v_workspace_id
           and idempotency_key = p_idempotency_key;
    end if;

    if p_decision = 'approve' then
        v_resolution := api.resolve_with_proof(
            p_obligation_id     => p_obligation_id,
            p_actor_id          => p_actor_id,
            p_reason            => p_reason,
            p_evidence_present  => jsonb_build_object(
                'proof_boundary_evaluation_id', v_evaluation_id,
                'decision', p_decision,
                'evidence', coalesce(p_evidence_snapshot, '{}'::jsonb),
                'rationale', coalesce(p_rationale, '{}'::jsonb),
                'cited_controls', coalesce(p_cited_controls, '[]'::jsonb)
            ),
            p_failed_checks     => coalesce(p_required_follow_up, '[]'::jsonb),
            p_rule_version      => p_rule_version,
            p_idempotency_key   => 'proof-boundary-resolution:' || p_idempotency_key
        );

        select r.id
          into v_receipt_id
          from receipts.receipts r
         where r.obligation_id = p_obligation_id
           and r.rule_version = p_rule_version
         order by r.emitted_at desc
         limit 1;

        if v_receipt_id is not null then
            update proof_boundary.proof_evaluations
               set receipt_id = v_receipt_id
             where id = v_evaluation_id
               and receipt_id is null;

            insert into proof_boundary.receipt_rationales (
                receipt_id,
                obligation_id,
                workspace_id,
                proof_evaluation_id,
                claim_source_id,
                authority_boundary_id,
                machine_rationale,
                authority_decision
            ) values (
                v_receipt_id,
                p_obligation_id,
                v_workspace_id,
                v_evaluation_id,
                v_context.claim_source_id,
                v_context.authority_boundary_id,
                jsonb_build_object(
                    'decision', p_decision,
                    'evaluation_mode', coalesce(p_evaluation_mode, 'policy_evaluated'),
                    'rationale', coalesce(p_rationale, '{}'::jsonb),
                    'cited_controls', coalesce(p_cited_controls, '[]'::jsonb),
                    'claim_context', coalesce(v_context.claim_payload, '{}'::jsonb)
                ),
                p_decision
            )
            on conflict (receipt_id) do nothing;
        end if;
    else
        v_resolution := jsonb_build_object(
            'status', 'not_resolved',
            'decision', p_decision,
            'proof_boundary_evaluation_id', v_evaluation_id,
            'required_follow_up', coalesce(p_required_follow_up, '[]'::jsonb)
        );
    end if;

    return jsonb_build_object(
        'proof_boundary_evaluation_id', v_evaluation_id,
        'decision', p_decision,
        'resolution', v_resolution
    );
end;
$$;

revoke all on function api.register_claim_source(uuid, text, text, text, text, jsonb) from public;
revoke all on function api.upsert_authority_boundary(uuid, text, uuid, jsonb, text[], text[], boolean, text, text, boolean) from public;
revoke all on function api.attach_obligation_claim_context(uuid, uuid, uuid, text, text, jsonb) from public;
revoke all on function api.evaluate_proof_boundary(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, text, text, text) from public;

grant execute on function api.register_claim_source(uuid, text, text, text, text, jsonb) to authenticated, service_role;
grant execute on function api.upsert_authority_boundary(uuid, text, uuid, jsonb, text[], text[], boolean, text, text, boolean) to authenticated, service_role;
grant execute on function api.attach_obligation_claim_context(uuid, uuid, uuid, text, text, jsonb) to authenticated, service_role;
grant execute on function api.evaluate_proof_boundary(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, text, text, text) to authenticated, service_role;

commit;
