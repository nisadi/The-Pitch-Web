-- Allow client writes + fix upsert_role_user to update by id or email

drop policy if exists "Anon insert role table" on public.role;
create policy "Anon insert role table"
  on public.role for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon update role table" on public.role;
create policy "Anon update role table"
  on public.role for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Anon delete role table" on public.role;
create policy "Anon delete role table"
  on public.role for delete
  to anon, authenticated
  using (true);
