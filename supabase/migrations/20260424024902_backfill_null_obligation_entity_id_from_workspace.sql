update core.obligations
set entity_id = workspace_id
where entity_id is null;
