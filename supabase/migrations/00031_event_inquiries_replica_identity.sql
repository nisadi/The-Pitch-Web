-- Full row data for UPDATE/DELETE realtime payloads on event_inquiries
alter table public.event_inquiries replica identity full;
