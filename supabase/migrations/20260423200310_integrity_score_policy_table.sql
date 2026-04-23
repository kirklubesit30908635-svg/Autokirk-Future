begin;

create schema if not exists governance;

create table if not exists governance.integrity_score_policy (
    policy_key text primary key,
    label text not null,
    severity_rank integer not null unique,
    min_score numeric null,
    max_score numeric null,
    overdue_days_floor integer null,
    failed_performance_floor integer null,
    weak_proof_floor integer null,
    rolling_window_days integer not null default 30,
    action_mode text not null default 'informational',
    is_active boolean not null default true,
    notes text,
    created_at timestamptz not null default now(),
    constraint integrity_score_policy_action_mode_check
        check (action_mode in ('informational', 'internal', 'contractual')),
    constraint integrity_score_policy_score_bounds_check
        check (min_score is null or max_score is null or min_score <= max_score)
);

insert into governance.integrity_score_policy (
    policy_key,
    label,
    severity_rank,
    min_score,
    max_score,
    overdue_days_floor,
    failed_performance_floor,
    weak_proof_floor,
    rolling_window_days,
    action_mode,
    notes
)
values
    ('healthy',  'healthy',  1, 90, 100, null, null, null, 30, 'informational', 'baseline healthy range'),
    ('warning',  'warning',  2, 70,  89, 14,   null, null, 30, 'informational', 'attention required'),
    ('critical', 'critical', 3, 40,  69, 7,    2,    2,    30, 'internal',      'elevated operational risk'),
    ('failed',   'failed',   4, null, 39, 3,    1,    3,    30, 'contractual',   'material reliability failure')
on conflict (policy_key) do update
set
    label = excluded.label,
    severity_rank = excluded.severity_rank,
    min_score = excluded.min_score,
    max_score = excluded.max_score,
    overdue_days_floor = excluded.overdue_days_floor,
    failed_performance_floor = excluded.failed_performance_floor,
    weak_proof_floor = excluded.weak_proof_floor,
    rolling_window_days = excluded.rolling_window_days,
    action_mode = excluded.action_mode,
    is_active = true,
    notes = excluded.notes;

commit;
