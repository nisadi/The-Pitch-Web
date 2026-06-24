-- Allow the service role (admin API) to insert rows into public.users
-- when creating guest/walk-in customers from admin manual bookings.

drop policy if exists "Service role insert users" on public.users;
create policy "Service role insert users"
  on public.users for insert
  to service_role
  with check (true);

-- Also allow service role to update (e.g. backfill phone)
drop policy if exists "Service role update users" on public.users;
create policy "Service role update users"
  on public.users for update
  to service_role
  using (true)
  with check (true);
