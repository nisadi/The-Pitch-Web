-- Events page cards: realtime for admin edits (idempotent)

alter publication supabase_realtime add table public.events;
