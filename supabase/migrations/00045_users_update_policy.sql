-- Allow authenticated users to update their own row in public.users
drop policy if exists "Users can update their own row" on public.users;

create policy "Users can update their own row"
  on public.users for update
  to authenticated
  using ( auth.uid() = id )
  with check ( auth.uid() = id );
