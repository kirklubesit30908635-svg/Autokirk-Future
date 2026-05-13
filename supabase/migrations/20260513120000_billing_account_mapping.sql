create schema if not exists billing;

create table if not exists billing.accounts (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references core.workspaces(id) on delete restrict,
    actor_id uuid not null,
    stripe_customer_id text not null unique,
    stripe_subscription_id text unique,
    stripe_checkout_session_id text unique,
    customer_email text,
    status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'inactive')),
    source text not null default 'stripe',
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (workspace_id, stripe_customer_id)
);

create index if not exists billing_accounts_workspace_idx on billing.accounts(workspace_id);
create index if not exists billing_accounts_customer_email_idx on billing.accounts(lower(customer_email)) where customer_email is not null;
create index if not exists billing_accounts_subscription_idx on billing.accounts(stripe_subscription_id) where stripe_subscription_id is not null;
create index if not exists billing_accounts_checkout_session_idx on billing.accounts(stripe_checkout_session_id) where stripe_checkout_session_id is not null;

alter table billing.accounts enable row level security;

revoke all on schema billing from anon, authenticated;
revoke all on all tables in schema billing from anon, authenticated;
grant usage on schema billing to service_role;
grant select, insert, update on billing.accounts to service_role;

drop trigger if exists billing_accounts_touch_updated_at on billing.accounts;
create or replace function billing.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = billing, pg_temp
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

revoke execute on all functions in schema billing from anon, authenticated;

create trigger billing_accounts_touch_updated_at
before update on billing.accounts
for each row execute function billing.touch_updated_at();

comment on table billing.accounts is 'Stripe billing account to AutoKirk workspace/actor mapping used by the Stripe webhook. No browser role may read or write this table.';
comment on column billing.accounts.actor_id is 'Governed actor id used when Stripe opens obligations for this billing account.';
