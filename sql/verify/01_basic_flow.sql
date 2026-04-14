-- 01_basic_flow.sql

select 'events' as section, count(*) as total
from ledger.events

union all

select 'obligations' as section, count(*) as total
from core.obligations

union all

select 'receipts' as section, count(*) as total
from ledger.receipts;
