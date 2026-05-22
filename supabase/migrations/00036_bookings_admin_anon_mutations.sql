-- Admin calendar: allow anon/authenticated writes (same pattern as locations/sports admin UI).
-- Service-role API remains preferred when SUPABASE_SERVICE_ROLE_KEY is set.

drop policy if exists "Anon insert bookings" on public.bookings;
create policy "Anon insert bookings"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon update bookings" on public.bookings;
create policy "Anon update bookings"
  on public.bookings for update
  to anon, authenticated
  using (true)
  with check (true);
