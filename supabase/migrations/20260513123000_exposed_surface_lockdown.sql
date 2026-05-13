-- Launch hardening: exposed surface lockdown.
-- This migration intentionally does not change kernel semantics.
-- It removes browser-role EXECUTE access from internal schemas and removes anonymous EXECUTE from API RPCs.

alter table if exists core.proof_contracts enable row level security;

revoke all on schema kernel from anon, authenticated;
revoke all on all functions in schema kernel from anon, authenticated;

revoke all on schema ledger from anon, authenticated;
revoke all on all functions in schema ledger from anon, authenticated;

revoke all on schema core from anon;
revoke all on all functions in schema core from anon;
revoke execute on all functions in schema core from authenticated;

grant usage on schema api to authenticated;
grant execute on all functions in schema api to authenticated;
revoke execute on all functions in schema api from anon;

revoke execute on function public.ingest_event_to_obligation(uuid, uuid, text, text, text, jsonb, timestamptz) from anon, authenticated;
revoke execute on function public.record_watchdog_attempt(uuid, text, timestamptz) from anon, authenticated;

-- Trigger functions are still invoked by table triggers and do not need direct browser EXECUTE grants.
comment on schema kernel is 'Internal governed kernel. Browser roles must not execute kernel functions directly.';
comment on schema ledger is 'Internal append-only ledger and chain functions. Browser roles must not execute ledger functions directly.';
comment on table core.proof_contracts is 'Proof contract reference data. RLS enabled as part of launch surface lockdown.';
