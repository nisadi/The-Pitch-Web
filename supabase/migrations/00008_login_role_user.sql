-- Login against public.role (email + bcrypt password)
-- Requires: 00009_enable_pgcrypto.sql
create extension if not exists pgcrypto with schema extensions;

create or replace function public.login_role_user(p_email text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.role%rowtype;
begin
  select * into v_row from public.role where email = lower(trim(p_email));

  if not found then
    return json_build_object('ok', false, 'error', 'Invalid email or password');
  end if;

  if v_row.status = 'disabled' then
    return json_build_object('ok', false, 'error', 'This account has been disabled.');
  end if;

  if v_row.password is null or v_row.password <> extensions.crypt(p_password, v_row.password) then
    return json_build_object('ok', false, 'error', 'Invalid email or password');
  end if;

  return json_build_object(
    'ok', true,
    'user', json_build_object(
      'id', v_row.id,
      'name', v_row.user_name,
      'email', v_row.email,
      'roleId', v_row.role,
      'status', v_row.status
    )
  );
end;
$$;

grant execute on function public.login_role_user(text, text) to anon, authenticated;
