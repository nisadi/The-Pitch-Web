-- Admin settings: extend locations to match LocationFormModal + realtime



alter table public.locations

  add column if not exists slug text,

  add column if not exists short_name text,

  add column if not exists peak_hour_rate numeric not null default 0,

  add column if not exists non_peak_hour_rate numeric not null default 0,

  add column if not exists sport_ids text[] not null default '{}',

  add column if not exists updated_at timestamptz not null default now();



update public.locations

set

  slug = coalesce(

    slug,

    lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))

  ),

  short_name = coalesce(nullif(trim(short_name), ''), nullif(trim(city), ''), trim(name)),

  updated_at = coalesce(updated_at, now())

where slug is null or short_name is null;



create unique index if not exists locations_slug_unique on public.locations (slug);



alter publication supabase_realtime add table public.locations;



drop policy if exists "Anon read locations" on public.locations;

create policy "Anon read locations"

  on public.locations for select

  to anon, authenticated

  using (true);



drop policy if exists "Anon insert locations" on public.locations;

create policy "Anon insert locations"

  on public.locations for insert

  to anon, authenticated

  with check (true);



drop policy if exists "Anon update locations" on public.locations;

create policy "Anon update locations"

  on public.locations for update

  to anon, authenticated

  using (true)

  with check (true);



drop policy if exists "Anon delete locations" on public.locations;

create policy "Anon delete locations"

  on public.locations for delete

  to anon, authenticated

  using (true);


