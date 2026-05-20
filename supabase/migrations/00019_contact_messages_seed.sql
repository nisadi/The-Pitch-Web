-- Sample enquiries for admin CustomerManagement (idempotent)

insert into public.contact_messages (
  reference_code,
  full_name,
  email,
  phone,
  subject,
  message,
  location,
  status,
  replies,
  created_at,
  updated_at
)
values
  (
    'ENQ-2401',
    'Tharindu Bandara',
    'tharindu.b@email.com',
    '+94 778901234',
    'Corporate booking',
    'Looking to book 3 futsal courts every Saturday morning for our office league. Need pricing for 3 months.',
    'Maharagama',
    'new',
    '[]'::jsonb,
    '2026-05-18 08:42:00+05:30',
    '2026-05-18 08:42:00+05:30'
  ),
  (
    'ENQ-2402',
    'Menaka Dias',
    'menaka.d@email.com',
    '+94 763456789',
    'Membership enquiry',
    'Do you offer monthly badminton memberships at Attidiya? What are the peak vs non-peak rates?',
    'Attidiya',
    'in_progress',
    '[{"id":"REP-2402-1","inReplyTo":"ENQ-2402","date":"2026-05-18","time":"11:30","created_at":"2026-05-18T11:30:00+00:00","author":"Admin User","message":"Yes, we offer monthly memberships at Attidiya. Peak is LKR 4,500/month and non-peak is LKR 3,200/month."}]'::jsonb,
    '2026-05-18 10:15:00+05:30',
    '2026-05-18 11:30:00+05:30'
  ),
  (
    'ENQ-2403',
    'Chanuka Wijesinghe',
    'chanuka.w@email.com',
    '+94 766789012',
    'Court availability',
    'Is Pitch 2 available this Friday 7–9 PM? Want to confirm before paying online.',
    'Attidiya',
    'new',
    '[]'::jsonb,
    '2026-05-17 14:30:00+05:30',
    '2026-05-17 14:30:00+05:30'
  ),
  (
    'ENQ-2404',
    'School Sports Academy',
    'admin@schoolsports.lk',
    '+94 117654321',
    'School programme',
    'We run a U-15 cricket programme and need weekly net sessions at Moratuwa. Can we get a term package?',
    'Moratuwa',
    'in_progress',
    '[]'::jsonb,
    '2026-05-17 16:05:00+05:30',
    '2026-05-17 16:05:00+05:30'
  ),
  (
    'ENQ-2405',
    'Ishara Mendis',
    'ishara.m@email.com',
    '+94 779012345',
    'Refund request',
    'Booking BK-10461 was cancelled due to rain. Please confirm refund timeline to my card.',
    'Attidiya',
    'resolved',
    '[{"id":"REP-2405-1","inReplyTo":"ENQ-2405","date":"2026-05-16","time":"14:00","created_at":"2026-05-16T14:00:00+00:00","author":"Admin User","message":"Your refund for BK-10461 has been processed. It should appear on your card within 5–7 business days."}]'::jsonb,
    '2026-05-16 11:20:00+05:30',
    '2026-05-16 14:00:00+05:30'
  ),
  (
    'ENQ-2406',
    'Daniel Francis',
    'daniel.f@email.com',
    '+94 768901234',
    'Payment failed',
    'Tried to pay for badminton court twice but card keeps failing. Can I pay cash on arrival?',
    'Maharagama',
    'resolved',
    '[]'::jsonb,
    '2026-05-15 09:00:00+05:30',
    '2026-05-15 09:00:00+05:30'
  ),
  (
    'ENQ-2407',
    'Unknown',
    'guest@example.com',
    '+94 701112233',
    'General enquiry',
    'What are your opening hours on public holidays? Planning a family booking.',
    'Maharagama',
    'closed',
    '[]'::jsonb,
    '2026-05-14 18:45:00+05:30',
    '2026-05-14 18:45:00+05:30'
  ),
  (
    'ENQ-2408',
    'Hashini Perera',
    'hashini.p@email.com',
    '+94 767890123',
    'Event space',
    'Need an indoor area for a 40-person awards night. Do you host events or only sports bookings?',
    'Moratuwa',
    'new',
    '[]'::jsonb,
    '2026-05-12 13:10:00+05:30',
    '2026-05-12 13:10:00+05:30'
  )
on conflict (reference_code) do nothing;

-- Second message from same customer (threads with ENQ-2402 by email)
insert into public.contact_messages (
  reference_code,
  full_name,
  email,
  phone,
  subject,
  message,
  location,
  status,
  replies,
  created_at,
  updated_at
)
values (
  'ENQ-2402B',
  'Menaka Dias',
  'menaka.d@email.com',
  '+94 763456789',
  'Membership follow-up',
  'Thanks for the rates. Can I start the membership from next Monday?',
  'Attidiya',
  'new',
  '[]'::jsonb,
  '2026-05-19 09:30:00+05:30',
  '2026-05-19 09:30:00+05:30'
)
on conflict (reference_code) do nothing;
