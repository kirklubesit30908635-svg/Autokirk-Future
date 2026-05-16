begin;

-- Keep proof contracts readable but stop leaving the table without RLS.
-- This preserves existing public read behavior while removing direct client mutation.
alter table core.proof_contracts enable row level security;

drop policy if exists proof_contracts_read_public on core.proof_contracts;
create policy proof_contracts_read_public
on core.proof_contracts
for select
to anon, authenticated
using (true);

revoke insert, update, delete, truncate on table core.proof_contracts from anon, authenticated;
grant select on table core.proof_contracts to anon, authenticated;

-- Direct governed-write RPCs are used by server/API routes with service_role.
-- They should not be callable directly by browser anon/authenticated roles.
revoke execute on function api.register_connected_system(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text[], text, boolean, boolean, text, text, text) from public, anon, authenticated;
revoke execute on function api.ingest_connected_system_event(uuid, uuid, uuid, text, text, jsonb, timestamp with time zone, text, text, text) from public, anon, authenticated;
revoke execute on function api.revoke_connected_system(uuid, uuid, uuid) from public, anon, authenticated;

grant execute on function api.register_connected_system(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text[], text, boolean, boolean, text, text, text) to service_role;
grant execute on function api.ingest_connected_system_event(uuid, uuid, uuid, text, text, jsonb, timestamp with time zone, text, text, text) to service_role;
grant execute on function api.revoke_connected_system(uuid, uuid, uuid) to service_role;

revoke execute on function api.register_claim_source(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function api.upsert_authority_boundary(uuid, text, uuid, jsonb, text[], text[], boolean, text, text, boolean) from public, anon, authenticated;
revoke execute on function api.attach_obligation_claim_context(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function api.evaluate_proof_boundary(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, text, text, text) from public, anon, authenticated;

grant execute on function api.register_claim_source(uuid, text, text, text, text, jsonb) to service_role;
grant execute on function api.upsert_authority_boundary(uuid, text, uuid, jsonb, text[], text[], boolean, text, text, boolean) to service_role;
grant execute on function api.attach_obligation_claim_context(uuid, uuid, uuid, text, text, jsonb) to service_role;
grant execute on function api.evaluate_proof_boundary(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, text, text, text) to service_role;

revoke execute on function api.commit_intake_candidate(uuid, uuid, text, text, text, text, text, text, text, text, timestamp with time zone) from public, anon, authenticated;
revoke execute on function api.ingest_event_to_obligation(uuid, uuid, uuid, text, text, text, jsonb, timestamp with time zone) from public, anon, authenticated;
revoke execute on function api.ingest_event_to_obligation(uuid, uuid, text, text, text, jsonb, timestamp with time zone, text) from public, anon, authenticated;

grant execute on function api.commit_intake_candidate(uuid, uuid, text, text, text, text, text, text, text, text, timestamp with time zone) to service_role;
grant execute on function api.ingest_event_to_obligation(uuid, uuid, uuid, text, text, text, jsonb, timestamp with time zone) to service_role;
grant execute on function api.ingest_event_to_obligation(uuid, uuid, text, text, text, jsonb, timestamp with time zone, text) to service_role;

revoke execute on function api.resolve_with_proof(uuid, uuid, text, jsonb, jsonb, text, text) from public, anon, authenticated;
revoke execute on function api.resolve_with_insufficient_proof(uuid, uuid, text, jsonb, jsonb, text, text) from public, anon, authenticated;
revoke execute on function api.resolve_rejected(uuid, uuid, text, jsonb, jsonb, text, text) from public, anon, authenticated;

grant execute on function api.resolve_with_proof(uuid, uuid, text, jsonb, jsonb, text, text) to service_role;
grant execute on function api.resolve_with_insufficient_proof(uuid, uuid, text, jsonb, jsonb, text, text) to service_role;
grant execute on function api.resolve_rejected(uuid, uuid, text, jsonb, jsonb, text, text) to service_role;

commit;
