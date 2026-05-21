-- Align locations table with LocationFormModal fields

-- sportIds in the form → sport_ids (uuid strings), not legacy slug names
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'locations'
      and column_name = 'sport_slugs'
  ) then
    alter table public.locations rename column sport_slugs to sport_ids;
  end if;
end $$;

-- email is not collected in admin location form
alter table public.locations drop column if exists email;

-- short_name is canonical; keep city in sync for legacy filters/queries
update public.locations
set
  short_name = coalesce(nullif(trim(short_name), ''), nullif(trim(city), ''), trim(name)),
  city = coalesce(nullif(trim(short_name), ''), nullif(trim(city), ''), trim(name))
where short_name is null or city is null or city is distinct from short_name;