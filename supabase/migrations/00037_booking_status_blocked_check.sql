-- Allow booking_status = 'blocked' for admin calendar holds (00035 was comment-only).

alter table public.bookings
  drop constraint if exists bookings_booking_status_check;

alter table public.bookings
  add constraint bookings_booking_status_check
  check (
    booking_status = any (
      array[
        'pending'::text,
        'confirmed'::text,
        'cancelled'::text,
        'completed'::text,
        'blocked'::text
      ]
    )
  );
