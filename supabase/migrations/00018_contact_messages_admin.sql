-- Admin enquiries: extend contact_messages for CustomerManagement + realtime

alter table public.contact_messages
  add column if not exists reference_code text,
  add column if not exists phone text,
  add column if not exists location text,
  add column if not exists status text not null default 'new',
  add column if not exists replies jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.contact_messages
  drop constraint if exists contact_messages_status_check;

alter table public.contact_messages
  add constraint contact_messages_status_check
  check (status in ('new', 'in_progress', 'resolved', 'closed'));

create unique index if not exists contact_messages_reference_code_key
  on public.contact_messages (reference_code);

update public.contact_messages
set
  reference_code = coalesce(
    reference_code,
    'ENQ-' || upper(substr(replace(id::text, '-', ''), 1, 4))
  ),
  subject = coalesce(subject, 'General enquiry'),
  status = coalesce(status, 'new'),
  replies = coalesce(replies, '[]'::jsonb),
  updated_at = coalesce(updated_at, created_at, now())
where reference_code is null;

alter publication supabase_realtime add table public.contact_messages;

drop policy if exists "Anon read contact_messages" on public.contact_messages;
create policy "Anon read contact_messages"
  on public.contact_messages for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon insert contact_messages" on public.contact_messages;
create policy "Anon insert contact_messages"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon update contact_messages" on public.contact_messages;
create policy "Anon update contact_messages"
  on public.contact_messages for update
  to anon, authenticated
  using (true)
  with check (true);
