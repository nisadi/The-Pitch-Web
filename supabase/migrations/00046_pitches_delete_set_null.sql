-- Allow deleting pitches that have historical bookings.
-- Bookings keep their records; pitch_id is cleared when a pitch is removed.

alter table public.bookings
  alter column pitch_id drop not null;

alter table public.bookings
  drop constraint if exists bookings_pitch_id_fkey;

alter table public.bookings
  add constraint bookings_pitch_id_fkey
  foreign key (pitch_id) references public.pitches(id) on delete set null;
