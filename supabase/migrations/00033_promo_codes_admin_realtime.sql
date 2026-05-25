-- Admin offers: promo_codes realtime + client mutations (idempotent)

alter publication supabase_realtime add table public.promo_codes;

drop policy if exists "Anon read promo_codes" on public.promo_codes;
create policy "Anon read promo_codes"
  on public.promo_codes for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon insert promo_codes" on public.promo_codes;
create policy "Anon insert promo_codes"
  on public.promo_codes for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon update promo_codes" on public.promo_codes;
create policy "Anon update promo_codes"
  on public.promo_codes for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Anon delete promo_codes" on public.promo_codes;
create policy "Anon delete promo_codes"
  on public.promo_codes for delete
  to anon, authenticated
  using (true);
