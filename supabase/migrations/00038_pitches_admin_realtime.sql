-- Admin Settings → Pitches: CRUD + realtime (same pattern as sports/locations).

alter table public.pitches replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'pitches'
  ) then
    alter publication supabase_realtime add table public.pitches;
  end if;
end $$;

drop policy if exists "Anon insert pitches" on public.pitches;
create policy "Anon insert pitches"
  on public.pitches for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon update pitches" on public.pitches;
create policy "Anon update pitches"
  on public.pitches for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Anon delete pitches" on public.pitches;
create policy "Anon delete pitches"
  on public.pitches for delete
  to anon, authenticated
  using (true);
