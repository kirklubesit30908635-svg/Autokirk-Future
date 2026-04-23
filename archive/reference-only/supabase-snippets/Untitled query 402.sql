select routine_schema, routine_name
from information_schema.routines
where routine_name ilike '%idempot%'
order by routine_schema, routine_name;