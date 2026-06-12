-- Allow admin location delete to succeed when bookings reference the venue.
-- Pitches and reviews already cascade; bookings previously blocked deletion (NO ACTION).
-- Payments cascade from bookings when those rows are removed.

alter table public.bookings
  drop constraint if exists bookings_location_id_fkey;

alter table public.bookings
  add constraint bookings_location_id_fkey
  foreign key (location_id) references public.locations (id) on delete cascade;
