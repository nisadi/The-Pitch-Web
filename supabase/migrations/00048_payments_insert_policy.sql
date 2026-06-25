-- Allow server-side (service-role) inserts and updates on payments.
-- Service-role bypasses RLS, but these policies also cover authenticated
-- server actions that run under the anon/authenticated roles.

drop policy if exists "Anon insert payments" on public.payments;
create policy "Anon insert payments"
  on public.payments for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon update payments" on public.payments;
create policy "Anon update payments"
  on public.payments for update
  to anon, authenticated
  using (true)
  with check (true);
