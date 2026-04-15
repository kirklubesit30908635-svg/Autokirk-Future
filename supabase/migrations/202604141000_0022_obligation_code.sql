alter table core.obligations
add column obligation_code text not null default 'unclassified';
