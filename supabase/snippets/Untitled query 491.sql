select
  parameter_name,
  data_type,
  ordinal_position
from information_schema.parameters
where specific_schema = 'api'
  and specific_name like 'resolve_obligation%'
order by specific_name, ordinal_position;