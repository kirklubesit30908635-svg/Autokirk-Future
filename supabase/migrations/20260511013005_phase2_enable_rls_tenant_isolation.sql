-- Phase 2: Tenant / workspace read isolation
-- Enables RLS on tenant-owned read surfaces and scopes SELECT access
-- through core.workspace_members.
--
-- Doctrine:
-- - Client roles may read only rows for workspaces they belong to.
-- - Client roles do not receive mutation policies here.
-- - Governed writes remain through api.* SECURITY DEFINER functions.
-- - Do not FORCE RLS; governed definer functions/table owners must continue working.
-- - ledger.receipts is a view, so RLS is applied only to receipts.receipts.

begin;

create or replace function kernel.user_is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = core, kernel, public
as $$
  select exists (
    select 1
    from core.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

revoke all on function kernel.user_is_workspace_member(uuid) from public;
grant execute on function kernel.user_is_workspace_member(uuid) to authenticated;

alter table core.workspace_members enable row level security;
alter table core.obligations enable row level security;
alter table core.obligation_sources enable row level security;
alter table ingest.source_events enable row level security;
alter table ledger.chain_heads enable row level security;
alter table ledger.events enable row level security;
alter table ledger.idempotency_keys enable row level security;
alter table receipts.receipts enable row level security;
alter table control.watchdog_emissions enable row level security;

do $$
begin
  if to_regclass('registry.entity_workspaces') is not null then
    execute 'alter table registry.entity_workspaces enable row level security';
  end if;
end $$;

drop policy if exists workspace_members_select_own
on core.workspace_members;

create policy workspace_members_select_own
on core.workspace_members
for select
to authenticated
using (user_id = auth.uid());


drop policy if exists obligations_select_for_workspace_members
on core.obligations;

create policy obligations_select_for_workspace_members
on core.obligations
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));


drop policy if exists obligation_sources_select_for_workspace_members
on core.obligation_sources;

create policy obligation_sources_select_for_workspace_members
on core.obligation_sources
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));


drop policy if exists source_events_select_for_workspace_members
on ingest.source_events;

create policy source_events_select_for_workspace_members
on ingest.source_events
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));


drop policy if exists chain_heads_select_for_workspace_members
on ledger.chain_heads;

create policy chain_heads_select_for_workspace_members
on ledger.chain_heads
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));


drop policy if exists ledger_events_select_for_workspace_members
on ledger.events;

create policy ledger_events_select_for_workspace_members
on ledger.events
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));


drop policy if exists receipts_select_for_workspace_members
on receipts.receipts;

create policy receipts_select_for_workspace_members
on receipts.receipts
for select
to authenticated
using (kernel.user_is_workspace_member(workspace_id));


drop policy if exists idempotency_keys_select_for_workspace_members
on ledger.idempotency_keys;

create policy idempotency_keys_select_for_workspace_members
on ledger.idempotency_keys
for select
to authenticated
using (
  exists (
    select 1
    from core.obligations o
    where o.id = ledger.idempotency_keys.obligation_id
      and kernel.user_is_workspace_member(o.workspace_id)
  )
);


drop policy if exists watchdog_emissions_select_for_workspace_members
on control.watchdog_emissions;

create policy watchdog_emissions_select_for_workspace_members
on control.watchdog_emissions
for select
to authenticated
using (
  exists (
    select 1
    from core.obligations o
    where o.id = control.watchdog_emissions.obligation_id
      and kernel.user_is_workspace_member(o.workspace_id)
  )
);


do $$
begin
  if to_regclass('registry.entity_workspaces') is not null then
    execute '
      drop policy if exists entity_workspaces_select_for_workspace_members
      on registry.entity_workspaces
    ';

    execute '
      create policy entity_workspaces_select_for_workspace_members
      on registry.entity_workspaces
      for select
      to authenticated
      using (kernel.user_is_workspace_member(workspace_id))
    ';
  end if;
end $$;



-- Tenant identity surfaces.
-- Workspaces are visible only to their members.
alter table core.workspaces enable row level security;
alter table core.legal_entities enable row level security;

drop policy if exists workspaces_select_for_workspace_members
on core.workspaces;

create policy workspaces_select_for_workspace_members
on core.workspaces
for select
to authenticated
using (kernel.user_is_workspace_member(id));


drop policy if exists legal_entities_select_for_workspace_members
on core.legal_entities;

create policy legal_entities_select_for_workspace_members
on core.legal_entities
for select
to authenticated
using (
  exists (
    select 1
    from core.workspaces w
    where w.entity_id = core.legal_entities.id
      and kernel.user_is_workspace_member(w.id)
  )
);


-- Client read grants for RLS-protected tenant surfaces.
-- PostgreSQL requires schema/table privileges before RLS policies are evaluated.
-- These grants do not bypass RLS; row visibility remains controlled by the
-- workspace-member SELECT policies above.

grant usage on schema core to authenticated;
grant usage on schema ingest to authenticated;
grant usage on schema ledger to authenticated;
grant usage on schema receipts to authenticated;
grant usage on schema control to authenticated;
grant usage on schema registry to authenticated;

grant select on table core.legal_entities to authenticated;
grant select on table core.workspaces to authenticated;
grant select on table core.workspace_members to authenticated;
grant select on table core.obligations to authenticated;
grant select on table core.obligation_sources to authenticated;

grant select on table ingest.source_events to authenticated;

grant select on table ledger.chain_heads to authenticated;
grant select on table ledger.events to authenticated;
grant select on table ledger.idempotency_keys to authenticated;

grant select on table receipts.receipts to authenticated;

grant select on table control.watchdog_emissions to authenticated;

do $$
begin
  if to_regclass('registry.entity_workspaces') is not null then
    execute 'grant select on table registry.entity_workspaces to authenticated';
  end if;
end $$;

commit;
