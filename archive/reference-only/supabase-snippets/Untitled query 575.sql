select routine_schema, routine_name
from information_schema.routines
where routine_name ilike '%resolve%'
order by routine_schema, routine_name;