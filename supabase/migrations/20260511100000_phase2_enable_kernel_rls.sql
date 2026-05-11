begin;

-- ============================================================================
-- AutoKirk Phase 2.0 - Kernel RLS Enablement
-- ----------------------------------------------------------------------------
-- Goal:
--   Close the read-side tenant isolation gap by enabling RLS on the governed
--   kernel tables named in the 2026-05-08 current-state doctrine.
--
-- Scope:
--   - Enable RLS on all 14 governed kernel tables.
--   - Add conservative authenticated SELECT policies where workspace lineage is
--     already present or derivable from workspace membership.
--   - Preserve existing GRANT discipline and SECURITY DEFINER api/kernel write
--     paths. This migration does not add client INSERT/UPDATE/DELETE access.
--   - Do not force RLS yet; table owners / SECURITY DEFINER functions must keep
--     operating while Phase 2 tenant_id propagation is added next.
-- ============================================================================

create schema if not exists kernel;

create or replace function kernel.can_read_workspace(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
    select p_workspace_id is not null
       and exists (
            select 1
              from core.workspace_members wm
             where wm.workspace_id = p_workspace_id
               and wm.user_id = auth.uid()
       );
$$;

revoke all on function kernel.can_read_workspace(uuid) from public;
grant execute on function kernel.can_read_workspace(uuid) to authenticated;

create or replace function kernel.table_has_column(
    p_schema_name text,
    p_table_name text,
    p_column_name text
)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
    select exists (
        select 1
          from information_schema.columns c
         where c.table_schema = p_schema_name
           and c.table_name = p_table_name
           and c.column_name = p_column_name
    );
$$;

revoke all on function kernel.table_has_column(text, text, text) from public;

-- Enable RLS on the 14 governed tables identified as the open read-side gap.
do $$
declare
    v_table regclass;
    v_tables text[] := array[
        'core.workspaces',
        'core.workspace_members',
        'core.obligations',
        'receipts.receipts',
        'ledger.events',
        'ledger.idempotency_keys',
        'ingest.source_events',
        'core.obligation_sources',
        'registry.entities',
        'registry.entity_workspaces',
        'core.proof_contracts',
        'control.watchdog_emissions',
        'core.legal_entities',
        'governance.integrity_score_policy'
    ];
begin
    foreach v_table in array v_tables loop
        execute format('alter table %s enable row level security', v_table);
    end loop;
end;
$$;

-- Workspace root surfaces.
drop policy if exists workspace_members_select_own_workspaces on core.workspace_members;
create policy workspace_members_select_own_workspaces
on core.workspace_members
for select
to authenticated
using (user_id = auth.uid() or kernel.can_read_workspace(workspace_id));

drop policy if exists workspaces_select_member_workspaces on core.workspaces;
create policy workspaces_select_member_workspaces
on core.workspaces
for select
to authenticated
using (kernel.can_read_workspace(id));

-- Direct workspace-scoped governed truth surfaces.
drop policy if exists obligations_select_member_workspaces on core.obligations;
create policy obligations_select_member_workspaces
on core.obligations
for select
to authenticated
using (kernel.can_read_workspace(workspace_id));

drop policy if exists receipts_select_member_workspaces on receipts.receipts;
create policy receipts_select_member_workspaces
on receipts.receipts
for select
to authenticated
using (kernel.can_read_workspace(workspace_id));

drop policy if exists ledger_events_select_member_workspaces on ledger.events;
create policy ledger_events_select_member_workspaces
on ledger.events
for select
to authenticated
using (kernel.can_read_workspace(workspace_id));

-- Conditionally policy surfaces whose workspace column was introduced by later
-- migrations or may differ across clean replay / linked remote history.
do $$
begin
    if kernel.table_has_column('ledger', 'idempotency_keys', 'workspace_id') then
        drop policy if exists idempotency_keys_select_member_workspaces on ledger.idempotency_keys;
        create policy idempotency_keys_select_member_workspaces
        on ledger.idempotency_keys
        for select
        to authenticated
        using (kernel.can_read_workspace(workspace_id));
    end if;

    if kernel.table_has_column('ingest', 'source_events', 'workspace_id') then
        drop policy if exists source_events_select_member_workspaces on ingest.source_events;
        create policy source_events_select_member_workspaces
        on ingest.source_events
        for select
        to authenticated
        using (kernel.can_read_workspace(workspace_id));
    end if;

    if kernel.table_has_column('core', 'obligation_sources', 'workspace_id') then
        drop policy if exists obligation_sources_select_member_workspaces on core.obligation_sources;
        create policy obligation_sources_select_member_workspaces
        on core.obligation_sources
        for select
        to authenticated
        using (kernel.can_read_workspace(workspace_id));
    end if;

    if kernel.table_has_column('registry', 'entity_workspaces', 'workspace_id') then
        drop policy if exists entity_workspaces_select_member_workspaces on registry.entity_workspaces;
        create policy entity_workspaces_select_member_workspaces
        on registry.entity_workspaces
        for select
        to authenticated
        using (kernel.can_read_workspace(workspace_id));
    end if;

    if kernel.table_has_column('core', 'proof_contracts', 'workspace_id') then
        drop policy if exists proof_contracts_select_member_workspaces on core.proof_contracts;
        create policy proof_contracts_select_member_workspaces
        on core.proof_contracts
        for select
        to authenticated
        using (kernel.can_read_workspace(workspace_id));
    end if;

    if kernel.table_has_column('control', 'watchdog_emissions', 'workspace_id') then
        drop policy if exists watchdog_emissions_select_member_workspaces on control.watchdog_emissions;
        create policy watchdog_emissions_select_member_workspaces
        on control.watchdog_emissions
        for select
        to authenticated
        using (kernel.can_read_workspace(workspace_id));
    end if;

    if kernel.table_has_column('core', 'legal_entities', 'workspace_id') then
        drop policy if exists legal_entities_select_member_workspaces on core.legal_entities;
        create policy legal_entities_select_member_workspaces
        on core.legal_entities
        for select
        to authenticated
        using (kernel.can_read_workspace(workspace_id));
    end if;
end;
$$;

-- Entity rows are readable only through a workspace binding. This keeps the
-- entity registry scoped without requiring a tenant_id column in this migration.
drop policy if exists entities_select_member_bound_entities on registry.entities;
create policy entities_select_member_bound_entities
on registry.entities
for select
to authenticated
using (
    exists (
        select 1
          from registry.entity_workspaces ew
         where ew.entity_id = registry.entities.id
           and kernel.can_read_workspace(ew.workspace_id)
    )
);

-- Global governance policy is intentionally not exposed to anon/authenticated
-- here. It is governed configuration, not tenant data. SECURITY DEFINER api and
-- kernel functions continue to read it as owner.

-- Assert the doctrine gap is closed at the catalog level.
do $$
declare
    v_disabled text;
begin
    select string_agg(format('%I.%I', n.nspname, c.relname), ', ' order by n.nspname, c.relname)
      into v_disabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where (n.nspname, c.relname) in (
        ('core', 'workspaces'),
        ('core', 'workspace_members'),
        ('core', 'obligations'),
        ('receipts', 'receipts'),
        ('ledger', 'events'),
        ('ledger', 'idempotency_keys'),
        ('ingest', 'source_events'),
        ('core', 'obligation_sources'),
        ('registry', 'entities'),
        ('registry', 'entity_workspaces'),
        ('core', 'proof_contracts'),
        ('control', 'watchdog_emissions'),
        ('core', 'legal_entities'),
        ('governance', 'integrity_score_policy')
     )
       and c.relkind = 'r'
       and not c.relrowsecurity;

    if v_disabled is not null then
        raise exception 'KERNEL_RLS_NOT_ENABLED: %', v_disabled;
    end if;
end;
$$;

commit;
