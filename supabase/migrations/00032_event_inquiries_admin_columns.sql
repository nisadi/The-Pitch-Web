-- Align event_inquiries with admin Events tab + public inquiry API

alter table public.event_inquiries
  add column if not exists reference_code text,
  add column if not exists thread_key text,
  add column if not exists subject text,
  add column if not exists location text,
  add column if not exists status text default 'new',
  add column if not exists replies jsonb default '[]'::jsonb,
  add column if not exists updated_at timestamptz default timezone('utc'::text, now());

update public.event_inquiries
set
  reference_code = coalesce(
    nullif(trim(reference_code), ''),
    'EVT-' || upper(substring(replace(id::text, '-', '') from 1 for 8))
  ),
  subject = coalesce(
    nullif(trim(subject), ''),
    nullif(trim(event_category), ''),
    nullif(trim(organization_name), ''),
    'Event inquiry'
  ),
  location = coalesce(nullif(trim(location), ''), 'Maharagama'),
  status = coalesce(nullif(trim(status), ''), 'new'),
  replies = coalesce(replies, '[]'::jsonb),
  updated_at = coalesce(updated_at, created_at, timezone('utc'::text, now())),
  thread_key = coalesce(
    thread_key,
    case
      when nullif(trim(email), '') is not null then 'email:' || lower(trim(email))
      when nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '') is not null
        then 'phone:' || regexp_replace(phone, '\D', '', 'g')
      else 'ref:' || id::text
    end
  )
where reference_code is null
   or reference_code = ''
   or subject is null
   or location is null
   or status is null
   or replies is null
   or updated_at is null
   or thread_key is null;

alter table public.event_inquiries
  alter column status set default 'new',
  alter column status set not null,
  alter column replies set default '[]'::jsonb,
  alter column replies set not null,
  alter column updated_at set default timezone('utc'::text, now()),
  alter column updated_at set not null;

alter table public.event_inquiries
  drop constraint if exists event_inquiries_status_check;

alter table public.event_inquiries
  add constraint event_inquiries_status_check
  check (status in ('new', 'in_progress', 'resolved', 'closed'));

alter table public.event_inquiries
  drop constraint if exists event_inquiries_reference_code_key;

alter table public.event_inquiries
  add constraint event_inquiries_reference_code_key unique (reference_code);

create index if not exists event_inquiries_thread_key_idx
  on public.event_inquiries (thread_key);

alter table public.event_inquiries replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.event_inquiries;
exception
  when duplicate_object then null;
end $$;

alter table public.event_inquiries enable row level security;

drop policy if exists "Anon read event_inquiries" on public.event_inquiries;
create policy "Anon read event_inquiries"
  on public.event_inquiries for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon insert event_inquiries" on public.event_inquiries;
create policy "Anon insert event_inquiries"
  on public.event_inquiries for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon update event_inquiries" on public.event_inquiries;
create policy "Anon update event_inquiries"
  on public.event_inquiries for update
  to anon, authenticated
  using (true)
  with check (true);
