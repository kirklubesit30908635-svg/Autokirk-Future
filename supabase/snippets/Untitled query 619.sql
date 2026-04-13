select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'receipts'
  and table_name = 'receipts'
order by ordinal_position;