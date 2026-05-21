-- Bookings: use booking_date + start_time + end_time for the slot period (drop special_notes)

alter table public.bookings
  drop column if exists special_notes;
