-- Walk-in / manual booking contact (shown in admin calendar; avoids reusing a random users row).

alter table public.bookings
  add column if not exists guest_name text,
  add column if not exists guest_email text,
  add column if not exists guest_phone text;

comment on column public.bookings.guest_name is
  'Customer name for admin manual bookings (overrides linked user display).';
comment on column public.bookings.guest_email is
  'Customer email for admin manual bookings.';
comment on column public.bookings.guest_phone is
  'Customer phone for admin manual bookings.';
