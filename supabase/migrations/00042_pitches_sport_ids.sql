-- Multiple sports per pitch (same pattern as locations.sport_ids).

alter table public.pitches
  add column if not exists sport_ids uuid[] not null default '{}';

comment on column public.pitches.sport_ids is
  'Sports this pitch can be booked for. sport_id is kept as the primary (first) sport for legacy queries.';

update public.pitches
set sport_ids = array[sport_id]::uuid[]
where sport_id is not null
  and (sport_ids is null or sport_ids = '{}');
