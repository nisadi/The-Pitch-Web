-- Document blocked status; constraint update is in 00037_booking_status_blocked_check.sql.

comment on column public.bookings.booking_status is
  'pending | confirmed | completed | cancelled | blocked (blocked = admin hold, not bookable online)';
