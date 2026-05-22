-- Event inquiries: thread grouping for admin Events tab

alter table public.event_inquiries
  add column if not exists thread_key text;

update public.event_inquiries
set thread_key = case
  when nullif(trim(email), '') is not null then 'email:' || lower(trim(email))
  when nullif(regexp_replace(phone, '\D', '', 'g'), '') is not null
    then 'phone:' || regexp_replace(phone, '\D', '', 'g')
  else 'ref:' || id::text
end
where thread_key is null;

create index if not exists event_inquiries_thread_key_idx
  on public.event_inquiries (thread_key);
