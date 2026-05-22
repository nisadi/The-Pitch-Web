-- Pricing lives on pitches (peak_hour_rate / non_peak_hour_rate), not locations.

alter table public.locations
  drop column if exists peak_hour_rate,
  drop column if exists non_peak_hour_rate;
