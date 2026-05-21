-- Admin payments: joined reads (payments → bookings → users/locations/sports/pitches) + realtime

alter table public.payments replica identity full;
alter table public.bookings replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'payments'
  ) then
    alter publication supabase_realtime add table public.payments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'users'
  ) then
    alter publication supabase_realtime add table public.users;
  end if;
end $$;

drop policy if exists "Anon read payments" on public.payments;
create policy "Anon read payments"
  on public.payments for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon read bookings" on public.bookings;
create policy "Anon read bookings"
  on public.bookings for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon read users" on public.users;
create policy "Anon read users"
  on public.users for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon read pitches" on public.pitches;
create policy "Anon read pitches"
  on public.pitches for select
  to anon, authenticated
  using (true);
