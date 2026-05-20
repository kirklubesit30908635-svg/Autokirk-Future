-- Phase 2 follow-up: registry entity read isolation
-- registry.entities is tenant/customer identity data when present.
-- Scope reads through registry.entity_workspaces membership.
--
-- Guarded because some local replay paths do not yet create registry.entities,
-- while remote production has it.

begin;

do $$
begin
  if to_regclass('registry.entities') is not null then
    execute 'alter table registry.entities enable row level security';

    execute '
      drop policy if exists registry_entities_select_for_workspace_members
      on registry.entities
    ';

    execute '
      create policy registry_entities_select_for_workspace_members
      on registry.entities
      for select
      to authenticated
      using (
        exists (
          select 1
          from registry.entity_workspaces ew
          where ew.entity_id = registry.entities.id
            and kernel.user_is_workspace_member(ew.workspace_id)
        )
      )
    ';

    execute 'grant usage on schema registry to authenticated';
    execute 'grant select on table registry.entities to authenticated';
  end if;
end $$;

commit;
