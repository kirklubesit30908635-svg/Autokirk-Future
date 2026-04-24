select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'core'
  and table_name = 'workspace_members'
order by ordinal_position;