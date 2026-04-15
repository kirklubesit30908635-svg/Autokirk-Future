begin;

alter table core.obligations
add column if not exists truth_burden text not null default 'promise';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'obligations_truth_burden_check'
  ) then
    alter table core.obligations
    add constraint obligations_truth_burden_check
    check (truth_burden in ('promise', 'performance'));
  end if;
end
$$;

comment on column core.obligations.truth_burden is
'Kernel-owned minimal truth class. promise = future commitment burden. performance = present fulfillment burden.';

commit;