-- Improve UPDATE/DELETE payloads for Supabase Realtime

alter table public.contact_messages replica identity full;

-- Ensure table is in the realtime publication (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contact_messages'
  ) then
    alter publication supabase_realtime add table public.contact_messages;
  end if;
end $$;
