-- Admin enquiries: extend event_inquiries for CustomerManagement + realtime

alter table public.event_inquiries
  add column if not exists reference_code text,
  add column if not exists subject text,
  add column if not exists location text,
  add column if not exists status text not null default 'new',
  add column if not exists replies jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.event_inquiries
  drop constraint if exists event_inquiries_status_check;

alter table public.event_inquiries
  add constraint event_inquiries_status_check
  check (status in ('new', 'in_progress', 'resolved', 'closed'));

alter table public.event_inquiries
  drop constraint if exists event_inquiries_reference_code_key;

alter table public.event_inquiries
  add constraint event_inquiries_reference_code_key unique (reference_code);

update public.event_inquiries
set
  reference_code = coalesce(
    reference_code,
    'ENQ-' || upper(substring(replace(id::text, '-', '') from 1 for 4))
  ),
  subject = coalesce(subject, event_category, organization_name, 'General enquiry'),
  location = coalesce(location, 'Maharagama')
where reference_code is null or subject is null or location is null;

alter publication supabase_realtime add table public.event_inquiries;

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

insert into public.event_inquiries (
  reference_code,
  organization_name,
  contact_person,
  email,
  phone,
  event_category,
  guest_count,
  preferred_date,
  requirements,
  subject,
  location,
  status,
  replies,
  created_at
)
values
  (
    'ENQ-2401',
    'Tharindu Bandara',
    'Tharindu Bandara',
    'tharindu.b@email.com',
    '+94 778901234',
    'Futsal',
    null,
    '2026-05-18',
    'Looking to book 3 futsal courts every Saturday morning for our office league. Need pricing for 3 months.',
    'Corporate booking',
    'Maharagama',
    'new',
    '[]'::jsonb,
    '2026-05-18 08:42:00+00'
  ),
  (
    'ENQ-2402',
    'Menaka Dias',
    'Menaka Dias',
    'menaka.d@email.com',
    '+94 763456789',
    'Badminton',
    null,
    '2026-05-18',
    'Do you offer monthly badminton memberships at Attidiya? What are the peak vs non-peak rates?',
    'Membership enquiry',
    'Attidiya',
    'in_progress',
    '[{"id":"REP-2402-1","date":"2026-05-18","time":"11:30","author":"Admin User","message":"Yes, we offer monthly memberships at Attidiya. Peak is LKR 4,500/month and non-peak is LKR 3,200/month. Reply if you would like to sign up."}]'::jsonb,
    '2026-05-18 10:15:00+00'
  ),
  (
    'ENQ-2403',
    'Chanuka Wijesinghe',
    'Chanuka Wijesinghe',
    'chanuka.w@email.com',
    '+94 766789012',
    'Futsal',
    null,
    '2026-05-17',
    'Is Pitch 2 available this Friday 7–9 PM? Want to confirm before paying online.',
    'Court availability',
    'Attidiya',
    'new',
    '[]'::jsonb,
    '2026-05-17 14:30:00+00'
  )
on conflict on constraint event_inquiries_reference_code_key do update set
  contact_person = excluded.contact_person,
  requirements = excluded.requirements,
  subject = excluded.subject,
  location = excluded.location,
  status = excluded.status,
  replies = excluded.replies,
  updated_at = now();
