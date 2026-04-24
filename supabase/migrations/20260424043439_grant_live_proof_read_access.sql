begin;

grant usage on schema ingest to service_role;
grant usage on schema core to service_role;
grant usage on schema ledger to service_role;
grant usage on schema receipts to service_role;
grant usage on schema projection to service_role;

grant select on table ingest.source_events to service_role;
grant select on table core.obligations to service_role;
grant select on table ledger.events to service_role;
grant select on table receipts.receipts to service_role;
grant select on table projection.obligation_lifecycle to service_role;

commit;
