-- Admin-visible login password (plaintext for dashboard); login still uses bcrypt `password`

alter table public.role
  add column if not exists display_password text;

update public.role
set display_password = 'changeme'
where display_password is null;

create or replace function public.upsert_role_user(
  p_id uuid,
  p_user_name text,
  p_email text,
  p_role text,
  p_status text,
  p_password text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_email text := lower(trim(p_email));
begin
  if p_role not in ('admin', 'manager', 'staff') then
    raise exception 'Invalid role';
  end if;
  if p_status not in ('active', 'disabled') then
    raise exception 'Invalid status';
  end if;

  if p_id is not null and exists (select 1 from public.role where id = p_id) then
    update public.role
    set
      user_name = p_user_name,
      email = v_email,
      role = p_role,
      status = p_status,
      password = case
        when p_password is not null and length(p_password) > 0
        then extensions.crypt(p_password, extensions.gen_salt('bf'))
        else password
      end,
      display_password = case
        when p_password is not null and length(p_password) > 0
        then p_password
        else display_password
      end,
      updated_at = now()
    where id = p_id
    returning id into v_id;
  elsif exists (select 1 from public.role where email = v_email) then
    update public.role
    set
      user_name = p_user_name,
      role = p_role,
      status = p_status,
      password = case
        when p_password is not null and length(p_password) > 0
        then extensions.crypt(p_password, extensions.gen_salt('bf'))
        else password
      end,
      display_password = case
        when p_password is not null and length(p_password) > 0
        then p_password
        else display_password
      end,
      updated_at = now()
    where email = v_email
    returning id into v_id;
  else
    insert into public.role (id, user_name, email, role, status, password, display_password)
    values (
      coalesce(p_id, gen_random_uuid()),
      p_user_name,
      v_email,
      p_role,
      p_status,
      extensions.crypt(coalesce(nullif(p_password, ''), 'changeme'), extensions.gen_salt('bf')),
      coalesce(nullif(p_password, ''), 'changeme')
    )
    returning id into v_id;
  end if;

  return v_id;
end;
$$;
