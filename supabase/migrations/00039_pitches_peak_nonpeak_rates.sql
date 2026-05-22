-- Peak / non-peak pricing per pitch (aligned with locations pricing model).

alter table public.pitches
  add column if not exists peak_hour_rate numeric not null default 0,
  add column if not exists non_peak_hour_rate numeric not null default 0;

comment on column public.pitches.peak_hour_rate is
  'LKR per hour during peak times (evenings, weekends).';
comment on column public.pitches.non_peak_hour_rate is
  'LKR per hour during non-peak times.';
comment on column public.pitches.price_per_hour is
  'Legacy single rate; kept in sync with peak_hour_rate for older clients.';

-- Backfill from existing price_per_hour (non-peak ~75% of peak when unset).
update public.pitches
set
  peak_hour_rate = coalesce(nullif(peak_hour_rate, 0), price_per_hour, 0),
  non_peak_hour_rate = coalesce(
    nullif(non_peak_hour_rate, 0),
    round(coalesce(price_per_hour, 0) * 0.75),
    0
  )
where peak_hour_rate = 0 or non_peak_hour_rate = 0;

update public.pitches
set price_per_hour = peak_hour_rate
where price_per_hour is distinct from peak_hour_rate;
