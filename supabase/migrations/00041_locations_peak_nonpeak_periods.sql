-- Peak / non-peak time-of-day windows per location (pitch rates apply within these periods).

alter table public.locations
  add column if not exists non_peak_start text not null default '06:00',
  add column if not exists non_peak_end text not null default '12:00',
  add column if not exists peak_start text not null default '18:00',
  add column if not exists peak_end text not null default '22:00';

comment on column public.locations.non_peak_start is
  'Start of daily non-peak window (24h HH:mm or legacy AM/PM text).';
comment on column public.locations.non_peak_end is
  'End of daily non-peak window.';
comment on column public.locations.peak_start is
  'Start of daily peak window.';
comment on column public.locations.peak_end is
  'End of daily peak window.';

update public.locations
set
  non_peak_start = coalesce(nullif(trim(non_peak_start), ''), '06:00'),
  non_peak_end = coalesce(nullif(trim(non_peak_end), ''), '12:00'),
  peak_start = coalesce(nullif(trim(peak_start), ''), '18:00'),
  peak_end = coalesce(nullif(trim(peak_end), ''), '22:00');
