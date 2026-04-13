select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'core'
  and table_name = 'obligations'
order by ordinal_position;