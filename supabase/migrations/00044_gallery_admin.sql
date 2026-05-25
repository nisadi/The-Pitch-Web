-- Gallery images for public /gallery page + Admin Settings → Gallery.

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text not null default '',
  category text not null default 'Ground',
  position text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gallery add column if not exists position text;
alter table public.gallery add column if not exists sort_order int not null default 0;
alter table public.gallery add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_gallery_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gallery_set_updated_at on public.gallery;
create trigger gallery_set_updated_at
  before update on public.gallery
  for each row execute function public.set_gallery_updated_at();

alter table public.gallery enable row level security;

drop policy if exists "Public read active gallery" on public.gallery;
create policy "Public read active gallery"
  on public.gallery for select
  to public
  using (is_active = true);

drop policy if exists "Anon read all gallery admin" on public.gallery;
create policy "Anon read all gallery admin"
  on public.gallery for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon insert gallery" on public.gallery;
create policy "Anon insert gallery"
  on public.gallery for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon update gallery" on public.gallery;
create policy "Anon update gallery"
  on public.gallery for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Anon delete gallery" on public.gallery;
create policy "Anon delete gallery"
  on public.gallery for delete
  to anon, authenticated
  using (true);

alter table public.gallery replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'gallery'
  ) then
    alter publication supabase_realtime add table public.gallery;
  end if;
end $$;

-- Storage bucket for uploaded gallery images
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read gallery images" on storage.objects;
create policy "Public read gallery images"
  on storage.objects for select
  to public
  using (bucket_id = 'gallery');

drop policy if exists "Anon upload gallery images" on storage.objects;
create policy "Anon upload gallery images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'gallery');

drop policy if exists "Anon update gallery images" on storage.objects;
create policy "Anon update gallery images"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'gallery')
  with check (bucket_id = 'gallery');

drop policy if exists "Anon delete gallery images" on storage.objects;
create policy "Anon delete gallery images"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'gallery');

notify pgrst, 'reload schema';
