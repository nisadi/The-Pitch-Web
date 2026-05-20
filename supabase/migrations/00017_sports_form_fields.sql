-- Align sports table with SportFormModal (slug, icon, description, updated_at)

alter table public.sports
  add column if not exists updated_at timestamptz not null default now();

alter table public.sports drop column if exists hourly_rate;

update public.sports
set
  slug = coalesce(
    nullif(trim(slug), ''),
    lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
  ),
  icon = coalesce(nullif(trim(icon), ''), slug),
  updated_at = coalesce(updated_at, now())
where slug is null or slug = '' or icon is null or icon = '';

create unique index if not exists sports_slug_unique on public.sports (slug);
