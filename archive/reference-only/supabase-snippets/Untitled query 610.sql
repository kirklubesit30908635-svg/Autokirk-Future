select table_schema, table_name
from information_schema.tables
where table_schema = 'core'
  and table_name in ('workspaces','workspace_members','obligations')
order by table_name;