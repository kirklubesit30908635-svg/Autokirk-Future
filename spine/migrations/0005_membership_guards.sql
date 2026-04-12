create or replace function core.assert_member(
    p_workspace_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if p_workspace_id is null then
        raise exception 'WORKSPACE_ID_REQUIRED';
    end if;

    if p_user_id is null then
        raise exception 'ACTOR_ID_REQUIRED';
    end if;

    if not exists (
        select 1
        from core.workspace_members wm
        where wm.workspace_id = p_workspace_id
          and wm.user_id = p_user_id
    ) then
        raise exception 'ACTOR_NOT_AUTHORIZED_FOR_WORKSPACE';
    end if;
end;
$$;

create or replace function core.assert_member(
    p_workspace_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid;
begin
    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception 'AUTH_UID_REQUIRED';
    end if;

    perform core.assert_member(p_workspace_id, v_user_id);
end;
$$;
