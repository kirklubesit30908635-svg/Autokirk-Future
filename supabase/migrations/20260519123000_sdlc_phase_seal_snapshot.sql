-- AutoKirk Customer #0000 SDLC proof boundary
-- Adds a read-only RPC used by the SDLC phase seal emitter.
-- This function produces evidence only. It does not close obligations.

create or replace function api.sdlc_phase_seal_current_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = api, core, ledger, receipts, registry, public
as $$
declare
  v_migration_count integer := 0;
  v_obligation_count integer := 0;
  v_resolved_count integer := 0;
  v_resolved_with_receipt_count integer := 0;
  v_receipt_invariant_holds boolean := false;
  v_protected_rls jsonb := '[]'::jsonb;
begin
  select count(*)::integer
    into v_migration_count
    from supabase_migrations.schema_migrations;

  select count(*)::integer
    into v_obligation_count
    from core.obligations;

  select count(*)::integer
    into v_resolved_count
    from core.obligations
   where status = 'resolved';

  select count(distinct o.id)::integer
    into v_resolved_with_receipt_count
    from core.obligations o
    join receipts.receipts r
      on r.obligation_id = o.id
   where o.status = 'resolved';

  v_receipt_invariant_holds := v_resolved_count = v_resolved_with_receipt_count;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'schema', n.nspname,
      'table', c.relname,
      'rls_enabled', c.relrowsecurity,
      'rls_forced', c.relforcerowsecurity
    )
    order by n.nspname, c.relname
  ), '[]'::jsonb)
    into v_protected_rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where c.relkind = 'r'
     and n.nspname in ('core', 'ledger', 'receipts', 'registry', 'ingest')
     and c.relname in (
       'obligations',
       'obligation_lifecycle',
       'events',
       'chain_heads',
       'receipts',
       'workspaces',
       'workspace_members',
       'legal_entities',
       'source_events'
     );

  return jsonb_build_object(
    'schema', 'autokirk.sdlc_phase_seal_current_snapshot.v1',
    'observed_at', now(),
    'project_ref', current_setting('request.jwt.claim.ref', true),
    'migration_count', v_migration_count,
    'obligation_count', v_obligation_count,
    'resolved_obligation_count', v_resolved_count,
    'resolved_with_receipt_count', v_resolved_with_receipt_count,
    'receipt_invariant_holds', v_receipt_invariant_holds,
    'protected_table_rls', v_protected_rls
  );
end;
$$;

revoke all on function api.sdlc_phase_seal_current_snapshot() from public;
grant execute on function api.sdlc_phase_seal_current_snapshot() to service_role;
