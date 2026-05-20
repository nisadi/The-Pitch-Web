-- Public bucket for location images (stored URL in locations.image_url)

insert into storage.buckets (id, name, public)
values ('locations', 'locations', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read location images" on storage.objects;
create policy "Public read location images"
  on storage.objects for select
  to public
  using (bucket_id = 'locations');

drop policy if exists "Anon upload location images" on storage.objects;
create policy "Anon upload location images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'locations');

drop policy if exists "Anon update location images" on storage.objects;
create policy "Anon update location images"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'locations')
  with check (bucket_id = 'locations');

drop policy if exists "Anon delete location images" on storage.objects;
create policy "Anon delete location images"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'locations');

