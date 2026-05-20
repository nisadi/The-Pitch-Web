-- Enable realtime sync for public.role
alter publication supabase_realtime add table public.role;

drop policy if exists "Anon read role table" on public.role;
create policy "Anon read role table"
  on public.role for select
  to anon
  using (true);
