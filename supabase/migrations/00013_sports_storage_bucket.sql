-- Public bucket for sport images (stored URL in sports.image_url)

insert into storage.buckets (id, name, public)
values ('sports', 'sports', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read sports images" on storage.objects;
create policy "Public read sports images"
  on storage.objects for select
  to public
  using (bucket_id = 'sports');

drop policy if exists "Anon upload sports images" on storage.objects;
create policy "Anon upload sports images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'sports');

drop policy if exists "Anon update sports images" on storage.objects;
create policy "Anon update sports images"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'sports')
  with check (bucket_id = 'sports');

drop policy if exists "Anon delete sports images" on storage.objects;
create policy "Anon delete sports images"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'sports');
