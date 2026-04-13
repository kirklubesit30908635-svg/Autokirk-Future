select table_schema, table_name
from information_schema.tables
where table_name in ('obligations','events','receipts','idempotency_keys')
order by table_schema, table_name;