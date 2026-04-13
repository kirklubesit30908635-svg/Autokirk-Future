select
  n.nspname as schema_name,
  c.relname as table_name,
  pg_get_constraintdef(con.oid) as constraint_def
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where c.relname = 'obligations';