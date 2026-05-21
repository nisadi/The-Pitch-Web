-- Match SportFormModal: hourly rate + admin client access + realtime

alter table public.sports
  add column if not exists hourly_rate numeric not null default 0;

alter publication supabase_realtime add table public.sports;

drop policy if exists "Anon read sports" on public.sports;
create policy "Anon read sports"
  on public.sports for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon insert sports" on public.sports;
create policy "Anon insert sports"
  on public.sports for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon update sports" on public.sports;
create policy "Anon update sports"
  on public.sports for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Anon delete sports" on public.sports;
create policy "Anon delete sports"
  on public.sports for delete
  to anon, authenticated
  using (true);
