create or replace function public.delete_role_user(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.role where id = p_id;
end;
$$;

grant execute on function public.upsert_role_user(uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function public.delete_role_user(uuid) to anon, authenticated;
